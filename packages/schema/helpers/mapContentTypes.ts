import type { ContentTypeDefinition, ContentTypesMap } from '../types';

const mapContentTypes = (
  contentTypesList: ContentTypeDefinition[],
): ContentTypesMap => contentTypesList
  .reduce((ctMap, contentType) => ({
    ...ctMap,
    [contentType.id]: contentType,
  }), {});

export { mapContentTypes };
