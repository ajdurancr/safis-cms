/* eslint-disable camelcase */

// Git

export enum GitItemType {
  BLOB = 'blob',
  TREE = 'tree',
  COMMIT = 'commit',
}

export enum GitFileMode {
  BLOB = '100644',
  TREE = '040000',
  COMMIT = '160000',
}

export type Blob = {
  url?: string,
  sha: string | null,
}

export type Tree = {
  mode: GitFileMode,
  type: GitItemType,
  path: string,
  sha: string,
}

// GitHub

export type GitHubRepoOwner = {
  login: string,
  avatar_url: string,
  url: string,
  organizations_url: string,
  repos_url: string,
  type: string,
  site_admin: boolean
}

export type GitHubRepoPermissions = {
  admin: boolean,
  push: boolean,
  pull: boolean,
}

export type GitHubRepository = {
  name: string,
  full_name: string,
  owner: GitHubRepoOwner,
  private: boolean,
  html_url: string,
  description: string,
  blobs_url: string,
  branches_url: string,
  collaborators_url: string,
  contributors_url: string,
  default_branch: string,
  archived: boolean,
  disabled: boolean,
  visibility: string,
  permissions: GitHubRepoPermissions,
}

// AdapterRestClient arguments

export type CreateBlobArgs = {
  owner: string,
  repo: string,
  content: string,
}

export type CreateCommitArgs = {
  owner: string,
  repo: string,
  message: string,
  tree: string,
  parents: string[],
}

export type CreateTreeArgs = {
  owner: string,
  repo: string,
  treeItems: Tree[],
  baseTree: string,
}

export type CreateRefArgs = {
  owner: string,
  repo: string,
  ref: string,
  sha: string,
}

export type CreateRepoArgs = {
  name: string,
  description: string,
  isPrivate: boolean,
}

export type GetOAuthAccessTokenArgs = {
  clientId: string,
  clientSecret: string,
  query: { code: string },
}
export type GetOAuthLoginUrlArgs = {
  clientId: string,
  scope: string[],
}

export type UpdateRefArgs = CreateRefArgs & {
  force?: boolean,
}

// AdapterRestClient response types

export type CommitAuthor = {
  date: string,
  name: string,
  email: string,
}

export type CommitTreeInfo = {
  sha: string,
  url: string,
}

export type PartentCommitInfo = {
  sha: string,
  url: string,
}

export type Commit = {
  sha: string,
  author: CommitAuthor,
  committer: CommitAuthor,
  message: string,
  tree: CommitTreeInfo,
  parents: PartentCommitInfo[],
}

export type CreateRefObjectResponse = {
  type: string,
  sha: string,
  url: string,
}

export type CreateUpdateRefResponse = {
  ref: string,
  url: string,
  object: CreateRefObjectResponse,
}

export type CreateTreeResponse = {
  sha: string,
  url: string,
  tree: Tree[],
  truncated: boolean,
}

// createFileApi helper arguments

export type CreateSingleTreeItemArgs = {
  path: string,
  blob: Blob
}

export type AuthenticatedUser = {
  username: string,
  avatarUrl: string,
  email: string,
  scope: string,
}

// Clients

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export type GitHubRestClient = any

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export type GitHubGraphQLClient = any

// GraphQL Client

export type GetBaseCommitInfoArgs = {
  branch: string,
  owner: string,
  repo: string,
}

export type GetRepositoryArgs = {
  name: string,
  owner: string,
}

export type GraphQLGetFileContentArgs = {
  branch: string,
  owner: string,
  path: string,
  repo: string,
}

export type GraphQLGetFolderContentArgs = GraphQLGetFileContentArgs

export type GraphQLGetBaseCommitInfoResponse = {
  repository: {
    ref: {
      target: {
          commitSha: string
          tree: {
            sha: string
          }
        }
      }
  }
}

export type GraphQLGetRepositoryResponse = {
  repository: {
    name: string
  }
}

export type GraphQLGetFileContentResponse = {
  repository: {
    ref: {
      target: {
        file: {
          object: {
            __typename: string
            id: string
            text: string
            isTruncated: boolean
          }
        }
      }
    }
  }
}

export type GraphQLFileEntry = {
  object: {
    __typename: string
    isTruncated: boolean
    text: string
  }
}

export type GraphQLGetFolderContentResponse = {
  repository: {
    ref: {
      target: {
        files: {
          __typename: string
          object: {
            __typename: string
            entries: GraphQLFileEntry[]
          }
        }
      }
    }
  }
}

export interface GraphQLClientInterface {
  getBaseCommitInfo(args: GetBaseCommitInfoArgs): Promise<GraphQLGetBaseCommitInfoResponse>
  getFileContent(args: GraphQLGetFileContentArgs): Promise<GraphQLGetFileContentResponse>
  getFolderContent(args: GraphQLGetFolderContentArgs): Promise<GraphQLGetFolderContentResponse>
  getRepository(args: GetRepositoryArgs): Promise<GraphQLGetRepositoryResponse>
}

