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
const NEW_TREE_SHA = 'de48c58709eaf7f54f4dbc47726bf4640438a556';

describe('RestClient', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCommit', () => {
    const CREATE_COMMIT_ARGS = {
      repo: REPO_NAME,
      owner: REPO_OWNER,
      tree: NEW_TREE_SHA,
      parents: [],
      message: 'Test commit',
    };

    let restClient: RestClient;
    beforeEach(() => {
      restClient = new RestClient(ghRestClient);
    });

    test('creates commit correctly', async () => {
      const newCommit = {
        sha: 'a27f588e11d3d05720c5fc1222e869ed534fb671',
        author: {
          name: 'John Doe',
          email: 'test@email.com',
          date: '2022-12-23T15:34:38Z',
        },
        committer: {
          name: 'John Doe',
          email: 'test@email.com',
          date: '2022-12-23T15:34:38Z',
        },
        tree: {
          sha: NEW_TREE_SHA,
          url: 'http://test-url.com',
        },
        message: 'This is a test commit - from Postman',
        parents: [],
      };

      const createCommitResponse = { data: newCommit };

      ghRestClient.mockResolvedValueOnce(createCommitResponse);

      const newTree = await restClient.createCommit(CREATE_COMMIT_ARGS);

      expect(ghRestClient).toBeCalledWith('POST /repos/{owner}/{repo}/git/commits', CREATE_COMMIT_ARGS);

      expect(newTree).toEqual(newCommit);
    });

    test('throws when tree SHA does not exist', async () => {
      const invalidTreeShaArgs = {
        ...CREATE_COMMIT_ARGS,
        tree: '08cf6101416f0ce0dda3c80e627f333854c40efd', // non-existing sha
      };
      const invalidTreeShaResponse = {
        status: 422,
        data: { message: 'Tree SHA does not exist' },
      };

      ghRestClient.mockRejectedValueOnce(invalidTreeShaResponse);

      await restClient.createCommit(invalidTreeShaArgs).catch((invalidShaError) => {
        expect(invalidShaError).toBeInstanceOf(GitHubClientError);
        expect(invalidShaError.error).toEqual({
          message: invalidTreeShaResponse.data.message,
          statusCode: invalidTreeShaResponse.status,
        });
        expect(invalidShaError).toMatchInlineSnapshot('[GitAdpaterError: Unable to create Commit: Tree SHA does not exist]');
      });
      expect(ghRestClient).toBeCalledWith('POST /repos/{owner}/{repo}/git/commits', invalidTreeShaArgs);
    });

    test('throws when parent SHA does not exist', async () => {
      const invalidParentShaArgs = {
        ...CREATE_COMMIT_ARGS,
        parents: [
          '08cf6101416f0ce0dda3c80e627f333854c40efd', // non-existing sha
        ],
      };
      const invalidParentShaResponse = {
        status: 422,
        data: { message: 'Parent SHA does not exist or is not a commit object' },
      };

      ghRestClient.mockRejectedValueOnce(invalidParentShaResponse);

      await restClient.createCommit(invalidParentShaArgs).catch((invalidShaError) => {
        expect(invalidShaError).toBeInstanceOf(GitHubClientError);
        expect(invalidShaError.error).toEqual({
          message: invalidParentShaResponse.data.message,
          statusCode: invalidParentShaResponse.status,
        });
        expect(invalidShaError).toMatchInlineSnapshot('[GitAdpaterError: Unable to create Commit: Parent SHA does not exist or is not a commit object]');
      });
      expect(ghRestClient).toBeCalledWith('POST /repos/{owner}/{repo}/git/commits', invalidParentShaArgs);
    });

    test('throws when arguments are invalid', async () => {
      await restClient.createCommit({
        ...CREATE_COMMIT_ARGS,
        message: undefined as any,
        parents: undefined as any,
      }).catch((error) => {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error).toMatchInlineSnapshot('[GitAdpaterError: Validation error: Required at "message"; Required at "parents"]');
      });

      await restClient.createCommit({
        ...CREATE_COMMIT_ARGS,
        tree: 'invalid-sha',
        parents: ['another-wrong-sha'],
      }).catch((error) => {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error).toMatchInlineSnapshot('[GitAdpaterError: Validation error: String must contain at least 40 character(s) at "tree"; sha must be exactly 40 characters and contain only [0-9a-f] at "tree"; String must contain at least 40 character(s) at "parents[0]"; sha must be exactly 40 characters and contain only [0-9a-f] at "parents[0]"]');
      });

      expect(ghRestClient).not.toHaveBeenCalled();
    });
  });
});
