import get from 'lodash.get';
import { z } from 'zod';

import {
  Tree,
  CreateSingleTreeItemArgs,
  UnifiedClients,
  FileApiInterface,
  ContentInfo,
  CreateFileContentArgs,
  InputFile,
  CreateBlobInfoArgs,
  BlobInfo,
  GraphQLContentEntry,
  GetFolderContentArgs,
  GetFileContentArgs,
  DeleteFileContentArgs,
  GetFilteredFilesContentArgs,
  GraphQLClientErrorsEnum,
  GitHubGraphQLError,
} from '../types';
import { adapterSchema } from '../zodSchema';
import { zodParse } from '../helpers';
import { gitFileMode, gitItemType } from '../constants';

const TYPENAME_BLOB = 'Blob'; // used to compare against GraphQL api responses

const zRepoArgs = adapterSchema.repoInfo.pick({
  owner: true,
  name: true,
  defaultBranch: true,
});

type RepoArgs = z.infer<typeof zRepoArgs>

class FileApi implements FileApiInterface {
  protected clients: UnifiedClients

  private _repoInfo: RepoArgs

  constructor(unifiedClients: UnifiedClients, repoInfo: RepoArgs) {
    zodParse(zRepoArgs, repoInfo);

    this.clients = unifiedClients;
    this._repoInfo = repoInfo;
  }

  createSingleTreeItem = ({ path, blob: { sha } }: CreateSingleTreeItemArgs): Tree => ({
    mode: gitFileMode.BLOB,
    type: gitItemType.BLOB,
    path,
    sha,
  }) as Tree & { sha: string | null}

  createTreeItems = (
    blobInfo: CreateSingleTreeItemArgs[] | CreateSingleTreeItemArgs,
    isList?: boolean,
  ): Tree[] => {
    if (!isList) return [this.createSingleTreeItem(blobInfo as CreateSingleTreeItemArgs)];

    return (blobInfo as CreateSingleTreeItemArgs[]).map(this.createSingleTreeItem);
  }

  createBlobInfo = async (args: CreateBlobInfoArgs): Promise<BlobInfo | BlobInfo[]> => {
    const { owner, name: repo } = this._repoInfo;
    const {
      files,
      isList,
    } = args;

    if (!isList) {
      const { path, content } = files as InputFile;
      const blob = await this.clients.rest.createBlob({
        repo,
        owner,
        content,
      });

      return { path, blob } as BlobInfo;
    }

    const blobPromises = (files as InputFile[]).map(async ({ path, content }) => {
      const blob = await this.clients.rest.createBlob({
        repo,
        owner,
        content,
      });

      return { path, blob } as BlobInfo;
    });

    return Promise.all(blobPromises);
  }

