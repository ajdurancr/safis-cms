import { ParseParams, z } from 'zod';
import { fromZodError } from 'zod-validation-error';

import { RepoPathsEnum, RepoPaths, RefType } from './types';
import { ValidationError } from './error';
import { adapterSchema } from './zodSchema';
import { refType as refTypeMap } from './constants';

const zodParse = <T extends z.ZodTypeAny>(
  schema: T,
  parseInput: unknown,
  parseParams?: Partial<ParseParams>,
): z.output<T> => {
  const parsedConfigResult = schema.safeParse(parseInput, parseParams);

  if (!parsedConfigResult.success) {
    // formats error to a user-friendly readable message
    const formattedError = fromZodError(parsedConfigResult.error);
    throw new ValidationError(formattedError);
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

const createRefFullName = (refName: string, refType: RefType = refTypeMap.BRANCH): string => {
  zodParse(adapterSchema.refType, refType);
  zodParse(adapterSchema.refName, refName);

  return `refs/${refType}/${refName}`;
};

export {
  createRefFullName,
  buildFullPaths,
  zodParse,
};
