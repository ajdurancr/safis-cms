export const QUERY_GET_BASE_COMMIT_INFO = `
query getBaseCommitInfo($repo: String!, $owner: String!, $ref: String!) { 
  repository(name: $repo, owner: $owner) {
    ref(qualifiedName: $ref) {
      target {
        ... on Commit {
          commitSha: oid
          tree {
            sha: oid
          }
        }
      }
    }
  }
}`

export const QUERY_GET_FILE_CONTENT = `
query getFileContent($repo: String!, $owner: String!, $ref: String!, $path: String!) { 
  repository(name: $repo, owner: $owner) {
    ref(qualifiedName: $ref) {
      target {
        ... on Commit {
          file(path: $path) {
            ... on TreeEntry {
              object {
                __typename
                ... on Blob {
                  id
                  text
                  isTruncated
                }
              }
            }
          }
        }
      }
    }
  }
}`

export const QUERY_GET_FOLDER_CONTENT = `
query getFolderContent($repo: String!, $owner: String!, $ref: String!, $path: String!) { 
  repository(name: $repo, owner: $owner) {
    ref(qualifiedName: $ref) {
      target {
        ... on Commit {
          files: file(path: $path) {
            __typename
            ... on TreeEntry {
              __typename
              object {
                ... on Tree {
                  __typename
                  entries {
                    object {
                      __typename
                      ... on Blob {
                          isTruncated
                          text
                        }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`

export const QUERY_GET_REPOSITORY = `
query getRepository($owner: String!, $name: String!){
  repository(owner: $owner, name: $name) {
    name
  }
}
`
