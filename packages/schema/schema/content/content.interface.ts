import {
  GraphQLNonNull,
  GraphQLInterfaceType,
  GraphQLObjectType,
  ThunkObjMap,
  GraphQLFieldConfig,
} from 'graphql';

import { CONTENT_INTERFACE_TYPE_NAME } from '../../constants/content';
import { GetGraphQLTypeGettersMapFn } from '../graphqlTypes';

const createContentInterface = (
  getGrpahqlTypes: GetGraphQLTypeGettersMapFn,
): GraphQLInterfaceType => {
  // due to circular type dependency `thunk` will get ContentSys type
  const thunkConfig: ThunkObjMap<GraphQLFieldConfig<any, any>> = () => {
    const ContentSys = getGrpahqlTypes().ContentSys() as GraphQLObjectType;

    return ({ sys: { type: new GraphQLNonNull(ContentSys) } });
  };

  return new GraphQLInterfaceType({
    name: CONTENT_INTERFACE_TYPE_NAME,
    fields: thunkConfig,
  });
};

export { createContentInterface };
