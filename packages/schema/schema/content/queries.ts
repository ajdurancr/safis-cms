import { GraphQLFieldConfigMap } from 'graphql';

import { createContentCollectionQueryMap } from './contentCollection.query';
import { createContentQueryMap } from './content.query';

import { ContentTypeDefinition } from '../../types';
import { ResolverCreatorsMap } from '../index';
import { GetGraphQLTypeGettersMapFn } from '../graphqlTypes';

const createUserDefinedContentQueries = (
  contentTypesList: ContentTypeDefinition[],
  getGraphqlTypeGettersMap: GetGraphQLTypeGettersMapFn,
  resolverCreatorsMap: ResolverCreatorsMap,
): GraphQLFieldConfigMap<any, any> => {
  const contentCollectionQueries = createContentCollectionQueryMap(
    contentTypesList,
    getGraphqlTypeGettersMap,
    resolverCreatorsMap,
  );
  const contentQueries = createContentQueryMap(
    contentTypesList,
    getGraphqlTypeGettersMap,
    resolverCreatorsMap,
  );

  return {
    ...contentQueries,
    ...contentCollectionQueries,
  };
};

export { createUserDefinedContentQueries };
