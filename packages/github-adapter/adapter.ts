import { Octokit } from '@octokit/core';
import { z } from 'zod';

import {
  AuthInfo,
  CreateGitApiArgs,
  FileContentTypesEnum,
  GitAdapterApi,
  InitialConfigs,
  RepoConfig,
  RepoInfo,
  UnifiedClients,
} from './types';
import { GraphQLClient } from './client/graphql';
import { RestClient } from './client/rest';
import { ContentApi } from './api/content';
import { OAuthApi } from './api/oauth';
import { RepositoryApi } from './api/repository';
import { UserApi } from './api/user';
import { buildFullPaths, zodParse } from './helpers';
import { GitAdpaterError } from './error';
import { adapterSchema } from './zodSchema';

const zAuthInfo = z.object({ ownerSecret: adapterSchema.secret });

const zRepoConfig = z.object({
  name: z.string().min(1),
  owner: z.string({ required_error: 'owner property is required' }).min(1),
  paths: adapterSchema.repoPath,
  createAsPrivate: z.boolean().optional().default(false),
}, { required_error: 'repo property is required' });

const zInitialConfig = z.object({
  auth: zAuthInfo,
  repo: zRepoConfig,
}, { required_error: 'initial config is required' });

const createGitHubClients = (secret: string): UnifiedClients => {
  const parseSecret = zodParse(adapterSchema.secret, secret);

  const {
    graphql: ghGraphqlClient,
    request: ghRestClient,
  } = new Octokit({ auth: parseSecret });

  return {
    rest: new RestClient(ghRestClient),
    graphql: new GraphQLClient(ghGraphqlClient),
  };
};

class GitHubAdapter {
  private _authInfo: AuthInfo

  private _initialRepoInfo: RepoConfig

  private _repoInfo?: RepoInfo

  static AUTH_KEY_NAME = 'accessToken'

  static getAccessToken = OAuthApi.getAccessToken

  static getLoginUrl = OAuthApi.getLoginUrl

  constructor(config: InitialConfigs) {
    const parsedConfig = zodParse(zInitialConfig, config);

    this._authInfo = parsedConfig.auth;
    this._initialRepoInfo = parsedConfig.repo;
  }

  async init(): Promise<void> {
    const { ownerSecret } = this._authInfo;
    const { owner, name, createAsPrivate, paths } = this._initialRepoInfo;
    const fullPaths = buildFullPaths(paths);
    const tempClients = createGitHubClients(ownerSecret);

    const repoApi = new RepositoryApi(
      tempClients,
      {
        owner,
        name,
        paths: fullPaths,
      } as RepoInfo,
    );

    await repoApi.init({ isPrivate: Boolean(createAsPrivate) });

    const { defaultBranch } = await repoApi.getInfo();

    this._repoInfo = {
      defaultBranch,
      owner,
      name,
      paths: fullPaths,
    };
  }

  createGitApi = (args: CreateGitApiArgs): GitAdapterApi => {
    if (!this._repoInfo) throw new GitAdpaterError('Adapter not inialized');

    const parsedSecret = zodParse(adapterSchema.secret, args?.secret);
    const clients = createGitHubClients(parsedSecret);

    return {
      content: new ContentApi(clients, this._repoInfo, FileContentTypesEnum.CONTENT),
      contentType: new ContentApi(clients, this._repoInfo, FileContentTypesEnum.CONTENT_TYPE),
      repository: new RepositoryApi(clients, this._repoInfo),
      user: new UserApi(clients),
    };
  }

  static getAuthInfoFromRequest = (requestObj: { [key: string]: any }): CreateGitApiArgs => {
    if (typeof requestObj !== 'object' || requestObj[GitHubAdapter.AUTH_KEY_NAME]) {
      throw new GitAdpaterError('Unable to find auth info in request object');
    }

    return { secret: requestObj[GitHubAdapter.AUTH_KEY_NAME] };
  }
}

export {
  GitHubAdapter,
  createGitHubClients,
};
