import type { ContentTypeDefinition } from '../types';
import pascalCase from './pascalCase';

const getGraphqlTypeName = pascalCase;

const createGraphqlContentTypeNames = (
  contentTypesList: ContentTypeDefinition[],
): string[] => contentTypesList
  .map(({ id }) => getGraphqlTypeName(id));

export { getGraphqlTypeName, createGraphqlContentTypeNames };
