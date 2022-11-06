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
  fields: () => {
    const fieldTypeEnum = getTypeGetterMap().ContentFieldTypeEnum() as GraphQLEnumType;
    const contentEnum = getTypeGetterMap().ContentEnum() as GraphQLEnumType;
    const availableUserContentTypes: string[] = contentEnum.getValues().map(({ value }) => value);
    const refTypeDescription = availableUserContentTypes.length
      ? `\`${availableUserContentTypes.join('` | `')}\``
      : 'No types available yet.';

    return {
      id: { type: new GraphQLNonNull(GraphQLString) },
      name: { type: new GraphQLNonNull(GraphQLString) },
      description: { type: GraphQLString },
      type: { type: new GraphQLNonNull(fieldTypeEnum) },
      refType: {
        type: new GraphQLList(
          new GraphQLNonNull(GraphQLString),
        ),
        description: refTypeDescription,
      },
      isList: { type: GraphQLBoolean },
      isRequired: { type: GraphQLBoolean },
    };
  },
});

export { createContentTypeFieldInput };
