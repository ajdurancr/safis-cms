import get from 'lodash.get'

import { FileApi } from './file'
import { DEFAULT_REPO_DESCRIPTION } from '../constants'
import {
  InitRepoArgs,
  InitRepoResponse,
  FileApiInterface,
  RespositoryApiInterface,
  UnifiedClients,
} from '../types'

class RepositoryApi implements RespositoryApiInterface {
  protected clients: UnifiedClients

  protected fileApi: FileApiInterface

  constructor(unifiedClients: UnifiedClients) {
    this.clients = unifiedClients
    this.fileApi = new FileApi(this.clients)
  }

  init = async (args: InitRepoArgs): Promise<InitRepoResponse> => {
    const {
      owner,
      name,
      isPrivate = false,
      description,
    } = args
    const existingRepoInfo = await this.clients.graphql.getRepository({ owner, name })
      .catch((error: { type: string }[]) => {
        if (get(error, 'errors[0].type') === 'NOT_FOUND') return {}

        throw error
      })

    if (get(existingRepoInfo, 'repository.name')) return InitRepoResponse.FOUND

    await this.clients.rest.createRepository({
      name,
      description,
      isPrivate,
    })

    await this.fileApi.createFileContent({
      repo: name,
      owner,
      branch: 'main', // default branch
      files: {
        path: 'README.md',
        content: DEFAULT_REPO_DESCRIPTION,
      },
      commitMessage: 'Safis CMS initial commit',
    })

    return InitRepoResponse.CREATED
  }
}

export { RepositoryApi }
