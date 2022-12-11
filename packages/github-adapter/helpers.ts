import { ParseParams, z } from 'zod';

import { RepoPaths, RepoPathsEnum } from './types';
import { ValidationError } from './error';

const buildFullPaths = (paths: RepoPaths): RepoPaths => {
  const {
    root: rootFolder,
    contentType: contentTypeFolder,
    content: contentFolder,
  } = paths || {};

  if (!contentTypeFolder) {
    throw new Error(`${RepoPathsEnum.CONTENT_TYPE} path is required.`);
  }

  if (!contentFolder) {
    throw new Error(`${RepoPathsEnum.CONTENT} path is required.`);
  }

  if (contentFolder === contentTypeFolder) {
    throw new Error(
      `${RepoPathsEnum.CONTENT_TYPE} and ${RepoPathsEnum.CONTENT} paths must be different.`,
    );
  }

  const rootPath = !rootFolder || rootFolder.endsWith('/')
    ? rootFolder
    : `${rootFolder}/`;

  const contentTypePath = contentTypeFolder.endsWith('/')
    ? contentTypeFolder
    : `${contentTypeFolder}/`;

  const contentPath = contentFolder.endsWith('/')
    ? contentFolder
    : `${contentFolder}/`;

  return {
    root: rootPath,
    contentType: rootFolder
      ? `${rootFolder}${contentTypePath}`
      : contentTypePath,
    content: rootFolder
      ? `${rootFolder}${contentPath}`
      : contentPath,
  };
};

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

export {
  buildFullPaths,
  zodParse,
};
