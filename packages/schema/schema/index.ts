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
  ContentTypeDefinition,
  GenericContent,
  SchemaUpdaterFn,
} from '../types';
import { createQuery } from './query';
import { createMutation } from './mutation';
// import { createGraphqlContentTypeNames } from '../helpers/graphql';
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

export type ResolverCreatorFn<
  TResult,
  TResolver = CMSGraphQLFieldResolver<any, any, any, TResult>
> = (
  contentType: ContentTypeDefinition,
) => TResolver

export type ResolverCreatorsMap = {
  content: ResolverCreatorFn<Promise<GenericContent | null>>
  contentCollection: ResolverCreatorFn<Promise<GenericContent[]>>
}

type CreateSchemaArgs = {
  contentTypesList: ContentTypeDefinition[]
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
  // const graphqlContentTypeNames = createGraphqlContentTypeNames(contentTypesList);
  const {
    query: queryResolvers,
    mutation: mutationResolvers,
  } = resolvers;

  const contentTypesMap = mapContentTypes(contentTypesList);

  const {
    // contentFieldTypeMap,
    types: graphqlTypesMap,
    getTypeGetterMap,
  } = createGraphqlTypes(contentTypesList, contentTypesMap);

  return new GraphQLSchema({
    query: createQuery(
      contentTypesList,
      getTypeGetterMap,
      queryResolvers,
      resolverCreatorsMap,
    ),
    mutation: createMutation(
      graphqlTypesMap,
      mutationResolvers,
      schemaUpdater,
    ),
  });
};

export { createSchema };
