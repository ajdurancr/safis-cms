/* eslint-disable no-use-before-define  */

import type { GraphQLFieldResolver } from 'graphql';

// ContentType types definitions

export enum ContentTypeFieldTypeEnum {
  String = 'String',
  Number = 'Number',
  Boolean = 'Boolean',
  Reference = 'Reference',
  ID = 'ID',
}

// Content types definitions

export interface ContentTypesTypeTransformationMap {
  [key: string]: string
}

export type GetFieldTypeArgs = {
  fieldType: string
  isList?: boolean
  isInput?: boolean
  isRequired?: boolean
}

export type FieldDefinition = {
  id: string
  name: string
  description?: string
  type: ContentTypeFieldTypeEnum
  refType?: string[]
  isRequired?: boolean
  isList?: boolean
}

export type ContentTypeDefinition = {
  id: string
  name: string
  fields: FieldDefinition[]
}

export type ContentTypesMap = {
  [contentTypeId: string]: ContentTypeDefinition
}

export type GraphQLTypeName = string

export type CreateContentTypeDefsArgs = {
  fields: FieldDefinition[],
  graphqlType: GraphQLTypeName,
  contentGraphQLTypes: GraphQLTypeName[],
}

export type ContentTypeDefs = {
  content: string[]
  queries: string[]
  mutations: string[]
}

export type CreateTypeDefsArgs = {
  contentTypes: string[],
  contentGraphQLTypes: GraphQLTypeName[]
  queries: string[]
  mutations: string[]
}

export type GenericContent = {
  [key: string]: any
}

export type CMSGraphQLFieldResolver<TContext=any, TSource=any, TArgs=any, TResult=any>
  = GraphQLFieldResolver<TSource, TContext, TArgs, TResult>

export type SchemaUpdaterFn = () => Promise<void>;
