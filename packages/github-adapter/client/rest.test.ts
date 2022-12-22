/* eslint-disable dot-notation */

import { gitFileMode, gitItemType } from '../constants';
import { GitHubClientError, ValidationError } from '../error';
import { RestClient } from './rest';

const octokitRequest = jest.fn().mockResolvedValue({});
const ghRestClient = jest.fn().mockResolvedValue({});

jest.mock('@octokit/core', () => ({
  __esModule: true,
  Octokit: jest.fn(() => ({ request: octokitRequest })),
}));

const REPO_NAME = 'test-repo';
const REPO_OWNER = 'test-owner';
const ACCESS_TOKEN = 'test-access-token';
const OAUTH_CALLBACK_CODE = 'test-code';
const OAUTH_CLIENT_ID = 'test-client-id';
const OAUTH_CLIENT_SECRET = 'test-client-secret';

const BLOB_SHA = '08cf6101416f0ce0dda3c80e627f333854c4085c';

describe('RestClient', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('inits correctly', () => {
      const restClient = new RestClient(ghRestClient);

      expect(restClient['client']).toEqual(ghRestClient);
    });
  });

  describe('static getOAuthAccessToken', () => {
    test('returns new access token correctly', async () => {
      octokitRequest.mockResolvedValueOnce({ data: { access_token: ACCESS_TOKEN } });

      const accessToken = await RestClient.getOAuthAccessToken({
        clientId: OAUTH_CLIENT_ID,
        clientSecret: OAUTH_CLIENT_SECRET,
        oauthCallbackCode: OAUTH_CALLBACK_CODE,
      });

      expect(octokitRequest).toHaveBeenCalledWith(
        'POST https://github.com/login/oauth/access_token',
        {
          client_id: OAUTH_CLIENT_ID,
          client_secret: OAUTH_CLIENT_SECRET,
          code: OAUTH_CALLBACK_CODE,
        },
      );
      expect(accessToken).toEqual(ACCESS_TOKEN);
    });

    test('throws when params are invalid', async () => {
      await RestClient.getOAuthAccessToken({
        clientId: '',
        clientSecret: '',
        oauthCallbackCode: '',
      }).catch((error) => {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error).toMatchInlineSnapshot('[GitAdpaterError: Validation error: String must contain at least 1 character(s) at "clientId"; String must contain at least 1 character(s) at "clientSecret"; String must contain at least 1 character(s) at "oauthCallbackCode"]');
      });

      await RestClient.getOAuthAccessToken({
        clientId: undefined as any,
        clientSecret: 123 as any,
        oauthCallbackCode: null as any,
      }).catch((error) => {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error).toMatchInlineSnapshot('[GitAdpaterError: Validation error: Required at "clientId"; Expected string, received number at "clientSecret"; Expected string, received null at "oauthCallbackCode"]');
      });
    });

    test('throws when client_id is invalid', async () => {
      octokitRequest.mockRejectedValueOnce({ error: 'Not Found', status: 404 });

      await RestClient.getOAuthAccessToken({
        clientId: 'InvalidClientId123',
        clientSecret: OAUTH_CLIENT_SECRET,
        oauthCallbackCode: OAUTH_CALLBACK_CODE,
      }).catch((error) => {
        expect(error).toBeInstanceOf(GitHubClientError);
        expect(error).toMatchInlineSnapshot(
          '[GitAdpaterError: Unable to get oauth access token: The client_id and/or client_secret passed are incorrect.]',
        );
      });
      expect(octokitRequest).toHaveBeenCalledTimes(1);
    });

    test('throws when client_secret is invalid', async () => {
      octokitRequest.mockRejectedValueOnce({
        error: 'incorrect_client_credentials',
        error_description: 'The client_id and/or client_secret passed are incorrect.',
      });

      await RestClient.getOAuthAccessToken({
        clientId: OAUTH_CLIENT_ID,
        clientSecret: 'InvalidSecret123',
        oauthCallbackCode: OAUTH_CALLBACK_CODE,
      }).catch((error) => {
        expect(error).toBeInstanceOf(GitHubClientError);
        expect(error).toMatchInlineSnapshot(
          '[GitAdpaterError: Unable to get oauth access token: The client_id and/or client_secret passed are incorrect.]',
        );
      });
      expect(octokitRequest).toHaveBeenCalledTimes(1);
    });

    test('throws when oauth code is invalid', async () => {
      octokitRequest.mockRejectedValueOnce({
        error: 'bad_verification_code',
        error_description: 'The code passed is incorrect or expired.',
      });

      await RestClient.getOAuthAccessToken({
        clientId: OAUTH_CLIENT_ID,
        clientSecret: OAUTH_CLIENT_SECRET,
        oauthCallbackCode: 'InvalidCode123',
      }).catch((error) => {
        expect(error).toBeInstanceOf(GitHubClientError);
        expect(error).toMatchInlineSnapshot(
          '[GitAdpaterError: Unable to get oauth access token: The code passed is incorrect or expired.]',
        );
      });

      expect(octokitRequest).toHaveBeenCalledTimes(1);
    });
  });

  describe('static getOAuthLoginUrl', () => {
    test('returns oauth login url with scope', () => {
      const scope = ['repo'];

      const loginUrl = RestClient.getOAuthLoginUrl({
        clientId: OAUTH_CLIENT_ID,
        scope,
      });

      expect(loginUrl).toBe(`https://github.com/login/oauth/authorize?client_id=${OAUTH_CLIENT_ID}&scope=${scope.join(',')}`);
    });

    test('returns oauth login url with no scopes', () => {
      const scope = [] as string[];

      const loginUrl = RestClient.getOAuthLoginUrl({
        clientId: OAUTH_CLIENT_ID,
        scope,
      });

      expect(loginUrl).toBe(`https://github.com/login/oauth/authorize?client_id=${OAUTH_CLIENT_ID}`);
    });

    test('throws when params are invalid', () => {
      expect(() => {
        RestClient.getOAuthLoginUrl({
          clientId: OAUTH_CLIENT_ID,
          scope: [''],
        });
      }).toThrowError(ValidationError);

      expect(() => {
        RestClient.getOAuthLoginUrl({
          clientId: '',
          scope: [],
        });
      }).toThrowError(ValidationError);
    });
  });

  describe('createBlob', () => {
    let restClient: RestClient;

    beforeEach(() => {
      restClient = new RestClient(ghRestClient);
    });

    test('creates blob correctly', async () => {
      const content = 'test content';
      const createBlobArgs = { owner: REPO_OWNER, repo: REPO_NAME, content };
      const createBlobSuccessResponse = {
        sha: BLOB_SHA,
        url: 'blob-url',
      };

      ghRestClient.mockResolvedValueOnce({ data: createBlobSuccessResponse });

      const blob = await restClient.createBlob(createBlobArgs);

      expect(ghRestClient).toBeCalledWith(
        'POST /repos/{owner}/{repo}/git/blobs',
        createBlobArgs,
      );
      expect(blob).toEqual(createBlobSuccessResponse);
    });

    test('throws when the owner or repo does not exist', async () => {
      const content = 'test content';
      const INVALID_OWNER = 'invalid-repo-owner';
      const INVALID_REPO = 'invalid-repo-name';
      const errorResponse = {
        status: 404,
        data: { message: { message: 'Not Found' } },
      };

      ghRestClient.mockRejectedValue(errorResponse);

      await restClient.createBlob({
        owner: INVALID_OWNER,
        repo: REPO_NAME,
        content,
      }).catch((error) => {
        expect(error).toBeInstanceOf(GitHubClientError);
        expect(error.error).toEqual({
          message: errorResponse.data.message,
          statusCode: errorResponse.status,
        });
      });

      expect(ghRestClient).toHaveBeenNthCalledWith(
        1,
        'POST /repos/{owner}/{repo}/git/blobs',
        { owner: INVALID_OWNER, repo: REPO_NAME, content },
      );

      await restClient.createBlob({
        owner: REPO_OWNER,
        repo: INVALID_REPO,
        content,
      }).catch((error) => {
        expect(error).toBeInstanceOf(GitHubClientError);
        expect(error.error).toEqual({
          message: errorResponse.data.message,
          statusCode: errorResponse.status,
        });
      });

      expect(ghRestClient).toHaveBeenLastCalledWith(
        'POST /repos/{owner}/{repo}/git/blobs',
        { owner: REPO_OWNER, repo: INVALID_REPO, content },
      );
    });

    test('throws when arguments types or values are invalid', async () => {
      await restClient.createBlob({
        owner: '',
        repo: '',
        content: '',
      }).catch((error) => {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error).toMatchInlineSnapshot('[GitAdpaterError: Validation error: String must contain at least 1 character(s) at "owner"; String must contain at least 1 character(s) at "repo"; String must contain at least 1 character(s) at "content"]');
      });

      await restClient.createBlob({
        owner: undefined as any,
        repo: undefined as any,
        content: null as any,
      }).catch((error) => {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error).toMatchInlineSnapshot('[GitAdpaterError: Validation error: Required at "owner"; Required at "repo"; Expected string, received null at "content"]');
      });

      await restClient.createBlob({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        content: 1 as any,
      }).catch((error) => {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error).toMatchInlineSnapshot('[GitAdpaterError: Validation error: Expected string, received number at "content"]');
      });
    });
  });

  describe('createTree', () => {
    const NEW_TREE_SHA = 'de48c58709eaf7f54f4dbc47726bf4640438a556';
    const BASE_TREE_SHA = 'base-tree-sha';
    const BLOB_PATH = 'blob-path';
    const TREE_ITEMS = [{
      mode: gitFileMode.BLOB,
      type: gitItemType.BLOB,
      path: BLOB_PATH,
      sha: BLOB_SHA,
    }];

    const CREATE_TREE_ARGS = {
      repo: REPO_NAME,
      owner: REPO_OWNER,
      baseTree: BASE_TREE_SHA,
      treeItems: TREE_ITEMS,
    };

    let restClient: RestClient;
    beforeEach(() => {
      restClient = new RestClient(ghRestClient);
    });

    test('creates tree correctly', async () => {
      const baseTreeSha = 'base-tree-sha';
      const blobPath = 'blob-path';
      const treeItems = [{
        mode: gitFileMode.BLOB,
        type: gitItemType.BLOB,
        path: blobPath,
        sha: BLOB_SHA,
      }];

      const createTreeRespose = {
        data: {
          sha: NEW_TREE_SHA,
          url: 'tree-url',
          tree: treeItems,
          truncated: false,
        },
      };

      ghRestClient.mockResolvedValueOnce(createTreeRespose);

      const newTree = await restClient.createTree(CREATE_TREE_ARGS);

      expect(ghRestClient).toBeCalledWith('POST /repos/{owner}/{repo}/git/trees', {
        owner: REPO_OWNER,
        repo: REPO_NAME,
        base_tree: baseTreeSha,
        tree: treeItems,
      });

      expect(newTree).toEqual(createTreeRespose.data);
    });

    test('throws when the owner or repo does not exist', async () => {
      const INVALID_OWNER = 'invalid-repo-owner';
      const INVALID_REPO = 'invalid-repo-name';
      const errorResponse = {
        status: 404,
        data: { message: { message: 'Not Found' } },
      };

      ghRestClient.mockRejectedValue(errorResponse);

      await restClient.createTree({
        ...CREATE_TREE_ARGS,
        owner: INVALID_OWNER,
      }).catch((error) => {
        expect(error).toBeInstanceOf(GitHubClientError);
        expect(error.error).toEqual({
          message: errorResponse.data.message,
          statusCode: errorResponse.status,
        });
      });

      expect(ghRestClient).toHaveBeenNthCalledWith(
        1,
        'POST /repos/{owner}/{repo}/git/trees',
        {
          owner: INVALID_OWNER,
          repo: REPO_NAME,
          base_tree: BASE_TREE_SHA,
          tree: TREE_ITEMS,
        },
      );

      await restClient.createTree({
        ...CREATE_TREE_ARGS,
        repo: INVALID_REPO,
      }).catch((error) => {
        expect(error).toBeInstanceOf(GitHubClientError);
        expect(error.error).toEqual({
          message: errorResponse.data.message,
          statusCode: errorResponse.status,
        });
      });

      expect(ghRestClient).toHaveBeenNthCalledWith(
        2,
        'POST /repos/{owner}/{repo}/git/trees',
        {
          owner: REPO_OWNER,
          repo: INVALID_REPO,
          base_tree: BASE_TREE_SHA,
          tree: TREE_ITEMS,
        },
      );
    });

    test('throws when arguments are invalid', async () => {
      await restClient.createTree({
        repo: 1 as any,
        owner: undefined as any,
        baseTree: '',
        treeItems: [] as any[],
      }).catch((error) => {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error).toMatchInlineSnapshot('[GitAdpaterError: Validation error: Required at "owner"; Expected string, received number at "repo"; Array must contain at least 1 element(s) at "treeItems"; String must contain at least 1 character(s) at "baseTree"]');
      });

      await restClient.createTree({
        ...CREATE_TREE_ARGS,
        treeItems: [{
          mode: '1006442',
          type: 'blobXYZ',
          path: '/wrong',
          sha: null,
        }] as any[],
      }).catch((error) => {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error).toMatchInlineSnapshot('[GitAdpaterError: Validation error: Invalid enum value. Expected \'100644\' | \'040000\' | \'160000\', received \'1006442\' at "treeItems[0].mode"; Invalid enum value. Expected \'blob\' | \'tree\' | \'commit\', received \'blobXYZ\' at "treeItems[0].type"; path cannot start with a slash at "treeItems[0].path"; Expected string, received null at "treeItems[0].sha"]');
      });
    });
  });
});
