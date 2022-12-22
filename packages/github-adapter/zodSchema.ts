import { z } from 'zod';
import {
  gitItemType as gitItemTypeMap,
  gitFileMode as gitFileModeMap,
} from './constants';
import { RepoPathsEnum } from './types';

/* github-specific */
const blobContent = z.string().min(1);
const sha = z.string().min(1);
const gitItemType = z.nativeEnum(gitItemTypeMap);
const gitFileMode = z.nativeEnum(gitFileModeMap);
const path = z.string().min(1).refine(
  (str) => !str.startsWith('/'),
  { message: 'path cannot start with a slash' },
);

const tree = z.object({
  mode: gitFileMode,
  type: gitItemType,
  path,
  sha,
});

/* end of github-specific */

const repoName = z.string().min(1);
const repoOwner = z.string().min(1);

const repoPaths = z.object({
  [RepoPathsEnum.CONTENT]: path,
  [RepoPathsEnum.CONTENT_TYPE]: path,
});

const secret = z.string().min(1);

const repoInfo = z.object({
  name: z.string().min(1),
  owner: z.string().min(1),
  description: z.string().min(1),
  defaultBranch: z.string().min(1),
  isPrivate: z.boolean(),
  paths: repoPaths,
});

const repoInput = repoInfo.pick({
  name: true,
  owner: true,
}).extend({
  paths: repoPaths,
  createAsPrivate: z.boolean().optional(),
});

const gitApiArgs = z.object({ secret });

const createBlobArgs = z.object({
  owner: repoOwner,
  repo: repoName,
  content: blobContent,
});
const createTreeArgs = z.object({
  owner: repoOwner,
  repo: repoName,
  treeItems: z.array(tree).min(1),
  baseTree: sha,
});

export const adapterSchema = {
  repoName,
  repoOwner,

  secret,

  repoPaths,

  repoInput,
  repoInfo,

  // function arguments
  gitApiArgs,
  createBlobArgs,
  createTreeArgs,

  // github specifics
  blobContent,
  gitItemType,
  gitFileMode,
  sha,
  path,
  tree,
};
