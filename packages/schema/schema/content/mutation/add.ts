import {
  GraphQLFieldConfigMap,
  GraphQLInputFieldConfig,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLResolveInfo,
  GraphQLScalarType,
} from 'graphql';
import { v4 as uuidv4 } from 'uuid';

import { ObjMap } from 'graphql/jsutils/ObjMap';
import { getGraphqlTypeName } from '../../../helpers/graphql';
import { Content, ContentType, ContentTypeFieldTypeEnum, GenericContent } from '../../../types';
import type { ContentFieldTypeMap, ContentResolver, ResolverCreatorFn } from '../../index';
import { GraphQLTypeGettersMap } from '../../graphqlTypes';

const getInputTypeName = (contentTypeId: string): string => `Add${getGraphqlTypeName(contentTypeId)}Input`;

const createAccContentInput = (
  contentType: ContentType,
  contentFieldTypeMap: ContentFieldTypeMap,
) => {
  const inputFieldConfigMap = contentType.fields
    .filter(({ type }) => type !== ContentTypeFieldTypeEnum.Reference) // TODO: enable Ref types
    .reduce((inputsMap, field) => {
      const graphqlFieldTypeConfig = contentFieldTypeMap[field.type];
      const fieldTypeAsRequired = field.isRequired
        ? new GraphQLNonNull(graphqlFieldTypeConfig.type)
        : graphqlFieldTypeConfig.type;

      const fieldInputConfig: GraphQLInputFieldConfig = {
        type: fieldTypeAsRequired as GraphQLScalarType,
        description: field.description,
      };

      return { ...inputsMap, [field.id]: fieldInputConfig };
    }, {} as ObjMap<GraphQLInputFieldConfig>);

  return new GraphQLInputObjectType({
    name: getInputTypeName(contentType.id),
    fields: inputFieldConfigMap,
  });
};

const addContentSysMetadata = (
  contentType: ContentType,
  content: GenericContent,
): Content => ({
  ...content,
  sys: {
    id: uuidv4(),
    __contentTypeId: contentType.id,
  },
});

const createAddContentResolveFn = (
  contentType: ContentType,
  resolverCreatorFn: ResolverCreatorFn<ContentResolver>,
): ContentResolver => async (
  source: any,
  args: any,
  context: any,
  info: GraphQLResolveInfo,
) => {
  const { data: inputContentData } = args;

  const resolveFn = resolverCreatorFn(contentType);

  const updatedDataInput = addContentSysMetadata(contentType, inputContentData);

  const updatedArgs = {
    ...args,
    data: updatedDataInput,
  };

  return resolveFn(source, updatedArgs, context, info);
};

type CreateAddContentMutationsMapArgs = {
  contentTypesList: ContentType[],
  graphqlTypes: GraphQLTypeGettersMap,
  contentFieldTypeMap: ContentFieldTypeMap,
  resolverCreatorFn: ResolverCreatorFn<ContentResolver>,
}

const createAddContentMutationsMap = ({
  contentTypesList,
  graphqlTypes,
  contentFieldTypeMap,
  resolverCreatorFn,
}: CreateAddContentMutationsMapArgs): GraphQLFieldConfigMap<any, any> => contentTypesList
  .reduce((contentQueries, contentType) => {
    const graphqlTypeName = getGraphqlTypeName(contentType.id);
    const graphqlType = graphqlTypes[graphqlTypeName]() as GraphQLObjectType;
    const addContentInput = createAccContentInput(contentType, contentFieldTypeMap);
    const args = { data: { type: new GraphQLNonNull(addContentInput) } };
    const addContentResolver = createAddContentResolveFn(contentType, resolverCreatorFn);

    return {
      ...contentQueries,
      [`add${graphqlTypeName}`]: {
        type: graphqlType,
        args,
        resolve: addContentResolver,
      },
    };
  }, {});

export { createAddContentMutationsMap };
