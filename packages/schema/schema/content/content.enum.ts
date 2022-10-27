import { GraphQLEnumType } from 'graphql';

import type { ContentType } from '../../types';
import { getGraphqlTypeName } from '../../helpers/graphql';
import { CONTENT_INTERFACE_TYPE_NAME } from '../../constants/content';

const createContentEnum = (
  contentTypesList: ContentType[],
): GraphQLEnumType => new GraphQLEnumType({
  name: 'ContentEnum',
  values: contentTypesList.reduce((valueMap, contentType) => {
    const graphqlTypeName = getGraphqlTypeName(contentType.id);
    return {
      ...valueMap,
      [graphqlTypeName]: { name: graphqlTypeName },
    };
  }, { [CONTENT_INTERFACE_TYPE_NAME]: { value: CONTENT_INTERFACE_TYPE_NAME } }),
});

export { createContentEnum };
