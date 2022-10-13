import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLInterfaceType,
} from 'graphql';

import type { ContentTypeDefinition } from '../../types';
import { getGraphqlTypeName } from '../../helpers/graphql';
import { createContentFieldsMap } from './content.fields.map';
import { GetGraphQLTypeGettersMapFn } from '../graphqlTypes';
import { ContentFieldTypeMap } from '../index';

const createUserDefinedContentType = (
  contentType: ContentTypeDefinition,
  graphqlContentFieldTypesMap: ContentFieldTypeMap,
  getGraphqlTypeGetters: GetGraphQLTypeGettersMapFn,
): GraphQLObjectType => {
  const graphqlTypeName = getGraphqlTypeName(contentType.id);

  return new GraphQLObjectType({
    name: graphqlTypeName,
    interfaces: () => [getGraphqlTypeGetters().ContentInterface() as GraphQLInterfaceType],
    fields: () => ({
      ...createContentFieldsMap(
        contentType,
        graphqlContentFieldTypesMap,
        getGraphqlTypeGetters(),
      ),

      // CMS fields
      sys: { type: new GraphQLNonNull(getGraphqlTypeGetters().ContentSys() as GraphQLObjectType) },
    }),
  });
};

export type GraphQLUserDefinedContentTypesMap = {
  [key: string]: GraphQLObjectType
}

const createUserDefinedContentTypesMap = (
  contentTypesList: ContentTypeDefinition[],
  graphqlContentFieldTypesMap: ContentFieldTypeMap,
  getGraphqlTypeGetters: GetGraphQLTypeGettersMapFn,
): GraphQLUserDefinedContentTypesMap => contentTypesList
  .reduce((userDefinedContentType, contentType) => ({
    ...userDefinedContentType,
    [getGraphqlTypeName(contentType.id)]: createUserDefinedContentType(
      contentType,
      graphqlContentFieldTypesMap,
      getGraphqlTypeGetters,
    ),
  }), {});

export { createUserDefinedContentTypesMap };
