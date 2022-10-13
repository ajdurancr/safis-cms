import get from 'lodash.get';
import isNil from 'lodash.isnil';

import { FileApi } from './file';
import {
  ContentApiInterface,
  CreateContentArgs,
  DeleteContentArgs,
  FileContentTypesEnum,
  FileApiInterface,
  GenericContent,
  GetFileContentArgs,
  GetFolderContentArgs,
  RepoInfo,
  UnifiedClients,
  UpdateContentArgs,
  RepoPathsEnum,
  GetContentArgs,
  GetAllContentArgs,
} from '../types';
import { FILE_EXTENSION, repoPathTransforms } from '../constants';

const defaultRepoPaths = {
  [RepoPathsEnum.CONTENT]: 'content',
  [RepoPathsEnum.CONTENT_TYPE]: 'contentType',
};

class ContentApi implements ContentApiInterface {
  protected fileContentTypeName: FileContentTypesEnum

  protected fileApi: FileApiInterface

  protected repoInfo: RepoInfo

  protected rootPath: string

  constructor(
    clients: UnifiedClients,
    repoInfo: RepoInfo,
    fileContentTypeName: FileContentTypesEnum,
  ) {
    this.fileContentTypeName = fileContentTypeName;
    const repoPathType = repoPathTransforms[fileContentTypeName];
    this.rootPath = repoInfo.paths[repoPathType] as string;
    this.repoInfo = repoInfo;
    this.fileApi = new FileApi(clients, repoInfo);
  }

  private _getFullPath = (contentPath: string, subFolder?: string): string => `${this._getFolderPath(subFolder)}${contentPath}`

  private _getFolderPath = (subFolderName?: string): string => {
    if (!subFolderName) return this.rootPath;

    const subFolderPath = subFolderName.endsWith('/') ? subFolderName : `${subFolderName}/`;

    return `${this.rootPath}${subFolderPath}`;
  }

  private _getContentFileName = (id: string): string => {
    if (!id) {
      throw new Error(`"id" property is required to retrieve the ${this.fileContentTypeName}`);
    }

    return `${id}.${FILE_EXTENSION}`;
  }

  create = async (args: CreateContentArgs): Promise<GenericContent> => {
    const {
      branch,
      subFolder,
      content,
      commitMessage = this.getDefaultCommitMessage('Add'),
    } = args;
    const fileName = this._getContentFileName(content.id);
    const fullPath = this._getFullPath(fileName, subFolder);
    const fileContent = await this.fileApi.getFileContent({
      path: fullPath,
      branch,
    });

    if (!isNil(fileContent)) throw new Error(`${this.fileContentTypeName} already exists.`);

    await this.fileApi.createFileContent({
      branch,
      files: {
        content: JSON.stringify(content),
        path: fullPath,
      },
      commitMessage,
    });

    return content;
  }

  delete = async (args: DeleteContentArgs): Promise<boolean> => {
    const {
      branch,
      subFolder,
      id,
      commitMessage = this.getDefaultCommitMessage('Delete'),
    } = args;
    const fileName = this._getContentFileName(id);
    const fullPath = this._getFullPath(fileName, subFolder);
    const fileContent = await this.fileApi.getFileContent({
      path: fullPath,
      branch,
    });

    if (isNil(fileContent)) throw new Error(`${this.fileContentTypeName} not found.`);

    await this.fileApi.deleteFileContent({
      branch,
      path: fullPath,
      commitMessage,
    });

    return true;
  }

  get = async (args: GetContentArgs): Promise<GenericContent | null> => {
    const { id, subFolder, branch } = args;
    const fileName = this._getContentFileName(id);
    const fileContent = await this.fileApi.getFileContent({
      path: this._getFullPath(fileName, subFolder),
      branch,
    });

    if (isNil(fileContent)) return null;

    return JSON.parse(fileContent);
  }

  protected getDefaultCommitMessage = (action: string): string => `${action} ${this.fileContentTypeName} - Safis CMS`

  getAll = async (args: GetAllContentArgs): Promise<GenericContent[]> => {
    const { branch, subFolder } = args;
    const filesContent = await this.fileApi.getFolderContent({
      path: this._getFolderPath(subFolder),
      branch,
    });

    return filesContent.reduce((filtered, entry) => {
      const content = get(entry, 'object.text') as string | undefined;

      if (!isNil(content)) {
        filtered.push(JSON.parse(content as string));
      }

      return filtered;
    }, [] as GenericContent[]);
  }

  update = async (args: UpdateContentArgs): Promise<GenericContent> => {
    const {
      branch,
      subFolder,
      content: newContent,
      commitMessage = this.getDefaultCommitMessage('Update'),
    } = args;
    const fileName = this._getContentFileName(newContent.id);
    const fullPath = this._getFullPath(fileName, subFolder);
    const fileContent = await this.fileApi.getFileContent({
      path: fullPath,
      branch,
    });

    if (isNil(fileContent)) throw new Error(`${this.fileContentTypeName} not found.`);

    const parsedExistingContent = JSON.parse(fileContent);

    const mergedContent = {
      ...parsedExistingContent,
      ...newContent,
    };

    await this.fileApi.createFileContent({
      branch,
      files: {
        content: JSON.stringify(mergedContent),
        path: fullPath,
      },
      commitMessage,
    });

    return mergedContent;
  }
}

export { ContentApi };
