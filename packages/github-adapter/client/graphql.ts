import {
  GetBaseCommitInfoArgs,
  GetRepositoryArgs,
  GitHubGraphQLClient,
  GraphQLClientInterface,
  GraphQLGetBaseCommitInfoResponse,
  GraphQLGetFileContentArgs,
  GraphQLGetFileContentResponse,
  GraphQLGetFolderContentArgs,
  GraphQLGetFolderContentResponse,
  GraphQLGetRepositoryResponse,
} from '../types';
import {
  QUERY_GET_BASE_COMMIT_INFO,
  QUERY_GET_FILE_CONTENT,
  QUERY_GET_FOLDER_CONTENT,
  QUERY_GET_REPOSITORY,
} from './graphql.queries';

class GraphQLClient implements GraphQLClientInterface {
  protected client: GitHubGraphQLClient

  constructor(client: GitHubGraphQLClient) {
    this.client = client;
  }

  getBaseCommitInfo = (args: GetBaseCommitInfoArgs): Promise<GraphQLGetBaseCommitInfoResponse> => {
    const { owner, repo, branch } = args;

    return this.client(
      QUERY_GET_BASE_COMMIT_INFO,
      { owner, repo, ref: `refs/heads/${branch}` },
    );
  }

  getFileContent = (args: GraphQLGetFileContentArgs): Promise<GraphQLGetFileContentResponse> => {
    const { owner, repo, branch, path } = args;

    return this.client(
      QUERY_GET_FILE_CONTENT,
      { owner, repo, ref: `refs/heads/${branch}`, path },
    );
  }

  /* eslint-disable-next-line max-len */
  getFolderContent = (args: GraphQLGetFolderContentArgs): Promise<GraphQLGetFolderContentResponse> => {
    const {
      owner,
      repo,
      branch,
      path,
    } = args;

    return this.client(
      QUERY_GET_FOLDER_CONTENT,
      { owner, repo, ref: `refs/heads/${branch}`, path },
    );
  }

  getRepository = (args: GetRepositoryArgs): Promise<GraphQLGetRepositoryResponse> => {
    const { owner, name } = args;

    return this.client(QUERY_GET_REPOSITORY, { owner, name });
  }
}

export { GraphQLClient };
