import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLEnumType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLBoolean,
} from 'graphql';
import { ContentTypeFieldTypeEnum } from '../../types';

import { GetGraphQLTypeGettersMapFn } from '../graphqlTypes';

const REF_FIELD_DESC = `When \`type\` = \`${ContentTypeFieldTypeEnum.Reference}\`, it indicates the reference type. If empty, all all content types will be accepted.`;

const createContentTypeField = (
  getGraphQLTypeGettersMap: GetGraphQLTypeGettersMapFn,
): GraphQLObjectType => new GraphQLObjectType({
  name: 'ContentTypeField',
  fields: () => ({
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
      description: REF_FIELD_DESC,
      type: new GraphQLList(
        new GraphQLNonNull(
          getGraphQLTypeGettersMap().ContentEnum() as GraphQLEnumType,
        ),
      ),
    },
    isList: {
      type: GraphQLBoolean,
      description: 'Indicates if the field will contain a sigle element or multiple ones.',
    },
    isRequired: {
      type: GraphQLBoolean,
      description: 'Marks the filed as required when `true`.',
    },
  }),
});

export { createContentTypeField };