// Rest Client

export interface RestClientInterface {
  // content
  createBlob: (args: CreateBlobArgs) => Promise<Blob>,
  createTree: (args: CreateTreeArgs) => Promise<CreateTreeResponse>,
  createCommit: (args: CreateCommitArgs) => Promise<Commit>,

  // repo
  createRepository: (args: CreateRepoArgs) => Promise<GitHubRepository>,

  // refs
  createRef: (args: CreateRefArgs) => Promise<CreateUpdateRefResponse>,
  updateRef: (args: UpdateRefArgs) => Promise<CreateUpdateRefResponse>,

  // user
  getAuthenticatedUser: () => Promise<AuthenticatedUser>,

  // oatuh
  getOAuthAccessToken: (args: GetOAuthAccessTokenArgs) => Promise<string>,
  getOAuthLoginUrl: (args: GetOAuthLoginUrlArgs) => string,
}

export type UnifiedClients = {
  rest: RestClientInterface,
  graphql: GraphQLClientInterface,
}

// File Api Args

export type InputFile = {
  path: string,
  content: string,
}

export type CreateBlobInfoArgs = {
  repo: string,
  owner: string,
  files: InputFile | InputFile[],
  multi: boolean,
}

export type CreateFileContentArgs = {
  repo: string,
  owner: string,
  branch: string,
  files: InputFile | InputFile[],
  commitMessage: string,
}

export type DeleteFileContentArgs = {
  repo: string,
  owner: string,
  branch: string,
  path: string,
  commitMessage: string,
}

export type GetFileContentArgs = {
  owner: string,
  repo: string,
  branch: string,
  path: string,
}

export type GetFolderContentArgs = GetFileContentArgs

// File Api responses

export type BlobInfo = {
  path: string,
  blob: Blob,
}

export type ContentInfo = {
  path: string,
  sha: string,
}

export type GraphQLContentEntry = {
  object: {
    __typename: string,
    isTruncated: boolean,
    text: string,
  }
}

// File Api main interface

export interface FileApiInterface {
  createSingleTreeItem: (args: CreateSingleTreeItemArgs) => Tree,
  createTreeItems: (
    blobInfo: CreateSingleTreeItemArgs[] | CreateSingleTreeItemArgs,
    multi: boolean,
  ) => Tree[],
  createBlobInfo: (args: CreateBlobInfoArgs) => Promise<BlobInfo | BlobInfo[]>,
  createFileContent: (args: CreateFileContentArgs) => Promise<ContentInfo | ContentInfo[]>,
  deleteFileContent (args: DeleteFileContentArgs): Promise<boolean>,
  getFileContent: (args: GetFileContentArgs) => Promise<string>,
  getFolderContent: (args: GetFolderContentArgs) => Promise<GraphQLContentEntry[]>,
}

// Content Api

export interface GenericContent {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  [key: string]: any
}

// Content Api args

export type CreateContentArgs = CreateFileContentArgs & {
  branch: string,
  commitMessage?: string,
  content: GenericContent,
  path: string,
}

export type UpdateContentArgs = {
  owner: string,
  repo: string,
  branch: string,
  path: string,
  content: GenericContent,
  commitMessage?: string,
}

// Content Api main interface

export interface ContentApiInterface {
  create(args: CreateContentArgs): Promise<GenericContent>
  delete(args: DeleteFileContentArgs): Promise<boolean>
  get(args: GetFileContentArgs): Promise<GenericContent | null>
  getAll(args: GetFolderContentArgs): Promise<GenericContent[]>
  update(args: UpdateContentArgs): Promise<GenericContent>
}

// Repository Api

export enum InitRepoResponse {
  CREATED = 'CREATED',
  FOUND = 'FOUND', // repo was found
}

// Repository Api args

export type InitRepoArgs = {
  description: string,
  isPrivate?: boolean,
  name: string,
  owner: string,
}

// OAuth Api main interface

export interface OAuthApiInterface {
  getAccessToken(args: GetOAuthAccessTokenArgs): Promise<string>
  getLoginUrl(args: GetOAuthLoginUrlArgs): string
}

// Repository Api main interface

export interface RespositoryApiInterface {
  init: (args: InitRepoArgs) => Promise<InitRepoResponse>,
}

// User Api main interface

export interface UserApiInterface {
  getAuthenticated(): Promise<AuthenticatedUser>
}

// GitAdapter

export interface GitAdapter {
  content: ContentApiInterface,
  contentType: ContentApiInterface,
  oauth: OAuthApiInterface,
  repository: RespositoryApiInterface,
  user: UserApiInterface,
}

// Others

export enum AdapterError {
  NOT_FOUND = 'NOT_FOUND'
}
