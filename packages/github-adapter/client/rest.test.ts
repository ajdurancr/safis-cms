import { GitHubClientError, ValidationError } from '../error';
import { RestClient } from './rest';

const octokitRequest = jest.fn().mockResolvedValue({});
const ghRestClient = jest.fn().mockResolvedValue({});

jest.mock('@octokit/core', () => ({
  __esModule: true,
  Octokit: jest.fn(() => ({ request: octokitRequest })),
}));

const ACCESS_TOKEN = 'test-access-token';
const OAUTH_CALLBACK_CODE = 'test-code';
const OAUTH_CLIENT_ID = 'test-client-id';
const OAUTH_CLIENT_SECRET = 'test-client-secret';

describe('RestClient', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('inits correctly', () => {
      const restClient = new RestClient(ghRestClient);

      // eslint-disable-next-line dot-notation
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

      expect(ghRestClient).not.toHaveBeenCalled();
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
});
