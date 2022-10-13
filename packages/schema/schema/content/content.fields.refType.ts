import {
  GraphQLType,
  GraphQLUnionType,
  GraphQLObjectType,
  ThunkReadonlyArray,
} from 'graphql';
import { getGraphqlTypeName } from '../../helpers/graphql';
import { GraphQLTypeGettersMap } from '../graphqlTypes';

import { CONTENT_INTERFACE_TYPE_NAME } from '../../constants/content';

const createRefUnionType = ({
  contentTypeId,
  fieldId,
  graphQLTypeGettersMap,
  refType,
}: {
  contentTypeId: string
  fieldId: string
  graphQLTypeGettersMap: GraphQLTypeGettersMap
  refType: string[]
}): GraphQLUnionType => {
  const types: ThunkReadonlyArray<GraphQLObjectType<any, any>> = refType
    .map((graphqlType) => graphQLTypeGettersMap[graphqlType]() as GraphQLObjectType);

  return new GraphQLUnionType({
    name: `${getGraphqlTypeName(contentTypeId)}${getGraphqlTypeName(fieldId)}Items`,
    types,
  });
};

const filterRefTypes = (refType: string[] = [], graphQLTypeGettersMap: GraphQLTypeGettersMap) => {
  const fileteredRefTypes = refType.filter((type) => (
    type !== CONTENT_INTERFACE_TYPE_NAME
    && graphQLTypeGettersMap[type]
  ));
  const refTypesMap: { [key: string]: string } = fileteredRefTypes
    .reduce((typesMap, type) => ({
      ...typesMap,
      [type]: type,
    }), {});

  const nonDuplicateRefTypes = Object.values(refTypesMap);

  return nonDuplicateRefTypes;
};

const getRefType = ({
  contentTypeId,
  fieldId,
  graphQLTypeGettersMap,
  refType = [],
}: {
  contentTypeId: string
  fieldId: string
  graphQLTypeGettersMap: GraphQLTypeGettersMap
  refType?: string[] | undefined
}): GraphQLType => {
  const fileteredRefTypes = filterRefTypes(refType, graphQLTypeGettersMap);

  if (!fileteredRefTypes?.length) return graphQLTypeGettersMap.ContentInterface();

  if (fileteredRefTypes.length === 1) return graphQLTypeGettersMap[fileteredRefTypes[0]]();

  return createRefUnionType({
    contentTypeId,
    fieldId,
    graphQLTypeGettersMap,
    refType: fileteredRefTypes,
  });
};

export { getRefType };
