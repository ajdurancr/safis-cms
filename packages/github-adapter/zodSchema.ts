import { z } from 'zod';
import { RepoPathsEnum } from './types';

const createPathRequiredMsg = (path: RepoPathsEnum) => `${path} path is required`;

const repoPath = z.object({
  [RepoPathsEnum.ROOT]: z
    .string({ required_error: createPathRequiredMsg(RepoPathsEnum.ROOT) })
    .min(1),
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

export const adapterSchema = {
  secret,
  repoPath,
};
