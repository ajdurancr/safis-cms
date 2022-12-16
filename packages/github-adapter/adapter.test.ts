import { Octokit } from '@octokit/core';

import { GitHubAdapter, createGitHubClients } from './adapter';
import { GraphQLClient } from './client/graphql';
import { RestClient } from './client/rest';
import { ContentApi } from './api/content';
import { OAuthApi } from './api/oauth';
import { RepositoryApi } from './api/repository';
import { UserApi } from './api/user';
import { buildFullPaths } from './helpers';
import { FileContentTypesEnum, RepoPaths } from './types';
import { GitAdpaterError, ValidationError } from './error';
import { DEFAULT_REPO_DESCRIPTION } from './constants';

const DEFAULT_BRANCH = 'default-test-branch';
const OWNER_SECRET = 'secret-1234';
const REPO_NAME = 'test-repo';
const REPO_OWNER = 'test-owner';

const PATHS_CONFIG: RepoPaths = {
  content: 'test-content-path',
  contentType: 'test-content-type-path',
};

const FULL_PATHS: RepoPaths = {
  content: `${PATHS_CONFIG.content}/`,
  contentType: `${PATHS_CONFIG.content}/`,
};

const INITIAL_CONFIGS = {
  auth: { ownerSecret: OWNER_SECRET },
  repo: {
    owner: REPO_OWNER,
    name: REPO_NAME,
    paths: PATHS_CONFIG,
  },
};

const GH_CLIENTS = Object.freeze({
  graphql: 'test-graphql-client',
  request: 'test-rest-client',
});

const GRAPHQL_CLIENT_INSTANCE = {};
const REST_CLIENT_INSTANCE = {};
const UNIFIED_CLIENTS = {
  rest: REST_CLIENT_INSTANCE,
  graphql: GRAPHQL_CLIENT_INSTANCE,
};

jest.mock('@octokit/core', () => ({
  __esModule: true,
  Octokit: jest.fn(() => GH_CLIENTS),
}));

jest.mock('./client/graphql', () => ({
  __esModule: true,
  GraphQLClient: jest.fn(() => GRAPHQL_CLIENT_INSTANCE),
}));

jest.mock('./client/rest', () => ({
  __esModule: true,
  RestClient: jest.fn(() => REST_CLIENT_INSTANCE),
}));

const CONTENT_API_INSTANCE = {};
jest.mock('./api/content', () => ({
  __esModule: true,
  ContentApi: jest.fn(() => CONTENT_API_INSTANCE),
}));

const repoApiInit = jest.fn(() => Promise.resolve());
const repoApiGetInfo = jest.fn(() => Promise.resolve({
  owner: REPO_OWNER,
  name: REPO_NAME,
  description: DEFAULT_REPO_DESCRIPTION,
  defaultBranch: DEFAULT_BRANCH,
  isPrivate: false,
  paths: FULL_PATHS,
}));
const REPO_API_INSTANCE = {
  init: repoApiInit,
  getInfo: repoApiGetInfo,
};
jest.mock('./api/repository', () => ({
  __esModule: true,
  RepositoryApi: jest.fn(() => REPO_API_INSTANCE),
}));

const USER_API_INSTANCE = {};
jest.mock('./api/user', () => ({
  __esModule: true,
  UserApi: jest.fn(() => USER_API_INSTANCE),
}));

jest.mock('./helpers', () => {
  const originalModule = jest.requireActual<typeof import('./helpers')>('./helpers');

  return {
    __esModule: true,
    ...originalModule,
    buildFullPaths: jest.fn(() => FULL_PATHS),
  };
});

describe('createGitHubClients', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  test('creates clients correctly', () => {
    const unfiedClients = createGitHubClients(OWNER_SECRET);

    expect(Octokit).toBeCalledWith({ auth: OWNER_SECRET });
    expect(RestClient).toBeCalledWith(GH_CLIENTS.request);
    expect(GraphQLClient).toBeCalledWith(GH_CLIENTS.graphql);
    expect(unfiedClients).toEqual(UNIFIED_CLIENTS);
  });

  test('throws on secret = \'\'', () => {
    expect(() => {
      createGitHubClients('');
    }).toThrow(new ValidationError([
      {
        code: 'too_small',
        minimum: 1,
        type: 'string',
        inclusive: true,
        message: 'String must contain at least 1 character(s)',
        path: [],
      },
    ]));
  });

  test('throws on secret = undefined', () => {
    expect(() => {
      createGitHubClients((undefined as any));
    }).toThrow(new ValidationError([
      {
        code: 'invalid_type',
        expected: 'string',
        received: 'undefined',
        path: [],
        message: 'secret is required',
      },
    ]));
  });

  test('throws on secret = number', () => {
    expect(() => {
      createGitHubClients((1234 as any));
    }).toThrow(new ValidationError([
      {
        code: 'invalid_type',
        expected: 'string',
        received: 'number',
        path: [],
        message: 'secret must be a string',
      },
    ]));
  });
});

