import get from 'lodash.get';
import { z } from 'zod';

import {
  InitRepoArgs,
  InitRepoResponse,
  RespositoryApiInterface,
  UnifiedClients,
  GraphQLGetRepositoryResponse,
  RepoInfo,
  RepoPaths,
} from '../types';
import { FileApi } from './file';
import { DEFAULT_REPO_DESCRIPTION } from '../constants';
import { adapterSchema } from '../zodSchema';
import { zodParse } from '../helpers';

const zRepoArgs = adapterSchema.repoInfo.pick({
  owner: true,
  name: true,
  paths: true,
});

type RepoArgs = z.infer<typeof zRepoArgs>

class RepositoryApi implements RespositoryApiInterface {
  protected clients: UnifiedClients

  private _defaultBranch?: string

  private _owner: string

  private _name: string

  private _paths: RepoPaths

  constructor(unifiedClients: UnifiedClients, repoArgs: RepoArgs) {
    const parsedArgs = zodParse(zRepoArgs, repoArgs);

    this._owner = parsedArgs.owner;
    this._name = parsedArgs.name;
    this._paths = parsedArgs.paths;
    this.clients = unifiedClients;
  }

  init = async (args: InitRepoArgs): Promise<InitRepoResponse> => {
    const {
      isPrivate = false,
      description,
    } = args;
    const existingRepoInfo = await this.getInfo()
      .catch((error: { type: string }[]) => {
        if (get(error, 'errors[0].type') === 'NOT_FOUND') return {};

        throw error;
      });

    if (get(existingRepoInfo, 'name')) {
      this._defaultBranch = this._defaultBranch || get(existingRepoInfo, 'defaultBranch');

      return InitRepoResponse.FOUND;
    }

    const name = this._name;

    const { default_branch: defaultBranch } = await this.clients.rest.createRepository({
      name,
      description,
      isPrivate,
    });

    this._defaultBranch = defaultBranch;

    const fileApi = new FileApi(this.clients, {
      name,
      owner: this._owner,
      defaultBranch,
    });

    await fileApi.createFileContent({
      branch: defaultBranch,
      files: {
        path: 'README.md',
        content: DEFAULT_REPO_DESCRIPTION,
      },
      commitMessage: 'Safis CMS initial commit',
    });

    return InitRepoResponse.CREATED;
  }

  getInfo = async (): Promise<RepoInfo> => {
    const name = this._name;
    const owner = this._owner;

    const { repository }: GraphQLGetRepositoryResponse = await this.clients
      .graphql
      .getRepository({ owner, name });

    const {
      description: ghDescription,
      defaultBranchRef: { name: ghBranchName },
      isPrivate: ghIsPrivate,
    } = repository;

    return {
      owner,
      name,
      description: ghDescription,
      defaultBranch: ghBranchName,
      isPrivate: ghIsPrivate,
      paths: this._paths,
    };
  }
}

export { RepositoryApi };
