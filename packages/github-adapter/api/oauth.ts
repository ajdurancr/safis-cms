import {
  GetOAuthAccessTokenArgs,
  GetOAuthLoginUrlArgs,
  OAuthApiInterface,
  UnifiedClients,
} from '../types'

class OAuthApi implements OAuthApiInterface {
  protected clients

  constructor(clients: UnifiedClients) {
    this.clients = clients
  }

  getAccessToken =(args: GetOAuthAccessTokenArgs): Promise<string> => {
    const { clientId, clientSecret, query } = args

    return this.clients.rest.getOAuthAccessToken({ clientId, clientSecret, query })
  }

  getLoginUrl = (args: GetOAuthLoginUrlArgs): string => this.clients.rest.getOAuthLoginUrl(args)
}

export { OAuthApi }
