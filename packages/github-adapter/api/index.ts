import { UnifiedClients, GitAdapter } from '../types'

import { ContentApi } from './content'
import { OAuthApi } from './oauth'
import { RepositoryApi } from './repository'
import { UserApi } from './user'

const createApi = (unifiedClient: UnifiedClients): GitAdapter => ({
  content: new ContentApi(unifiedClient, 'Content'),
  contentType: new ContentApi(unifiedClient, 'ContentType'),
  oauth: new OAuthApi(unifiedClient),
  repository: new RepositoryApi(unifiedClient),
  user: new UserApi(unifiedClient),
})

export { createApi }
