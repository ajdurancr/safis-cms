import type { ResolverCreatorsMap } from '@safis/cms-schema';

import { contentQueryResolverCreatorsMap } from './content/query';
import { contentMutationResolverCreatorsMap } from './content/mutations';

const resolverCreatorsMap: ResolverCreatorsMap = {
  ...contentQueryResolverCreatorsMap,
  ...contentMutationResolverCreatorsMap,
};

export { resolverCreatorsMap };
