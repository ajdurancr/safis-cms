import { GraphQLFieldConfigMap, GraphQLList, GraphQLNonNull, GraphQLObjectType } from 'graphql';

import { getGraphqlTypeName } from '../../helpers/graphql';
import type {
  CMSGraphQLFieldResolver,
  ContentTypeDefinition,
  GenericContent,
} from '../../types';
import type { ResolverCreatorsMap } from '../index';
import { GetGraphQLTypeGettersMapFn } from '../graphqlTypes';

type ContentCollection = CMSGraphQLFieldResolver<any, any, any, Promise<GenericContent[]>>

const createResolveCollectionFn = (
  contentType: ContentTypeDefinition,
  resolveFn: ContentCollection,
): ContentCollection => async (...args) => {
  const collection = await Promise.resolve(resolveFn(...args)) || [];

  return collection.map((item) => ({
    ...item,
    sys: {
      id: item.id,
      __contentTypeId: contentType.id,
    },
  }));
};

const createContentCollectionQueryMap = (
  contentTypesList: ContentTypeDefinition[],
  getGraphQLTypeGettersMap: GetGraphQLTypeGettersMapFn,
  resolverCreatorsMap: ResolverCreatorsMap,
): GraphQLFieldConfigMap<any, any> => contentTypesList
  .reduce((contentCollectionQueries, contentType) => {
    const graphqlTypeName = getGraphqlTypeName(contentType.id);
    const contentColectionResolver = createResolveCollectionFn(
      contentType,
      resolverCreatorsMap.contentCollection(contentType),
    );

    return {
      ...contentCollectionQueries,
      [`${contentType.id}Collection`]: {
        type: new GraphQLNonNull( // [GraphqlUserDefinedType!]!
          new GraphQLList(
            new GraphQLNonNull(
                getGraphQLTypeGettersMap()[graphqlTypeName]() as GraphQLObjectType,
            ),
          ),
        ),
        resolve: contentColectionResolver,
      },
    };
  }, {});

export { createContentCollectionQueryMap };
