import {
  GraphQLFieldConfigMap,
  GraphQLType,
  GraphQLEnumType,
} from 'graphql';

import type { ContentFieldTypeMap } from '../index';
import { ContentType, ContentTypeFieldTypeEnum, FieldDefinition } from '../../types';
import { GraphQLTypeGettersMap } from '../graphqlTypes';
import { getRefType } from './content.fields.refType';
import { createGraphqlFieldType as createFieldType } from '../../helpers/graphql';

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
  const graphqlRefType = graphqlContentFieldTypesMap[ContentTypeFieldTypeEnum.Ref].type;

  const graphqlType = graphqlFieldType === graphqlRefType
    ? getRefType({
      contentTypeId,
      fieldId,
      graphQLTypeGettersMap,
      refType,
    })
    : graphqlFieldType;

  return createFieldType({ graphqlType, isList, isRequired });
};

const createContentFieldsMap = (
  contentType: ContentType,
  graphqlContentFieldTypesMap: ContentFieldTypeMap,
  graphQLTypeGettersMap: GraphQLTypeGettersMap,
): GraphQLFieldConfigMap<any, any> => (
  contentType.fields.reduce((fieldsMap, field) => {
    const updatedField = { ...field };

    if (field.type === ContentTypeFieldTypeEnum.Ref) {
      const contentEnum = graphQLTypeGettersMap.ContentEnum() as GraphQLEnumType;
      const availableUserContentTypes: string[] = contentEnum.getValues().map(({ value }) => value);
      const fileteredRefTypes = field.refType?.filter(
        (rType) => availableUserContentTypes.includes(rType),
      );

      if (!fileteredRefTypes || !fileteredRefTypes.length) return fieldsMap;

      updatedField.refType = fileteredRefTypes;
    }

    return {
      ...fieldsMap,
      [updatedField.id]: {
        type: createGraphqlFieldType({
          contentTypeId: contentType.id,
          field: updatedField,
          graphqlContentFieldTypesMap,
          graphQLTypeGettersMap,
        }),
        description: updatedField.description,
      },
    };
  }, {})
);

export { createContentFieldsMap };
