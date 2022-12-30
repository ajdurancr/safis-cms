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

describe('RestClient', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createRef', () => {
    const commitSha = 'a27f588e11d3d05720c5fc1222e869ed534fb671';
    const CREATE_REF_ARGS = {
      owner: REPO_OWNER,
      repo: REPO_NAME,
      ref: 'refs/heads/test',
      sha: commitSha,
    };

    let restClient: RestClient;
    beforeEach(() => {
      restClient = new RestClient(ghRestClient);
    });

    test('creates ref correctly', async () => {
      const newRefData = {
        ref: 'refs/heads/test',
        url: 'http://test-url.com',
        object: {
          sha: commitSha,
          type: 'commit',
          url: 'http://test-url.com',
        },
      };
      const createRefResponse = { data: newRefData };

      ghRestClient.mockResolvedValueOnce(createRefResponse);

      const newRef = await restClient.createRef(CREATE_REF_ARGS);

      expect(ghRestClient).toBeCalledWith('POST /repos/{owner}/{repo}/git/refs', CREATE_REF_ARGS);

      expect(newRef).toEqual(newRefData);
    });

    test('throws when args are invalid', async () => {
      const invalidArgs = {
        owner: '',
        repo: undefined as any,
        sha: 'XXcf6101416f0ce0dda3c80e627f333854c4085c',
        ref: 'refs/heads/',
      };

      await restClient.createRef(invalidArgs)
        .catch((validationError) => {
          expect(validationError).toBeInstanceOf(ValidationError);
          expect(validationError).toMatchInlineSnapshot('[GitAdpaterError: Validation error: String must contain at least 1 character(s) at "owner"; Required at "repo"; refs/heads/ is not a valid ref name at "ref"; Reference name must contain at least three slash-separated components at "ref"; sha must be exactly 40 characters and contain only [0-9a-f] at "sha"]');
        });

      await restClient.createRef({
        ...CREATE_REF_ARGS,
        ref: 'refs/heads//',
      })
        .catch((validationError) => {
          expect(validationError).toBeInstanceOf(ValidationError);
          expect(validationError).toMatchInlineSnapshot('[GitAdpaterError: Validation error: refs/heads// is not a valid ref name at "ref"; Reference name must contain at least three slash-separated components at "ref"]');
        });

      await restClient.createRef({
        ...CREATE_REF_ARGS,
        ref: 'Xrefs/heads/test',
      })
        .catch((validationError) => {
          expect(validationError).toBeInstanceOf(ValidationError);
          expect(validationError).toMatchInlineSnapshot('[GitAdpaterError: Validation error: Reference must start with `refs/heads/` or `refs/tags` at "ref"]');
        });

      expect(ghRestClient).not.toHaveBeenCalled();
    });

    test('throws when ref already exists', async () => {
      const createRefErrorResponse = {
        status: 422,
        data: { message: 'Reference already exists' },
      };
      const errorMessage = `Unable to create Ref: ${createRefErrorResponse.data.message}`;

      ghRestClient.mockRejectedValueOnce(createRefErrorResponse);

      await restClient.createRef(CREATE_REF_ARGS)
        .catch((existingRefError) => {
          expect(existingRefError).toBeInstanceOf(RestClientError);
          expect(existingRefError).toMatchInlineSnapshot(`[GitAdpaterError: ${errorMessage}]`);
          expect(existingRefError.message).toBe(errorMessage);
          expect(existingRefError.code).toBe(createRefErrorResponse.status);
        });

      expect(ghRestClient).toBeCalledWith('POST /repos/{owner}/{repo}/git/refs', CREATE_REF_ARGS);
    });

    test('throws when object (sha) does not exist', async () => {
      const invalidArgs = {
        ...CREATE_REF_ARGS,
        sha: 'a27f588e11d3d05720c5fc1222e869ed534fb689', // non-existing object
      };
      const createRefErrorResponse = {
        status: 422,
        data: { message: 'Object does not exist' },
      };
      const errorMessage = `Unable to create Ref: ${createRefErrorResponse.data.message}`;

      ghRestClient.mockRejectedValueOnce(createRefErrorResponse);

      await restClient.createRef(invalidArgs)
        .catch((nonExistingObjError) => {
          expect(nonExistingObjError).toBeInstanceOf(RestClientError);
          expect(nonExistingObjError).toMatchInlineSnapshot(`[GitAdpaterError: ${errorMessage}]`);
          expect(nonExistingObjError.message).toBe(errorMessage);
          expect(nonExistingObjError.code).toBe(createRefErrorResponse.status);
        });

      expect(ghRestClient).toBeCalledWith('POST /repos/{owner}/{repo}/git/refs', invalidArgs);
    });
  });
});
