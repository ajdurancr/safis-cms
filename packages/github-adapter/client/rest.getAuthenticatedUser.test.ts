import { RestClientError } from '../error';
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

  describe('getAuthenticatedUser', () => {
    let restClient: RestClient;
    beforeEach(() => {
      restClient = new RestClient(ghRestClient);
    });

    test('gets authenticated user info correctly', async () => {
      const authUserResponseData = {
        login: 'test-owner',
        avatar_url: 'https://test-url.com',
        email: 'test@email.com',
      };
      const authUserResponse = {
        data: authUserResponseData,
        headers: { 'x-oauth-scopes': 'test_repo_scope' },
      };

      ghRestClient.mockResolvedValueOnce(authUserResponse);

      const userInfo = await restClient.getAuthenticatedUser();

      expect(ghRestClient).toBeCalledWith('/user');

      expect(userInfo).toEqual({
        username: authUserResponseData.login,
        avatarUrl: authUserResponseData.avatar_url,
        email: authUserResponseData.email,
        scope: authUserResponse.headers['x-oauth-scopes'],
      });
    });

    test('throws when any other error is returned by client', async () => {
      const randomErrorResponse = {
        status: 500,
        data: { message: 'Another error' },
      };
      const errorMessage = `Unable to get authenticated user: ${randomErrorResponse.data.message}`;

      ghRestClient.mockRejectedValueOnce(randomErrorResponse);

      await restClient.getAuthenticatedUser()
        .catch((randomError) => {
          expect(randomError).toBeInstanceOf(RestClientError);
          expect(randomError.message).toEqual(errorMessage);
          expect(randomError.code).toEqual(randomErrorResponse.status);
          expect(randomError).toMatchInlineSnapshot(`[GitAdpaterError: ${errorMessage}]`);
        });

      expect(ghRestClient).toBeCalledWith('/user');
    });
  });
});
