import { z } from 'zod';
import { RepoPathsEnum } from './types';

const createPathRequiredMsg = (path: RepoPathsEnum) => `${path} path is required`;

const repoPaths = z.object({
  [RepoPathsEnum.CONTENT]: z
    .string({ required_error: createPathRequiredMsg(RepoPathsEnum.CONTENT) })
    .min(1),
  [RepoPathsEnum.CONTENT_TYPE]: z
    .string({ required_error: createPathRequiredMsg(RepoPathsEnum.CONTENT_TYPE) })
    .min(1),
}, { required_error: 'paths property is required' });

const secret = z.string({
  required_error: 'secret is required',
  invalid_type_error: 'secret must be a string',
}).min(1);

const repoInfo = z.object({
  name: z.string().min(1),
  owner: z.string({ required_error: 'owner property is required' }).min(1),
  description: z.string({ required_error: 'description property is required' }).min(1),
  defaultBranch: z.string({ required_error: 'defaultBranch property is required' }).min(1),
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

export const adapterSchema = {
  secret,

  repoPaths,

  repoInput,
  repoInfo,

  gitApiArgs,
};
