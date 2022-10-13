import { GenericContent, ResolverCreatorFn } from '@safis/cms-schema';
import { CMSResolver, ContextWithGitMetadata } from '../../types';

const createContentQuery: ResolverCreatorFn<
  Promise<GenericContent | null>,
  CMSResolver<ContextWithGitMetadata>
> = (
  contentType,
) => async (
  _,
  { id }: { id: string },
  { git },
) => git.api.content.get({
  id,
  branch: git.branch,
  subFolder: contentType.id,
});

const createContentCollectionQuery: ResolverCreatorFn<
  Promise<GenericContent[]>,
  CMSResolver<ContextWithGitMetadata>
> = (
  contentType,
) => async (
  _,
  args,
  { git },
) => {
  const collection = await git.api.content.getAll({
    branch: git.branch,
    subFolder: contentType.id,
  });

  return collection;
};

const createContentQueryResolversFnMap = {
  content: createContentQuery,
  contentCollection: createContentCollectionQuery,
};

export { createContentQueryResolversFnMap };
