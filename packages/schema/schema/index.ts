import {
  GraphQLSchema,
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLID,
  GraphQLInterfaceType,
} from 'graphql';

import type {
  CMSGraphQLFieldResolver,
  Content,
  ContentType,
  SchemaUpdaterFn,
} from '../types';
import { createQuery } from './query';
import { createMutation } from './mutation';
import { createGraphqlTypes } from './graphqlTypes';
import { mapContentTypes } from '../helpers/mapContentTypes';
import { ContentTypeFieldTypeEnum } from '../types';

export type ContentFieldTypeMap = {
  [ContentTypeFieldTypeEnum.Reference]: {
    type: GraphQLInterfaceType,
    description?: string,
  },
  [ContentTypeFieldTypeEnum.String]: {
    type: typeof GraphQLString
    description?: string
  },
  // Int: GraphQLInt,
  [ContentTypeFieldTypeEnum.Number]: {
    type: typeof GraphQLInt
    description?: string
  },
  // Float: GraphQLFloat,
  [ContentTypeFieldTypeEnum.Boolean]: {
    type: typeof GraphQLBoolean
    description?: string
  },
  [ContentTypeFieldTypeEnum.ID]: {
    type: typeof GraphQLID
    description?: string
  }
}

export type ResolversMap<TContext> = {
  [key: string]: CMSGraphQLFieldResolver<TContext>
}

export type RootResolversMap<TContext> = {
  [key: string]: ResolversMap<TContext>
  query: ResolversMap<TContext>
  mutation: ResolversMap<TContext>
}

export type ContentResolver = CMSGraphQLFieldResolver<any, any, any, Promise<Content | null>>
export type ContentCollectionResolver = CMSGraphQLFieldResolver<
  any,
  any,
  any,
  Promise<Content[]>
>

export type ResolverCreatorFn<TResolver> = (contentType: ContentType) => TResolver

export type ResolverCreatorsMap = {
  content: ResolverCreatorFn<ContentResolver>
  contentCollection: ResolverCreatorFn<ContentCollectionResolver>

  addContent: ResolverCreatorFn<ContentResolver>
  deleteContent: ResolverCreatorFn<CMSGraphQLFieldResolver<any, any, any, Promise<boolean>>>
  updateContent: ResolverCreatorFn<ContentResolver>
}

type CreateSchemaArgs = {
  contentTypesList: ContentType[]
  resolvers: RootResolversMap<any>
  resolverCreatorsMap: ResolverCreatorsMap
  schemaUpdater: SchemaUpdaterFn
}

const createSchema = ({
  contentTypesList,
  resolvers,
  resolverCreatorsMap,
  schemaUpdater,
}: CreateSchemaArgs): GraphQLSchema => {
  const {
    query: queryResolvers,
    mutation: mutationResolvers,
  } = resolvers;

  const contentTypesMap = mapContentTypes(contentTypesList);

  const {
    types: graphqlTypesMap,
    contentFieldTypeMap,
  } = createGraphqlTypes(contentTypesList, contentTypesMap);

  return new GraphQLSchema({
    query: createQuery(
      contentTypesList,
      graphqlTypesMap,
      queryResolvers,
      resolverCreatorsMap,
    ),
    mutation: createMutation({
      contentTypesList,
      graphqlTypes: graphqlTypesMap,
      contentFieldTypeMap,
      resolvers: mutationResolvers,
      schemaUpdater,
      resolverCreatorsMap,
    }),
  });
};

export { createSchema };
