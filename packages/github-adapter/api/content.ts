import get from 'lodash.get'
import isNil from 'lodash.isnil'

import { FileApi } from './file'
import {
  ContentApiInterface,
  CreateContentArgs,
  DeleteFileContentArgs,
  FileApiInterface,
  GenericContent,
  GetFileContentArgs,
  GetFolderContentArgs,
  UnifiedClients,
  UpdateContentArgs,
} from '../types'

class ContentApi implements ContentApiInterface {
  protected clients: UnifiedClients

  protected contentTypeName: string

  protected fileApi: FileApiInterface

  constructor(clients: UnifiedClients, contentTypeName: string) {
    this.clients = clients
    this.contentTypeName = contentTypeName
    this.fileApi = new FileApi(clients)
  }

  create = async (args: CreateContentArgs): Promise<GenericContent> => {
    const {
      owner,
      repo,
      branch,
      path,
      content,
      commitMessage = this.getDefaultCommitMessage('Add'),
    } = args
    const fileContent = await this.fileApi.getFileContent({
      owner,
      repo,
      path,
      branch,
    })

    if (!isNil(fileContent)) throw new Error(`${this.contentTypeName} already exists.`)

    await this.fileApi.createFileContent({
      repo,
      owner,
      branch,
      files: {
        content: JSON.stringify(content),
        path,
      },
      commitMessage,
    })

    return content
  }

  delete = async (args: DeleteFileContentArgs): Promise<boolean> => {
    const {
      owner,
      repo,
      branch,
      path,
      commitMessage = this.getDefaultCommitMessage('Delete'),
    } = args
    const fileContent = await this.fileApi.getFileContent({
      owner,
      repo,
      path,
      branch,
    })

    if (isNil(fileContent)) throw new Error(`${this.contentTypeName} not found.`)

    await this.fileApi.deleteFileContent({
      repo,
      owner,
      branch,
      path,
      commitMessage,
    })

    return true
  }

  get = async (args: GetFileContentArgs): Promise<GenericContent | null> => {
    const { owner, repo, path, branch } = args
    const fileContent = await this.fileApi.getFileContent({
      owner,
      repo,
      path,
      branch,
    })

    if (isNil(fileContent)) return null

    return JSON.parse(fileContent)
  }

  protected getDefaultCommitMessage = (action: string): string => `${action} ${this.contentTypeName} - Safis CMS`

  getAll = async (args: GetFolderContentArgs): Promise<GenericContent[]> => {
    const { owner, repo, path, branch } = args
    const filesContent = await this.fileApi.getFolderContent({
      owner,
      repo,
      path,
      branch,
    })

    return filesContent.reduce((filtered, entry) => {
      const content = get(entry, 'object.text') as string | undefined

      if (!isNil(content)) {
        filtered.push(JSON.parse(content as string))
      }

      return filtered
    }, [] as GenericContent[])
  }

  update = async (args: UpdateContentArgs): Promise<GenericContent> => {
    const {
      owner,
      repo,
      branch,
      path,
      content: newContent,
      commitMessage = this.getDefaultCommitMessage('Update'),
    } = args
    const fileContent = await this.fileApi.getFileContent({
      owner,
      repo,
      path,
      branch,
    })

    if (isNil(fileContent)) throw new Error(`${this.contentTypeName} not found.`)

    const parsedExistingContent = JSON.parse(fileContent)

    const mergedContent = {
      ...parsedExistingContent,
      ...newContent,
    }

    await this.fileApi.createFileContent({
      repo,
      owner,
      branch,
      files: {
        content: JSON.stringify(mergedContent),
        path,
      },
      commitMessage,
    })

    return mergedContent
  }
}

export { ContentApi }
