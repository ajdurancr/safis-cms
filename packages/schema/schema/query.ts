import { GraphQLObjectType } from 'graphql';

import type { ResolverCreatorsMap, ResolversMap } from './index';
import type { ContentTypeDefinition, ContentTypesMap } from '../types';
import { createUserDefinedContentQueries } from './content/queries';
import { createContentTypeQueryMap } from './contentType/query';
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
      const graphqlContentType = getGraphQLTypeGettersMap().ContentType() as GraphQLObjectType;
      const contentTypeQueryMap = createContentTypeQueryMap(graphqlContentType, resolvers);

      return {
        ...contentTypeQueryMap,
        ...genericContentQueries,
      };
    },
  });
};
export { createQuery };
