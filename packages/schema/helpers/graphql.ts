import {
  GraphQLNonNull,
  GraphQLList,
  GraphQLType,
} from 'graphql';

import pascalCase from './pascalCase';

const getGraphqlTypeName = pascalCase;

const createGraphqlFieldType = ({
  graphqlType,
  isRequired,
  isList,
}: {
  graphqlType: GraphQLType,
  isRequired?: boolean,
  isList?: boolean
}): GraphQLType => {
  if (!isRequired && !isList) return graphqlType;

  const graphqlTypeAsRequired = isRequired
    ? new GraphQLNonNull(graphqlType) // graphqlType!
    : graphqlType;

  const graphqlTypeAsList = isList
    ? new GraphQLList(graphqlTypeAsRequired) // graphqlType[]
    : graphqlTypeAsRequired;

  return graphqlTypeAsList;
  // TODO: maybe do this
  // return isRequired
  //  ? new GraphQLNonNull(graphqlType) // graphqlType[]!
  //  : graphqlType
};

export {
  getGraphqlTypeName,
  createGraphqlFieldType,
};
