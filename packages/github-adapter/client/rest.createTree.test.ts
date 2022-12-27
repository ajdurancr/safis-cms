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

const BLOB_SHA = '08cf6101416f0ce0dda3c80e627f333854c4085c';
const NEW_TREE_SHA = 'de48c58709eaf7f54f4dbc47726bf4640438a556';
const BASE_TREE_SHA = '4d48c58709eaf7f54f4dbc47726bf4640438a534';

describe('RestClient', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTree', () => {
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
      const createTreeRespose = {
        data: {
          sha: NEW_TREE_SHA,
          url: 'tree-url',
          tree: TREE_ITEMS,
          truncated: false,
        },
      };

      ghRestClient.mockResolvedValueOnce(createTreeRespose);

      const newTree = await restClient.createTree(CREATE_TREE_ARGS);

      expect(ghRestClient).toBeCalledWith('POST /repos/{owner}/{repo}/git/trees', {
        owner: REPO_OWNER,
        repo: REPO_NAME,
        base_tree: BASE_TREE_SHA,
        tree: TREE_ITEMS,
      });

      expect(newTree).toEqual(createTreeRespose.data);
    });

    test('throws when the owner or repo does not exist', async () => {
      const INVALID_OWNER = 'invalid-repo-owner';
      const INVALID_REPO = 'invalid-repo-name';
      const errorResponse = {
        status: 404,
        data: { message: 'Not Found' },
      };

      ghRestClient.mockRejectedValue(errorResponse);

      await restClient.createTree({
        ...CREATE_TREE_ARGS,
        owner: INVALID_OWNER,
      }).catch((error) => {
        expect(error).toBeInstanceOf(GitHubClientError);
        expect(error).toMatchInlineSnapshot('[GitAdpaterError: Unable to create Tree: Not Found]');
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
        expect(error).toMatchInlineSnapshot('[GitAdpaterError: Unable to create Tree: Not Found]');
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
        expect(error).toMatchInlineSnapshot('[GitAdpaterError: Validation error: Required at "owner"; Expected string, received number at "repo"; Array must contain at least 1 element(s) at "treeItems"; String must contain at least 40 character(s) at "baseTree"; sha must be exactly 40 characters and contain only [0-9a-f] at "baseTree"]');
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

      expect(ghRestClient).not.toHaveBeenCalled();
    });
  });
});
