import { GraphQLFieldConfig } from 'graphql';

import { ResolversMap } from '../..';
import { GraphQLTypeGettersMap } from '../../graphqlTypes';
import { createMutationAddContentType } from './add';
import { createMutationDeleteContentType } from './delete';
import { createMutationUpdateContentType } from './update';

const createContentTypeMutationMap = (
  graphqlTypes: GraphQLTypeGettersMap,
  resolvers: ResolversMap<any>,
): { [mutationName: string]: GraphQLFieldConfig<any, any, any> } => {
  const { addContentType, deleteContentType, updateContentType } = resolvers;

  return {
    addContentType: createMutationAddContentType(
      graphqlTypes,
      addContentType,
    ),
    deleteContentType: createMutationDeleteContentType(
      deleteContentType,
    ),
    updateContentType: createMutationUpdateContentType(
      graphqlTypes,
      updateContentType,
    ),
  };
};

export { createContentTypeMutationMap };
