import { GitHubClientError, ValidationError } from '../error';
import { RestClient } from './rest';

const octokitRequest = jest.fn().mockResolvedValue({});
const ghRestClient = jest.fn().mockResolvedValue({});

jest.mock('@octokit/core', () => ({
  __esModule: true,
  Octokit: jest.fn(() => ({ request: octokitRequest })),
}));

describe('RestClient', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateRef', () => {
    const REF_TYPE = 'heads';
    const REF_NAME = 'test';
    const FULL_REF = `refs/${REF_TYPE}/${REF_NAME}`;
    const commitSha = '9be51af7b66d4be21c32c9429f9cf3cf85907cae';
    const UPDATE_REF_ARGS = {
      owner: 'test-owner',
      repo: 'test-repo',
      ref: FULL_REF,
      sha: commitSha,
    };
    const updateRefData = {
      ref: FULL_REF,
      url: 'http://test-url.com',
      object: {
        sha: commitSha,
        type: 'commit',
        url: 'http://test-url.com',
      },
    };
    const updateRefResponse = { data: updateRefData };

    let restClient: RestClient;
    beforeEach(() => {
      restClient = new RestClient(ghRestClient);
    });

    test('creates ref correctly', async () => {
      ghRestClient.mockResolvedValueOnce(updateRefResponse);

      const newRef = await restClient.updateRef(UPDATE_REF_ARGS);

      expect(ghRestClient).toBeCalledWith('PATCH /repos/{owner}/{repo}/git/refs/{ref}', {
        ...UPDATE_REF_ARGS,
        ref: `${REF_TYPE}/${REF_NAME}`,
        force: false,
      });

      expect(newRef).toEqual(updateRefData);
    });

    test('forces update', async () => {
      const forcedUpdateArgs = {
        ...UPDATE_REF_ARGS,
        force: true,
      };

      ghRestClient.mockResolvedValueOnce(updateRefResponse);

      const newRef = await restClient.updateRef(forcedUpdateArgs);

      expect(ghRestClient).toBeCalledWith('PATCH /repos/{owner}/{repo}/git/refs/{ref}', {
        ...forcedUpdateArgs,
        ref: `${REF_TYPE}/${REF_NAME}`,
      });

      expect(newRef).toEqual(updateRefData);
    });

    test('throws when update is not a fast forward', async () => {
      const updateRefErrorResponse = {
        status: 422,
        data: { message: 'Update is not a fast forward' },
      };

      ghRestClient.mockRejectedValueOnce(updateRefErrorResponse);

      await restClient.updateRef(UPDATE_REF_ARGS)
        .catch((existingRefError) => {
          expect(existingRefError).toBeInstanceOf(GitHubClientError);
          expect(existingRefError.error).toEqual({
            message: updateRefErrorResponse.data.message,
            statusCode: updateRefErrorResponse.status,
          });
          expect(existingRefError).toMatchInlineSnapshot('[GitAdpaterError: Unable to update Ref: Update is not a fast forward]');
        });

      expect(ghRestClient).toBeCalledWith('PATCH /repos/{owner}/{repo}/git/refs/{ref}', {
        ...UPDATE_REF_ARGS,
        ref: `${REF_TYPE}/${REF_NAME}`,
        force: false, // default value
      });
    });

    test('throws when args are invalid', async () => {
      const invalidArgs = {
        owner: '',
        repo: undefined as any,
        sha: 'XXcf6101416f0ce0dda3c80e627f333854c4085c',
        ref: 'refs/heads/',
        force: 'true' as any,
      };

      await restClient.updateRef(invalidArgs)
        .catch((validationError) => {
          expect(validationError).toBeInstanceOf(ValidationError);
          expect(validationError).toMatchInlineSnapshot('[GitAdpaterError: Validation error: String must contain at least 1 character(s) at "owner"; Required at "repo"; Reference name must contain at least three slash-separated components at "ref"; sha must be exactly 40 characters and contain only [0-9a-f] at "sha"; Expected boolean, received string at "force"]');
        });

      await restClient.updateRef({
        ...UPDATE_REF_ARGS,
        ref: 'refs/heads//',
      })
        .catch((validationError) => {
          expect(validationError).toBeInstanceOf(ValidationError);
          expect(validationError).toMatchInlineSnapshot('[GitAdpaterError: Validation error: Reference name must contain at least three slash-separated components at "ref"]');
        });

      expect(ghRestClient).not.toHaveBeenCalled();
    });

    test('throws when object (sha) does not exist', async () => {
      const invalidArgs = {
        ...UPDATE_REF_ARGS,
        sha: 'a27f588e11d3d05720c5fc1222e869ed534fb689', // non-existing object
      };
      const updateRefErrorResponse = {
        status: 422,
        data: { message: 'Object does not exist' },
      };

      ghRestClient.mockRejectedValueOnce(updateRefErrorResponse);

      await restClient.updateRef(invalidArgs)
        .catch((nonExistingObjError) => {
          expect(nonExistingObjError).toBeInstanceOf(GitHubClientError);
          expect(nonExistingObjError.error).toEqual({
            message: updateRefErrorResponse.data.message,
            statusCode: updateRefErrorResponse.status,
          });
          expect(nonExistingObjError).toMatchInlineSnapshot('[GitAdpaterError: Unable to update Ref: Object does not exist]');
        });

      expect(ghRestClient).toBeCalledWith('PATCH /repos/{owner}/{repo}/git/refs/{ref}', {
        ...invalidArgs,
        ref: `${REF_TYPE}/${REF_NAME}`,
        force: false,
      });
    });

    test('throws when ref is not a valid name', async () => {
      const invalidRefName = `${REF_NAME}/`;
      const invalidRef = `refs/heads/${invalidRefName}`;
      const invalidArgs = {
        ...UPDATE_REF_ARGS,
        ref: invalidRef,
      };
      const updateRefErrorResponse = {
        status: 422,
        data: { message: 'Reference does not exist' },
      };

      ghRestClient.mockRejectedValueOnce(updateRefErrorResponse);

      await restClient.updateRef(invalidArgs)
        .catch((invalidRefNameError) => {
          expect(invalidRefNameError).toBeInstanceOf(GitHubClientError);
          expect(invalidRefNameError.error).toEqual({
            message: updateRefErrorResponse.data.message,
            statusCode: updateRefErrorResponse.status,
          });
          expect(invalidRefNameError).toMatchInlineSnapshot('[GitAdpaterError: Unable to update Ref: Reference does not exist]');
        });

      expect(ghRestClient).toBeCalledWith('PATCH /repos/{owner}/{repo}/git/refs/{ref}', {
        ...invalidArgs,
        ref: `${REF_TYPE}/${invalidRefName}`,
        force: false,
      });
    });
  });
});
