import {
  GraphQLNonNull,
  GraphQLList,
  GraphQLFieldConfigMap,
  GraphQLType,
} from 'graphql';

import type { ContentFieldTypeMap } from '../index';
import { ContentType, ContentTypeFieldTypeEnum, FieldDefinition } from '../../types';
import { GraphQLTypeGettersMap } from '../graphqlTypes';
import { getRefType } from './content.fields.refType';

const createGraphqlFieldType = ({
  contentTypeId,
  field,
  graphqlContentFieldTypesMap,
  graphQLTypeGettersMap,
}: {
  contentTypeId: string
  field: FieldDefinition
  graphqlContentFieldTypesMap: ContentFieldTypeMap
  graphQLTypeGettersMap: GraphQLTypeGettersMap
}): GraphQLType => {
  const { type, refType, isRequired, isList, id: fieldId } = field;
  const { [type]: graphqlFieldTypeObj } = graphqlContentFieldTypesMap;
  const { type: graphqlFieldType } = graphqlFieldTypeObj || {};
  const graphqlRefType = graphqlContentFieldTypesMap[ContentTypeFieldTypeEnum.Reference].type;

  const graphqlType = graphqlFieldType === graphqlRefType
    ? getRefType({
      contentTypeId,
      fieldId,
      graphQLTypeGettersMap,
      refType,
    })
    : graphqlFieldType;

  if (!isRequired && !isList) return graphqlType;

  const graphqlTypeAsRequired = isRequired
    ? new GraphQLNonNull(graphqlType) // graphqlType!
    : graphqlType;

  const graphqlTypeAsList = isList
    ? new GraphQLList(graphqlTypeAsRequired) // graphqlType[]
    : graphqlTypeAsRequired;

  return graphqlTypeAsList;
  // TODO: maybe do this
  // return isRequired
  //  ? new GraphQLNonNull(graphqlType) // graphqlType[]!
  //  : graphqlType
};

const createContentFieldsMap = (
  contentType: ContentType,
  graphqlContentFieldTypesMap: ContentFieldTypeMap,
  graphQLTypeGettersMap: GraphQLTypeGettersMap,
): GraphQLFieldConfigMap<any, any> => (
  contentType.fields.reduce((fieldsMap, field) => {
    const config = ({
      ...fieldsMap,
      [field.id]: {
        type: createGraphqlFieldType({
          contentTypeId: contentType.id,
          field,
          graphqlContentFieldTypesMap,
          graphQLTypeGettersMap,
        }),
        description: field.description,
      },
    });

    return config;
  }, {})
);

export { createContentFieldsMap };
