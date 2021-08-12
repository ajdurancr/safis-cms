import { AuthenticatedUser, UnifiedClients, UserApiInterface } from '../types'

class UserApi implements UserApiInterface {
  protected clients: UnifiedClients

  constructor(clients: UnifiedClients) {
    this.clients = clients
  }

  getAuthenticated = (): Promise<AuthenticatedUser> => this.clients.rest.getAuthenticatedUser()
}

export { UserApi }
