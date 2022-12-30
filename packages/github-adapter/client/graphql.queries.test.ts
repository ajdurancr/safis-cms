import {
  createQueryGetFilteredFilesContent,
  FILES_SELECTED_FIELDS_REPLACE_TEMPLATE,
  FILE_SELECTED_FILEDS,
  QUERY_GET_BASE_COMMIT_INFO,
  QUERY_GET_FILE_CONTENT,
  QUERY_GET_FILTERED_FILES_CONTENT,
  QUERY_GET_FOLDER_CONTENT,
  QUERY_GET_REPOSITORY,
} from './graphql.queries';

describe('GraphQL Queries', () => {
  test('FILE_SELECTED_FILEDS', () => {
    expect(FILE_SELECTED_FILEDS).toMatchInlineSnapshot(`
"
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
"
`);
  });

  test('QUERY_GET_BASE_COMMIT_INFO', () => {
    expect(QUERY_GET_BASE_COMMIT_INFO).toMatchInlineSnapshot(`
"
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
}"
`);
  });

  test('QUERY_GET_FILE_CONTENT', () => {
    expect(QUERY_GET_FILE_CONTENT).toMatchInlineSnapshot(`
"
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
}"
`);
  });

  test('FILES_SELECTED_FIELDS_REPLACE_TEMPLATE', () => {
    expect(FILES_SELECTED_FIELDS_REPLACE_TEMPLATE).toMatchInlineSnapshot('"##REPLACE_WITH_FILES_SELECTED_FIELDS##"');
  });

  test('QUERY_GET_FILTERED_FILES_CONTENT', () => {
    expect(QUERY_GET_FILTERED_FILES_CONTENT).toMatchInlineSnapshot(`
"
query getFilteredFilesContent($repo: String!, $owner: String!, $ref: String!) { 
  repository(name: $repo, owner: $owner) {
    ref(qualifiedName: $ref) {
      target {
        ... on Commit {
          __typename
          ${FILES_SELECTED_FIELDS_REPLACE_TEMPLATE}
        }
      }
    }
  }
}"
`);
  });

  test('QUERY_GET_FOLDER_CONTENT', () => {
    expect(QUERY_GET_FOLDER_CONTENT).toMatchInlineSnapshot(`
"
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
}"
`);
  });

  test('QUERY_GET_REPOSITORY', () => {
    expect(QUERY_GET_REPOSITORY).toMatchInlineSnapshot(`
"
query getRepository($owner: String!, $name: String!){
  repository(owner: $owner, name: $name) {
    name
    description
    defaultBranchRef {
      id
      name 
    }
    isPrivate
    owner {
      login
    }
  }
}
"
`);
  });

  test('createQueryGetFilteredFilesContent', () => {
    const filesInfo: { path: string, fieldName: string }[] = [{
      path: 'test/path/file-1.json',
      fieldName: 'testField1',
    }, {
      path: 'test/path/file-2.json',
      fieldName: 'testField2',
    }, {
      path: 'test/path/file-3.json',
      fieldName: 'testField3',
    }];

    expect(createQueryGetFilteredFilesContent(filesInfo)).toMatchInlineSnapshot(`
"
query getFilteredFilesContent($repo: String!, $owner: String!, $ref: String!) { 
  repository(name: $repo, owner: $owner) {
    ref(qualifiedName: $ref) {
      target {
        ... on Commit {
          __typename
          
    
    
    
    testField1: file(path: "test/path/file-1.json") {
      
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
  
    testField2: file(path: "test/path/file-2.json") {
      
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
  
    testField3: file(path: "test/path/file-3.json") {
      
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
}"
`);
  });
});
