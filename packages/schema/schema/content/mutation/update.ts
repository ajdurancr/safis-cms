import {
  GraphQLFieldConfigMap,
  GraphQLID,
  GraphQLInputFieldConfig,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLScalarType,
} from 'graphql';

import { ObjMap } from 'graphql/jsutils/ObjMap';
import { createGraphqlFieldType, getGraphqlTypeName } from '../../../helpers/graphql';
import { ContentType, ContentTypeFieldTypeEnum } from '../../../types';
import type { ContentFieldTypeMap, ContentResolver, ResolverCreatorFn } from '../../index';
import { GraphQLTypeGettersMap } from '../../graphqlTypes';

const getInputTypeName = (contentTypeId: string): string => `Update${getGraphqlTypeName(contentTypeId)}Input`;

const createUpdateContentInput = (
  contentType: ContentType,
  contentFieldTypeMap: ContentFieldTypeMap,
  graphqlRefInputType: GraphQLInputObjectType,
) => {
  const inputFieldConfigMap = contentType.fields
    .reduce((inputsMap, field) => {
      const graphqlFieldTypeConfig = contentFieldTypeMap[field.type];
      const graphqlRefType = contentFieldTypeMap[ContentTypeFieldTypeEnum.Ref].type;
      const isRefType = graphqlFieldTypeConfig.type === graphqlRefType;
      const graphqlType = isRefType ? graphqlRefInputType : graphqlFieldTypeConfig.type;

      const fieldInputConfig: GraphQLInputFieldConfig = {
        type: createGraphqlFieldType({
          graphqlType,
          isList: field.isList,
          isRequired: isRefType,
        }) as GraphQLScalarType | GraphQLInputObjectType,
        description: field.description,
      };

      return { ...inputsMap, [field.id]: fieldInputConfig };
    }, {} as ObjMap<GraphQLInputFieldConfig>);

  return new GraphQLInputObjectType({
    name: getInputTypeName(contentType.id),
    fields: inputFieldConfigMap,
  });
};

type CreateUpdateContentMutationsMapArgs = {
  contentTypesList: ContentType[],
  graphqlTypes: GraphQLTypeGettersMap,
  contentFieldTypeMap: ContentFieldTypeMap,
  resolverCreatorFn: ResolverCreatorFn<ContentResolver>,
}

const createUpdateContentMutationsMap = ({
  contentTypesList,
  graphqlTypes,
  contentFieldTypeMap,
  resolverCreatorFn,
}: CreateUpdateContentMutationsMapArgs): GraphQLFieldConfigMap<any, any> => contentTypesList
  .reduce((contentQueries, contentType) => {
    const graphqlTypeName = getGraphqlTypeName(contentType.id);
    const graphqlType = graphqlTypes[graphqlTypeName]() as GraphQLObjectType;
    const updateContentInput = createUpdateContentInput(
      contentType,
      contentFieldTypeMap,
      graphqlTypes.RefInput() as GraphQLInputObjectType,
    );
    const updateContentResolver = resolverCreatorFn(contentType);
    const args = {
      id: {
        type: new GraphQLNonNull(GraphQLID),
        description: 'System ID (`Content.sys.id`)',
      },
      data: {
        type: new GraphQLNonNull(updateContentInput),
        description: 'Content fields to update.',
      },
    };

    return {
      ...contentQueries,
      [`update${graphqlTypeName}`]: {
        type: graphqlType,
        args,
        resolve: updateContentResolver,
      },
    };
  }, {});

export { createUpdateContentMutationsMap };