describe('GitHubAdapter', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('succeeds with correctly', () => {
      const adapter = new GitHubAdapter(INITIAL_CONFIGS);

      expect(adapter).toBeInstanceOf(GitHubAdapter);
    });

    test('throws on config=undefined', () => {
      expect(() => {
        const adapter = new GitHubAdapter((undefined as any));
      }).toThrow(new ValidationError([
        {
          code: 'invalid_type',
          expected: 'object',
          received: 'undefined',
          path: [],
          message: 'initial config is required',
        },
      ]));
    });

    test('throws when config.auth values are invalid', () => {
      expect(() => {
        const adapter = new GitHubAdapter({
          auth: ({} as any),
          repo: INITIAL_CONFIGS.repo,
        });
      }).toThrow(new ValidationError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: [
            'auth',
            'ownerSecret',
          ],
          message: 'secret is required',
        },
      ]));

      expect(() => {
        const adapter = new GitHubAdapter({
          auth: { ownerSecret: '' },
          repo: INITIAL_CONFIGS.repo,
        });
      }).toThrow(new ValidationError([
        {
          code: 'too_small',
          minimum: 1,
          type: 'string',
          inclusive: true,
          message: 'String must contain at least 1 character(s)',
          path: [
            'auth',
            'ownerSecret',
          ],
        },
      ]));
    });

    test('throws when config.repo values are invalid', () => {
      expect(() => {
        const adapter = new GitHubAdapter({
          auth: INITIAL_CONFIGS.auth,
          repo: {} as any,
        });
      }).toThrow(new ValidationError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: [
            'repo',
            'name',
          ],
          message: 'Required',
        },
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: [
            'repo',
            'owner',
          ],
          message: 'owner property is required',
        },
        {
          code: 'invalid_type',
          expected: 'object',
          received: 'undefined',
          path: [
            'repo',
            'paths',
          ],
          message: 'paths property is required',
        },
      ]));

      expect(() => {
        const adapter = new GitHubAdapter({
          auth: INITIAL_CONFIGS.auth,
          repo: {
            ...INITIAL_CONFIGS.repo,
            paths: undefined as any,
          },
        });
      }).toThrow(new ValidationError([
        {
          code: 'invalid_type',
          expected: 'object',
          received: 'undefined',
          path: [
            'repo',
            'paths',
          ],
          message: 'paths property is required',
        },
      ]));

      expect(() => {
        const adapter = new GitHubAdapter({
          auth: { ownerSecret: OWNER_SECRET },
          repo: {
            ...INITIAL_CONFIGS.repo,
            paths: {} as any,
          },
        });
      }).toThrow(new ValidationError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: [
            'repo',
            'paths',
            'content',
          ],
          message: 'content path is required',
        },
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: [
            'repo',
            'paths',
            'contentType',
          ],
          message: 'contentType path is required',
        },
      ]));
    });
  });

  describe('.init', () => {
    test('inits correctly, createAsPrivate=undefined (default)', async () => {
      const adapter = new GitHubAdapter(INITIAL_CONFIGS);

      await adapter.init();

      expect(buildFullPaths).toHaveBeenCalledWith(PATHS_CONFIG);
      expect(RepositoryApi).toHaveBeenCalledWith(UNIFIED_CLIENTS, {
        owner: REPO_OWNER,
        name: REPO_NAME,
        paths: FULL_PATHS,
      });
      expect(repoApiInit).toHaveBeenCalledWith({ isPrivate: false });
      expect(repoApiGetInfo).toHaveBeenCalled();

      // eslint-disable-next-line dot-notation
      expect(adapter['_repoInfo']).toEqual({
        owner: REPO_OWNER,
        name: REPO_NAME,
        description: DEFAULT_REPO_DESCRIPTION,
        defaultBranch: DEFAULT_BRANCH,
        isPrivate: false,
        paths: FULL_PATHS,
      });
    });

    test('inits correctly with createAsPrivate=true', async () => {
      const createAsPrivate = true;

      repoApiGetInfo.mockResolvedValueOnce({
        owner: REPO_OWNER,
        name: REPO_NAME,
        description: DEFAULT_REPO_DESCRIPTION,
        isPrivate: createAsPrivate,
        defaultBranch: DEFAULT_BRANCH,
        paths: FULL_PATHS,
      });

      const adapter = new GitHubAdapter({
        auth: INITIAL_CONFIGS.auth,
        repo: {
          ...INITIAL_CONFIGS.repo,
          createAsPrivate,
        },
      });

      await adapter.init();

      expect(buildFullPaths).toHaveBeenCalledWith(PATHS_CONFIG);
      expect(RepositoryApi).toHaveBeenCalledWith(UNIFIED_CLIENTS, {
        owner: REPO_OWNER,
        name: REPO_NAME,
        paths: FULL_PATHS,
      });
      expect(repoApiInit).toHaveBeenCalledWith({ isPrivate: true });
      expect(repoApiGetInfo).toHaveBeenCalled();

      // eslint-disable-next-line dot-notation
      expect(adapter['_repoInfo']).toEqual({
        owner: REPO_OWNER,
        name: REPO_NAME,
        description: DEFAULT_REPO_DESCRIPTION,
        isPrivate: createAsPrivate,
        defaultBranch: DEFAULT_BRANCH,
        paths: FULL_PATHS,
      });
    });
  });

  describe('.createGitApi', () => {
    test('returns new gitApi correctly', async () => {
      const repoInfo = {
        owner: REPO_OWNER,
        name: REPO_NAME,
        defaultBranch: DEFAULT_BRANCH,
        description: DEFAULT_REPO_DESCRIPTION,
        isPrivate: false,
        paths: FULL_PATHS,
      };

      const adapter = new GitHubAdapter(INITIAL_CONFIGS);

      await adapter.init();

      expect(adapter.createGitApi({ secret: OWNER_SECRET })).toEqual({
        content: CONTENT_API_INSTANCE,
        contentType: CONTENT_API_INSTANCE,
        repository: REPO_API_INSTANCE,
        user: USER_API_INSTANCE,
      });

      expect(ContentApi).toHaveBeenCalledTimes(2);
      expect(ContentApi).toBeCalledWith(
        UNIFIED_CLIENTS,
        repoInfo,
        FileContentTypesEnum.CONTENT,
      );

      expect(ContentApi).toBeCalledWith(
        UNIFIED_CLIENTS,
        repoInfo,
        FileContentTypesEnum.CONTENT_TYPE,
      );

      expect(RepositoryApi).toBeCalledWith(UNIFIED_CLIENTS, repoInfo);

      expect(UserApi).toBeCalledWith(UNIFIED_CLIENTS);
    });

    test('throws when adapter was not initialized correctly', async () => {
      const adapter = new GitHubAdapter(INITIAL_CONFIGS);

      // await adapter.init(); /* call should had been done here */

      expect(() => {
        adapter.createGitApi({ secret: OWNER_SECRET });
      }).toThrow(new GitAdpaterError('Adapter not inialized'));

      expect(ContentApi).not.toHaveBeenCalled();
      expect(ContentApi).not.toBeCalled();
      expect(RepositoryApi).not.toHaveBeenCalled();
      expect(UserApi).not.toBeCalled();
    });

    test('throws when secret is invalid', async () => {
      const adapter = new GitHubAdapter(INITIAL_CONFIGS);

      await adapter.init();

      expect(RepositoryApi).toBeCalledTimes(1);

      expect(() => {
        adapter.createGitApi({ secret: undefined as any });
      }).toThrow(new ValidationError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: [],
          message: 'secret is required',
        },
      ]));

      expect(() => {
        adapter.createGitApi({ secret: '' });
      }).toThrow(new ValidationError([
        {
          code: 'too_small',
          minimum: 1,
          type: 'string',
          inclusive: true,
          message: 'String must contain at least 1 character(s)',
          path: [],
        },
      ]));

      expect(ContentApi).not.toHaveBeenCalled();
      expect(ContentApi).not.toBeCalled();
      expect(RepositoryApi).toBeCalledTimes(1);
      expect(UserApi).not.toBeCalled();
    });
  });

  describe('static getAccessToken', () => {
    test('returns auth data correctly', () => {
      expect(GitHubAdapter.getAccessToken).toBe(OAuthApi.getAccessToken);
    });
  });

  describe('static getLoginUrl', () => {
    test('returns auth data correctly', () => {
      expect(GitHubAdapter.getLoginUrl).toBe(OAuthApi.getLoginUrl);
    });
  });
});
