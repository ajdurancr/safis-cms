import camelCase from 'lodash.camelcase';

import { CMSResolver, ContextWithGitMetadata } from '../../types';

type GenericContentTypeInput = {
  input: {
    id: string
    [key: string]: any
  }
}

const addContentType: CMSResolver<ContextWithGitMetadata> = (
  _,
  { input }: GenericContentTypeInput,
  context,
) => {
  const { branch } = context.git;
  const id = input.id || camelCase(input.name);

  return context.git.api.contentType.create({
    id,
    branch,
    content: input,
  });
};

const deleteContentType: CMSResolver<ContextWithGitMetadata> = (
  _,
  { id }: { id: string },
  context,
) => {
  const { branch } = context.git;

  return context.git.api.contentType.delete(({ branch, id }));
};

const updateContentType: CMSResolver<ContextWithGitMetadata> = (
  _,
  { input }: GenericContentTypeInput,
  context,
) => {
  const { branch } = context.git;

  return context.git.api.contentType.update({
    id: input.id,
    branch,
    content: input,
  });
};

const mutation = {
  addContentType,
  deleteContentType,
  updateContentType,
};

export { mutation };