  createFileContent = async (args: CreateFileContentArgs): Promise<ContentInfo | ContentInfo[]> => {
    const { owner, name: repo, defaultBranch } = this._repoInfo;
    const {
      branch: targetBranch,
      files,
      commitMessage,
    } = args;
    const branch = targetBranch || defaultBranch;
    const parentCommitInfo = await this.clients.graphql.getBaseCommitInfo({
      owner,
      repo,
      branch,
    });

    const parentCommit = get(parentCommitInfo, 'repository.ref.target.commitSha');
    const baseTree = get(parentCommitInfo, 'repository.ref.target.tree.sha');
    const isList = Array.isArray(files);

    const blobInfo = await this.createBlobInfo({
      files,
      isList,
    });

    const treeItems = await this.createTreeItems(blobInfo, isList);

    const { sha: treeSha } = await this.clients.rest.createTree({
      repo,
      owner,
      baseTree,
      treeItems,
    });

    const { sha: commitSha } = await this.clients.rest.createCommit({
      owner,
      repo,
      message: commitMessage,
      tree: treeSha,
      parents: parentCommit ? [parentCommit] : [],
    });

    await this.clients.rest.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: commitSha,
    });

    return isList
      ? (blobInfo as BlobInfo[]).map(({ path, blob: { sha } }) => ({
        path,
        sha,
      })) as ContentInfo[]
      : ({
        path: (blobInfo as BlobInfo).path,
        sha: (blobInfo as BlobInfo).blob.sha,
      }) as ContentInfo;
  }

  deleteFileContent = async (args: DeleteFileContentArgs): Promise<boolean> => {
    const { owner, name: repo, defaultBranch } = this._repoInfo;
    const {
      branch: targetBranch,
      path,
      commitMessage,
    } = args;
    const branch = targetBranch || defaultBranch;
    const parentCommitInfo = await this.clients.graphql.getBaseCommitInfo({ owner, repo, branch });

    const parentCommit = get(parentCommitInfo, 'repository.ref.target.commitSha');
    const baseTree = get(parentCommitInfo, 'repository.ref.target.tree.sha');

    const treeItems = await this.createTreeItems({
      path,
      blob: { sha: null }, // sha=null will delete file
    });

    const { sha: treeSha } = await this.clients.rest.createTree({
      repo,
      owner,
      baseTree,
      treeItems,
    });

    const { sha: commitSha } = await this.clients.rest.createCommit({
      owner,
      repo,
      message: commitMessage,
      tree: treeSha,
      parents: parentCommit ? [parentCommit] : [],
    });

    await this.clients.rest.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: commitSha,
    });

    return true;
  }

  getFileContent = async (args: GetFileContentArgs): Promise<string> => {
    const { owner, name: repo, defaultBranch } = this._repoInfo;
    const {
      branch: targetBranch,
      path,
    } = args;
    const response = await this.clients.graphql.getFileContent({
      owner,
      repo,
      branch: targetBranch || defaultBranch,
      path,
    }).catch((errorResponse: any[]) => {
      if (get(errorResponse, 'errors[0].type') === GraphQLClientErrorsEnum.NOT_FOUND) return null;

      throw errorResponse;
    });

    return get(response, 'repository.ref.target.file.object.text', null);
  }

  getFilteredFilesContent = async (
    args: GetFilteredFilesContentArgs,
  ): Promise<(string | null
)[]> => {
    const { owner, name: repo, defaultBranch } = this._repoInfo;
    const {
      branch: targetBranch,
      files,
    } = args;
    const filesInfo = files.map(({ id, path }) => ({
      id,
      path,
      fieldName: `file_${id.replace(/[-\s]/g, '_')}`,
    }));
    const nonDupFiles = [...filesInfo.reduce((filesMap, file) => {
      filesMap.set(file.id, file);

      return filesMap;
    }, new Map()).values()];
    const response = await this.clients.graphql.getFilteredFilesContent({
      owner,
      repo,
      branch: targetBranch || defaultBranch,
      files: nonDupFiles,
    }).catch((errorResponse: { data: any, errors: GitHubGraphQLError[] }) => {
      const nonAllowedErrors = errorResponse.errors
        .some(({ type }: any) => type !== GraphQLClientErrorsEnum.NOT_FOUND);

      if (nonAllowedErrors) throw errorResponse.errors;

      return errorResponse.data;
    });

    const filesMap = get(response, 'repository.ref.target');

    return filesInfo.map(({ fieldName }) => filesMap[fieldName] || null);
  }

  getFolderContent = async (args: GetFolderContentArgs): Promise<string[]> => {
    const { owner, name: repo, defaultBranch } = this._repoInfo;
    const {
      branch: targetBranch,
      path,
    } = args;

    const response = await this.clients.graphql.getFolderContent({
      owner,
      repo,
      branch: targetBranch || defaultBranch,
      path,
    }).catch((errorResponse: any[]) => {
      if (get(errorResponse, 'errors[0].type') === GraphQLClientErrorsEnum.NOT_FOUND) return null;

      throw errorResponse;
    });

    if (!response) return [];

    const entries: GraphQLContentEntry[] = get(response, 'repository.ref.target.files.object.entries') || [];
    const filesContent = entries
      .filter((entry: GraphQLContentEntry) => get(entry, 'object.__typename') === TYPENAME_BLOB)
      .map((entry) => entry.object.text);

    return filesContent;
  }
}

export { FileApi };
