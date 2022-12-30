import { RestClientError, ValidationError } from '../error';
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

describe('RestClient', () => {
  afterEach(() => {
    jest.clearAllMocks();
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
        data: { message: 'Not Found' },
      };
      const errorMessage = `Unable to create Blob: ${errorResponse.data.message}`;

      ghRestClient.mockRejectedValue(errorResponse);

      await restClient.createBlob({
        owner: INVALID_OWNER,
        repo: REPO_NAME,
        content,
      }).catch((error) => {
        expect(error).toBeInstanceOf(RestClientError);
        expect(error).toMatchInlineSnapshot(`[GitAdpaterError: ${errorMessage}]`);
        expect(error.message).toBe(errorMessage);
        expect(error.code).toBe(errorResponse.status);
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
        expect(error).toBeInstanceOf(RestClientError);
        expect(error).toMatchInlineSnapshot(`[GitAdpaterError: ${errorMessage}]`);
        expect(error.message).toBe(errorMessage);
        expect(error.code).toBe(errorResponse.status);
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

      expect(ghRestClient).not.toHaveBeenCalled();
    });
  });
});
