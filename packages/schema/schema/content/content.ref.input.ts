import {
  GraphQLNonNull,
  GraphQLInputObjectType,
  GraphQLID,
  GraphQLString,
} from 'graphql';

const createRefInput = (): GraphQLInputObjectType => new GraphQLInputObjectType({
  name: 'RefInput',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'System ID (`Content.sys.id`)',
    },
    type: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'One of the types allowed in `field.refType` config.',
    },
  }),
});

export { createRefInput };
