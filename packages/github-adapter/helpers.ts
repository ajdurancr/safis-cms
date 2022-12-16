import { ParseParams, z } from 'zod';

import { RepoPathsEnum, RepoPaths } from './types';
import { ValidationError } from './error';
import { adapterSchema } from './zodSchema';

const zodParse = <T extends z.ZodTypeAny>(
  schema: T,
  parseInput: unknown,
  parseParams?: Partial<ParseParams>,
): z.output<T> => {
  const parsedConfigResult = schema.safeParse(parseInput, parseParams);

  if (!parsedConfigResult.success) {
    throw new ValidationError(parsedConfigResult.error.errors);
  }

  return parsedConfigResult.data;
};

const buildFullPaths = (repoPaths: RepoPaths): RepoPaths => {
  const paths = zodParse(adapterSchema.repoPaths, repoPaths);

  const {
    contentType: contentTypeFolder,
    content: contentFolder,
  } = paths;
  const contentTypePath = contentTypeFolder.endsWith('/')
    ? contentTypeFolder
    : `${contentTypeFolder}/`;

  const contentPath = contentFolder.endsWith('/')
    ? contentFolder
    : `${contentFolder}/`;

  const fullPaths = zodParse(
    adapterSchema.repoPaths.refine(
      ({ content, contentType }) => content !== contentType,
      { message: `${RepoPathsEnum.CONTENT_TYPE} and ${RepoPathsEnum.CONTENT} paths must be different` },
    ), {
      content: contentPath,
      contentType: contentTypePath,
    },
  );

  return fullPaths;
};

export {
  buildFullPaths,
  zodParse,
};
