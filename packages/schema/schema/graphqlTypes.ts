import type { GraphQLEnumType, GraphQLInputObjectType, GraphQLInterfaceType, GraphQLType } from 'graphql';
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
} from 'graphql';

import type { ContentTypeDefinition, ContentTypesMap } from '../types';
import { createContentFieldTypeMap } from './contentType/contentType.fieldTypeMap';
import { createContentFieldTypeEnum } from './contentType/contentType.fieldTypeEnum';
import { createContentTypeField } from './contentType/contentType.field';
import { createContentTypeFieldInput } from './contentType/contentType.fieldInput';
import { createContentType } from './contentType/contentType';
import { createContentInterface } from './content/content.interface';
import { createContentSys } from './content/content.sys';
import { createContentEnum } from './content/content.enum';
import type { ContentFieldTypeMap } from './index';
import { createUserDefinedContentTypesMap } from './content/content';

type MaybeGraphQLType = GraphQLObjectType | undefined

export type GraphQLTypeGetter<
  GraphQLReturnType =
    GraphQLObjectType
    | GraphQLEnumType
    | GraphQLInputObjectType
    | GraphQLInterfaceType
> = () =>
GraphQLReturnType;
export type GraphQLTypeGettersMap = { [typeName: string]: GraphQLTypeGetter }

export type GetGraphQLTypeGettersMapFn = () => GraphQLTypeGettersMap

export type SchemaGraphQLTypesMap = {
  ContentEnum: GraphQLEnumType
  ContentFieldTypeEnum: GraphQLEnumType
  ContentType: GraphQLObjectType
  ContentTypeFieldInput: GraphQLInputObjectType
  ContentSys: GraphQLObjectType
  ContentInterface: GraphQLInterfaceType

  // getContent: GraphQLTypeGetterFuntion
}

const createGraphqlTypes = (
  contentTypesList: ContentTypeDefinition[],
  contentTypesMap: ContentTypesMap,
): {
  contentFieldTypeMap: ContentFieldTypeMap
  types: GraphQLTypeGettersMap
  getTypeGetterMap: GetGraphQLTypeGettersMapFn
} => {
  const ContentEnum = createContentEnum(contentTypesList);
  const ContentInterface = createContentInterface(
    getTypeGetterMap, // eslint-disable-line no-use-before-define
  );

  const contentFieldTypeMap = createContentFieldTypeMap(ContentInterface);

  const ContentFieldTypeEnum = createContentFieldTypeEnum(contentFieldTypeMap);
  const ContentTypeField = createContentTypeField(
    getTypeGetterMap, // eslint-disable-line no-use-before-define
  );
  const ContentType = createContentType(ContentTypeField);
  const ContentTypeFieldInput = createContentTypeFieldInput(
    getTypeGetterMap, // eslint-disable-line no-use-before-define
  );
  const ContentSys = createContentSys(contentTypesMap, ContentType);

  const userDefinedContentTypesMap = createUserDefinedContentTypesMap(
    contentTypesList,
    contentFieldTypeMap,
    // eslint-disable-next-line no-use-before-define
    getTypeGetterMap,
  );
  // const UserDefinedContentTypes = {} as { [key: string]: GraphQLObjectType };

  // const graphqlTypes: { [type: string]: GraphQLType } = {
  //   // Content
  //   ContentEnum,
  //   ContentSys,
  //   ContentInterface,

  //   // ContentType
  //   ContentFieldTypeEnum,
  //   ContentType,
  //   ContentTypeFieldInput,

  //   // // type getters
  //   // // eslint-disable-next-line no-use-before-define
  //   // getContent,

  //   // User defined content types
  //   ...userDefinedContentTypesMap,
  // };

  // used to get ContentType inside a `Thunk` funtion
  // see 'schema/content/content.interface.ts' for more info
  function getContentSysType() {
    return ContentSys;
  }

  function getContent(graphqlName: string): MaybeGraphQLType {
    return userDefinedContentTypesMap[graphqlName];
  }

  // function getTypeGetterMapV1() {
  //   return typeGetters;
  // }

  function getTypeGetterMap() {
    const graphqlTypes: { [type: string]: GraphQLType } = {
      // Content
      ContentEnum,
      ContentSys,
      ContentInterface,
      Content: ContentInterface, // Same

      // ContentType
      ContentFieldTypeEnum,
      ContentType,
      ContentTypeFieldInput,

      // // type getters
      // // eslint-disable-next-line no-use-before-define
      // getContent,

      // User defined content types
      ...userDefinedContentTypesMap,
    };
    return Object
      .keys(graphqlTypes)
      .reduce((gettersMap, typeName) => {
        const graphqlType = graphqlTypes[typeName];
        const getterFn: GraphQLTypeGetter<typeof graphqlType> = () => graphqlType;

        return {
          ...gettersMap,
          [typeName]: getterFn,
        };
      }, {});
  }

  // function getGraphqlTypesMap() {
  //   return graphqlTypes;
  // }

  return {
    contentFieldTypeMap,
    types: getTypeGetterMap(),
    getTypeGetterMap,
  };
};

export { createGraphqlTypes };
