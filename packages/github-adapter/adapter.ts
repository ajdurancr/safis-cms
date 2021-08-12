import { Octokit } from '@octokit/core'

import { GitAdapter } from './types'
import { GraphQLClient } from './client/graphql'
import { RestClient } from './client/rest'
import { createApi } from './api'

export type CreateAdapterArgs = {
  secret: string
}

const createAdapter = ({ secret }: CreateAdapterArgs): GitAdapter => {
  const {
    graphql: graphqlClient,
    request: restClient,
  } = new Octokit({ auth: secret })

  return createApi({
    rest: new RestClient(restClient),
    graphql: new GraphQLClient(graphqlClient),
  })
}

/**
* @deprecated Use named export { createAdapter } instead.
*/
export default createAdapter

export { createAdapter }
