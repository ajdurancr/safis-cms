import { GraphQLObjectType } from 'graphql';

import type { ResolversMap } from './index';
import type { CMSGraphQLFieldResolver, SchemaUpdaterFn } from '../types';
import type { GraphQLTypeGettersMap } from './graphqlTypes';
import { createContentTypeMutationMap } from './contentType/mutation';

const createSchemaUpdaterHandler = (
  schemaUpdater: SchemaUpdaterFn,
) => (
  mutationResolver: CMSGraphQLFieldResolver,
): CMSGraphQLFieldResolver => async (...args) => {
  const result = await mutationResolver(...args);

  schemaUpdater();

  return result;
};

const createMutation = (
  graphqlTypes: GraphQLTypeGettersMap,
  resolvers: ResolversMap<any>,
  schemaUpdater: SchemaUpdaterFn,
): GraphQLObjectType => {
  const { addContentType, deleteContentType, updateContentType } = resolvers;
  const reflectStructuralChange = createSchemaUpdaterHandler(schemaUpdater);

  return new GraphQLObjectType({
    name: 'Mutation',
    fields: () => {
      const contentTypeResolvers = {
        addContentType: reflectStructuralChange(addContentType),
        deleteContentType: reflectStructuralChange(deleteContentType),
        updateContentType: reflectStructuralChange(updateContentType),
      };

      const contentTypeMutationsMap = createContentTypeMutationMap(
        graphqlTypes,
        contentTypeResolvers,
      );

      return { ...contentTypeMutationsMap };
    },
  });
};

export { createMutation };
