import { GraphQLObjectType } from 'graphql';

import { ResolversMap } from './index';
import type { CMSGraphQLFieldResolver, SchemaUpdaterFn } from '../types';
import type { GraphQLTypeGettersMap } from './graphqlTypes';
import { createMutationAddContentType } from './contentType/mutation/add';
import { createMutationDeleteContentType } from './contentType/mutation/delete';
import { createMutationUpdateContentType } from './contentType/mutation/update';

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
    fields: () => ({
      // ContentType mutations
      addContentType: createMutationAddContentType(
        graphqlTypes,
        reflectStructuralChange(addContentType),
      ),
      deleteContentType: createMutationDeleteContentType(
        reflectStructuralChange(deleteContentType),
      ),
      updateContentType: createMutationUpdateContentType(
        graphqlTypes,
        reflectStructuralChange(updateContentType),
      ),
    }),
  });
};

export { createMutation };
