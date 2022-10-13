import { GraphQLFieldConfigMap, GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';

import type { GraphQLUserDefinedContentTypesMap } from './content';
import { getGraphqlTypeName } from '../../helpers/graphql';
import type {
  CMSGraphQLFieldResolver,
  ContentTypeDefinition,
  GenericContent,
} from '../../types';
import type { ResolverCreatorsMap } from '../index';
import { GetGraphQLTypeGettersMapFn } from '../graphqlTypes';

type ContentResolver = CMSGraphQLFieldResolver<any, any, any, Promise<GenericContent | null>>

const createResolveContentFn = (
  contentType: ContentTypeDefinition,
  resolveFn: ContentResolver,
): ContentResolver => async (...args) => {
  const content = await Promise.resolve(resolveFn(...args));

  if (!content) return content;

  return {
    ...content,
    sys: {
      id: content.id,
      __contentTypeId: contentType.id,
    },
  };
};

const createContentQueryMap = (
  contentTypesList: ContentTypeDefinition[],
  getGraphQLTypeGettersMap: GetGraphQLTypeGettersMapFn,
  resolverCreatorsMap: ResolverCreatorsMap,
): GraphQLFieldConfigMap<any, any> => contentTypesList
  .reduce((contentQueries, contentType) => {
    const graphqlTypeName = getGraphqlTypeName(contentType.id);
    const contentResolver = createResolveContentFn(
      contentType,
      resolverCreatorsMap.content(contentType),
    );

    return {
      ...contentQueries,
      [contentType.id]: {
        type: getGraphQLTypeGettersMap()[graphqlTypeName]() as GraphQLObjectType,
        args: { id: { type: new GraphQLNonNull(GraphQLString) } },
        resolve: contentResolver,
      },
    };
  }, {});

export { createContentQueryMap };
