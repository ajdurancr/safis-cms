import {
  GraphQLString,
  GraphQLEnumType,
  GraphQLNonNull,
  GraphQLInputObjectType,
  GraphQLBoolean,
  GraphQLList,
} from 'graphql';

import { GetGraphQLTypeGettersMapFn } from '../graphqlTypes';

const createContentTypeFieldInput = (
  getTypeGetterMap: GetGraphQLTypeGettersMapFn,
): GraphQLInputObjectType => new GraphQLInputObjectType({
  name: 'ContentTypeFieldInput',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString },
    type: {
      type: new GraphQLNonNull(
        getTypeGetterMap().ContentFieldTypeEnum() as GraphQLEnumType,
      ),
    },
    refType: {
      type: new GraphQLList(
        getTypeGetterMap().ContentEnum() as GraphQLEnumType,
      ),
    },
    isList: { type: GraphQLBoolean },
    isRequired: { type: GraphQLBoolean },
  }),
});

export { createContentTypeFieldInput };
