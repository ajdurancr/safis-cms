import type { ResolverCreatorsMap } from '@safis/cms-schema';

import { createContentQueryResolversFnMap } from './content/query';

const resolverCreatorsMap: ResolverCreatorsMap = { ...createContentQueryResolversFnMap };

export { resolverCreatorsMap };
