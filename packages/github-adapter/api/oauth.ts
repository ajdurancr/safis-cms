import { RestClient } from '../client/rest';

class OAuthApi {
  static getAccessToken = RestClient.getOAuthAccessToken

  static getLoginUrl = RestClient.getOAuthLoginUrl
}

export { OAuthApi };
