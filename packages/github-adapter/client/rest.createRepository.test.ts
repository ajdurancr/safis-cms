import { DEFAULT_REPO_DESCRIPTION } from '../constants';
import { RestClientError, ValidationError } from '../error';
import { GitHubRepository } from '../types';
import { RestClient } from './rest';

const octokitRequest = jest.fn().mockResolvedValue({});
const ghRestClient = jest.fn().mockResolvedValue({});

jest.mock('@octokit/core', () => ({
  __esModule: true,
  Octokit: jest.fn(() => ({ request: octokitRequest })),
}));

const REPO_NAME = 'test-repo';
const REPO_USER = 'test-owner';
const createRepoResponseData: GitHubRepository = {
  name: REPO_NAME,
  full_name: `${REPO_USER}${REPO_NAME}`,
  private: false,
  owner: {
    login: REPO_USER,
    avatar_url: 'https://test-url.com',
    url: 'https://test-url.com',
    organizations_url: 'https://test-url.com',
    repos_url: 'https://test-url.com',
    type: 'User',
    site_admin: false,
  },
  blobs_url: 'https://test-url.com',
  branches_url: 'https://test-url.com',
  html_url: 'https://test-url.com',
  description: 'test description',
  collaborators_url: 'https://test-url.com',
  contributors_url: 'https://test-url.com',
  archived: false,
  disabled: false,
  visibility: 'public',
  default_branch: 'main',
  permissions: {
    admin: true,
    push: true,
    pull: true,
  },
};

describe('RestClient', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createRepository', () => {
    const CREATE_REPO_ARGS = {
      name: REPO_NAME,
      isPrivate: false,
    };
    const createRepoResponse = { data: createRepoResponseData };

    let restClient: RestClient;
    beforeEach(() => {
      restClient = new RestClient(ghRestClient);
    });

    test('creates public repository with default description', async () => {
      ghRestClient.mockResolvedValueOnce(createRepoResponse);

      const newRepo = await restClient.createRepository(CREATE_REPO_ARGS);

      expect(ghRestClient).toBeCalledWith('POST /user/repos', {
        name: CREATE_REPO_ARGS.name,
        auto_init: true, // default value
        description: DEFAULT_REPO_DESCRIPTION, // default value
        private: CREATE_REPO_ARGS.isPrivate,
      });

      expect(newRepo).toEqual(createRepoResponseData);
    });

    test('creates private repository with custom description', async () => {
      const createRepoWithCustomArgs = {
        ...CREATE_REPO_ARGS,
        description: 'custom description',
        isPrivate: true,
      };
      const createPrivateRepoData = {
        ...createRepoResponseData,
        private: true,
        visibility: 'private',
      };

      ghRestClient.mockResolvedValueOnce({ data: createPrivateRepoData });

      const newRepo = await restClient.createRepository(createRepoWithCustomArgs);

      expect(ghRestClient).toBeCalledWith('POST /user/repos', {
        name: createRepoWithCustomArgs.name,
        auto_init: true, // default value
        description: createRepoWithCustomArgs.description,
        private: createRepoWithCustomArgs.isPrivate,
      });

      expect(newRepo).toEqual(createPrivateRepoData);
    });

    test('throws when repository already exists', async () => {
      const existingRepoErrorResponse = {
        status: 422,
        data: {
          message: 'Repository creation failed.',
          errors: [
            {
              resource: 'Repository',
              code: 'custom',
              field: 'name',
              message: 'name already exists on this account',
            },
          ],
        },
      };
      const errorMessage = 'Unable to create Repository: Repository already exists on this account.';

      ghRestClient.mockRejectedValueOnce(existingRepoErrorResponse);

      await restClient.createRepository(CREATE_REPO_ARGS)
        .catch((existingRefError) => {
          expect(existingRefError).toBeInstanceOf(RestClientError);
          expect(existingRefError).toMatchInlineSnapshot(`[GitAdpaterError: ${errorMessage}]`);
          expect(existingRefError.message).toBe(errorMessage);
          expect(existingRefError.code).toBe(existingRepoErrorResponse.status);
        });

      expect(ghRestClient).toBeCalledWith('POST /user/repos', {
        name: CREATE_REPO_ARGS.name,
        auto_init: true, // default value
        description: DEFAULT_REPO_DESCRIPTION, // default value
        private: CREATE_REPO_ARGS.isPrivate,
      });
    });

    test('throws when any other error is returned by client', async () => {
      const randomErrorResponse = {
        status: 500,
        data: { message: 'Another error' },
      };
      const errorMessage = `Unable to create Repository: ${randomErrorResponse.data.message}`;

      ghRestClient.mockRejectedValueOnce(randomErrorResponse);

      await restClient.createRepository(CREATE_REPO_ARGS)
        .catch((randomError) => {
          expect(randomError).toBeInstanceOf(RestClientError);
          expect(randomError).toMatchInlineSnapshot(`[GitAdpaterError: ${errorMessage}]`);
          expect(randomError.message).toBe(errorMessage);
          expect(randomError.code).toBe(randomErrorResponse.status);
        });

      expect(ghRestClient).toBeCalledWith('POST /user/repos', {
        name: CREATE_REPO_ARGS.name,
        auto_init: true, // default value
        description: DEFAULT_REPO_DESCRIPTION, // default value
        private: CREATE_REPO_ARGS.isPrivate,
      });
    });

    test('throws when args are invalid', async () => {
      const invalidArgs = {
        name: '',
        description: null as any,
        isPrivate: 1 as any,
      };

      await restClient.createRepository(invalidArgs)
        .catch((validationError) => {
          expect(validationError).toBeInstanceOf(ValidationError);
          expect(validationError).toMatchInlineSnapshot('[GitAdpaterError: Validation error: String must contain at least 1 character(s) at "name"; Expected string, received null at "description"; Expected boolean, received number at "isPrivate"]');
        });

      expect(ghRestClient).not.toHaveBeenCalled();
    });
  });
});
