import { Octokit } from '@octokit/core';
import { z } from 'zod';

import { DEFAULT_REPO_DESCRIPTION } from '../constants';
import { GitHubClientError } from '../error';
import { zodParse } from '../helpers';
import {
  RestClientInterface,
  AuthenticatedUser,
  Blob,
  Commit,
  CreateBlobArgs,
  CreateCommitArgs,
  CreateRefArgs,
  CreateRepoArgs,
  CreateTreeArgs,
  CreateTreeResponse,
  CreateUpdateRefResponse,
  GitHubRepository,
  GitHubRestClient,
  UpdateRefArgs,
  GitFileMode,
} from '../types';
import { adapterSchema } from '../zodSchema';

const zClientId = z.string().min(1);
const zGetOAuthAccessTokenArgs = z.object({
  clientId: zClientId,
  clientSecret: z.string().min(1),
  oauthCallbackCode: z.string().min(1),
});

const zGetOAuthLoginUrlArgs = z.object({
  clientId: zClientId,
  scope: z.array(z.string().min(1)),
});

type GetOAuthAccessTokenArgs = z.infer<typeof zGetOAuthAccessTokenArgs>
type GetOAuthLoginUrlArgs = z.infer<typeof zGetOAuthLoginUrlArgs>

class RestClient implements RestClientInterface {
  protected client: GitHubRestClient

  constructor(client: GitHubRestClient) {
    this.client = client;
  }

  static getOAuthAccessToken = async (args: GetOAuthAccessTokenArgs): Promise<string> => {
    const {
      clientId,
      clientSecret,
      oauthCallbackCode: code,
    } = zodParse(zGetOAuthAccessTokenArgs, args);

    return new Octokit().request(
      'POST https://github.com/login/oauth/access_token',
      {
        client_id: clientId,
        client_secret: clientSecret,
        code,
      },
    )
      .then(({ data }) => {
        const { access_token: accessToken } = data || {};

        return accessToken;
      })
      // eslint-disable-next-line camelcase
      .catch((res: { error: string, error_description: string, status: number }) => {
        const { error: errorCode, error_description: errorDescription, status } = res;
        // eslint-disable-next-line camelcase
        const error = errorCode === 'Not Found'
          ? 'The client_id and/or client_secret passed are incorrect.'
          : errorDescription || errorCode;

        throw new GitHubClientError('Unable to get oauth access token', {
          message: error,
          statusCode: status,
        });
      });
  }

  static getOAuthLoginUrl = (args: GetOAuthLoginUrlArgs): string => {
    const { clientId, scope } = zodParse(zGetOAuthLoginUrlArgs, args);

    const scopeParamString = scope && scope.length ? `&scope=${scope.join(',')}` : '';

    return `https://github.com/login/oauth/authorize?client_id=${clientId}${scopeParamString}`;
  }

  createBlob = async (args: CreateBlobArgs) : Promise<Blob> => {
    const { owner, repo, content } = zodParse(adapterSchema.createBlobArgs, args);
    const { data: blob }: { data: Blob } = await this.client('POST /repos/{owner}/{repo}/git/blobs', {
      owner,
      repo,
      content,
    }).catch(({ data, status }: any) => {
      throw new GitHubClientError('Unable to create Blob', {
        message: data.message,
        statusCode: status,
      });
    });

    return blob;
  }

  createCommit = async (args: CreateCommitArgs): Promise<Commit> => {
    const {
      owner,
      repo,
      message,
      tree,
      parents,
    } = args;

    const { data: commit } = await this.client(`POST /repos/${owner}/${repo}/git/commits`, {
      owner,
      repo,
      message,
      tree,
      parents,
    });

    return commit;
  }

  createRef = async (args: CreateRefArgs): Promise<CreateUpdateRefResponse> => {
    const {
      owner,
      repo,
      ref,
      sha,
    } = args;

    const { data: newRef }: { data: CreateUpdateRefResponse } = await this.client(`POST /repos/${owner}/${repo}/git/refs`, {
      owner,
      repo,
      ref,
      sha,
    });

    return newRef;
  }

  createRepository = async (args: CreateRepoArgs): Promise<GitHubRepository> => {
    const {
      name,
      description = DEFAULT_REPO_DESCRIPTION, // generic description
      isPrivate = false,
    } = args;
    const { data }: { data: GitHubRepository } = await this.client('POST /user/repos', {
      name,
      auto_init: true,
      description,
      private: isPrivate,
    });

    return data;
  }

  createTree = async (args: CreateTreeArgs): Promise<CreateTreeResponse> => {
    const {
      owner,
      repo,
      treeItems,
      baseTree,
    } = zodParse(adapterSchema.createTreeArgs, args);

    const { data: newTree }: { data: CreateTreeResponse } = await this.client('POST /repos/{owner}/{repo}/git/trees', {
      owner,
      repo,
      base_tree: baseTree,
      tree: treeItems,
    }).catch(({ data, status }: any) => {
      throw new GitHubClientError('Unable to create Blob', {
        message: data.message,
        statusCode: status,
      });
    });

    return newTree;
  }

  getAuthenticatedUser = async (): Promise<AuthenticatedUser> => {
    const { data: userInfo, headers } = await this.client('/user');

    const { 'x-oauth-scopes': scope } = headers || {};
    const { login: username, avatar_url: avatarUrl, email } = userInfo;

    const user = {
      username,
      avatarUrl,
      email,
      scope,
    };

    return user;
  }

  updateRef = async (args: UpdateRefArgs): Promise<CreateUpdateRefResponse> => {
    const {
      owner,
      repo,
      ref,
      sha,
      force = false,
    } = args;
    const { data: newRef } = await this.client(`PATCH /repos/${owner}/${repo}/git/refs/${ref}`, {
      owner,
      repo,
      ref,
      sha,
      force,
    });

    return newRef;
  }
}

export { RestClient };
