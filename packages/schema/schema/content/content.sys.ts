import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
} from 'graphql';

import type { ContentTypesMap } from '../../types';

type GraphQLSysSource = {
  __contentTypeId: string
}

const createContentSys = (
  contentTypesMap: ContentTypesMap,
  graphqlContentType: GraphQLObjectType,
): GraphQLObjectType => new GraphQLObjectType({
  name: 'ContentSys',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    contentType: {
      type: new GraphQLNonNull(graphqlContentType),
      // eslint-disable-next-line no-underscore-dangle
      resolve: ({ __contentTypeId }: GraphQLSysSource) => contentTypesMap[__contentTypeId],
    },
  },
});

export { createContentSys };
