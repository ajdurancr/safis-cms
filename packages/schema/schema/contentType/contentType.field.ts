import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLEnumType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLBoolean,
} from 'graphql';
import { ContentTypeFieldTypeEnum } from '../../types';

import type { GetGraphQLTypeGettersMapFn } from '../graphqlTypes';

const DEFAULT_REF_FIELD_DESC = `When \`type\` = \`${ContentTypeFieldTypeEnum.Ref}\`, it will create references based on selected types that are still avaible in schema.`;

const getRefTypeDescription = (availableContentEnumValues: string[]) => {
  if (!availableContentEnumValues.length) return `${DEFAULT_REF_FIELD_DESC}.\nNo types available yet.`;

  const availableTypesMessage = `Available types: \`${availableContentEnumValues.join('` | `')}\``;

  return `${DEFAULT_REF_FIELD_DESC}\n${availableTypesMessage}`;
};

const createContentTypeField = (
  getGraphQLTypeGettersMap: GetGraphQLTypeGettersMapFn,
): GraphQLObjectType => new GraphQLObjectType({
  name: 'ContentTypeField',
  fields: () => {
    const contentEnum = getGraphQLTypeGettersMap().ContentEnum() as GraphQLEnumType;
    const availableContentEnumValues = contentEnum.getValues().map(({ value }) => value);

    return {
      id: {
        type: new GraphQLNonNull(GraphQLString),
        description: 'Used to create property name inside content. e.g.: `{ myFiledId: \'id-1234\' }`',
      },
      name: {
        type: new GraphQLNonNull(GraphQLString),
        description: 'Display name.',
      },
      description: { type: GraphQLString },
      type: {
        type: new GraphQLNonNull(
        getGraphQLTypeGettersMap().ContentFieldTypeEnum() as GraphQLEnumType,
        ),
        description: 'Type of data to be stored in this field. e.g.: `String`, `Boolean`, etc.',
      },
      refType: {
        description: getRefTypeDescription(availableContentEnumValues),
        type: new GraphQLList(
          new GraphQLNonNull(GraphQLString),
        ),
      },
      isList: {
        type: GraphQLBoolean,
        description: 'Indicates if the field will contain a single element or multiple ones.',
      },
      isRequired: {
        type: GraphQLBoolean,
        description: 'Marks the filed as required when `true`.',
      },
    };
  },
});

export { createContentTypeField };
