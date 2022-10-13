import { GraphQLObjectType } from 'graphql';

import type { ResolverCreatorsMap, ResolversMap } from './index';
import type { ContentTypeDefinition, ContentTypesMap } from '../types';
import { createUserDefinedContentQueries } from './content/queries';
import { createQueryContentType } from './contentType/query/contentType';
import { createQueryContentTypeCollection } from './contentType/query/contentTypeCollection';
import type { GetGraphQLTypeGettersMapFn } from './graphqlTypes';

export type ContentTypeMetadata = {
  contentTypesList: ContentTypeDefinition[]
  contentTypesMap: ContentTypesMap
}

const createQuery = (
  contentTypesList: ContentTypeDefinition[],
  getGraphQLTypeGettersMap: GetGraphQLTypeGettersMapFn,
  resolvers: ResolversMap<any>,
  resolverCreatorsMap: ResolverCreatorsMap,
): GraphQLObjectType => {
  const genericContentQueries = createUserDefinedContentQueries(
    contentTypesList,
    getGraphQLTypeGettersMap,
    resolverCreatorsMap,
  );

  return new GraphQLObjectType({
    name: 'Query',
    fields: () => {
      const GraphqlContentType = getGraphQLTypeGettersMap().ContentType() as GraphQLObjectType;

      return {
        contentTypeCollection: createQueryContentTypeCollection(
          GraphqlContentType,
          resolvers.contentTypeCollection,
        ),
        contentType: createQueryContentType(
          GraphqlContentType,
          resolvers.contentType,
        ),
        // ...Object.keys(userDefinedContentTypesMap).reduce((typesMap, typeName) => ({
        //   ...typesMap,
        //   [typeName]: {
        //     // name: typeName,
        //     type: userDefinedContentTypesMap[typeName],
        //   },
        // }), {}),
        // content: createGraphqlContent(contentTypesMap),
        ...genericContentQueries,
      };
    },
  });
};
export { createQuery };
