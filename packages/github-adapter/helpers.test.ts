import { ValidationError } from './error';
import { zodParse, buildFullPaths } from './helpers';
import { expectToThrowHandler } from './testing.helpers';
import { RepoPaths, RepoPathsEnum } from './types';
import { adapterSchema } from './zodSchema';

const PATHS_INPUT: RepoPaths = {
  content: 'test-content-path',
  contentType: 'test-content-type-path',
};

const FULL_PATHS: RepoPaths = {
  content: `${PATHS_INPUT.content}/`,
  contentType: `${PATHS_INPUT.contentType}/`,
};

describe('zodParse', () => {
  test('parses data correctly', () => {
    const parsedData = zodParse(adapterSchema.repoPaths, PATHS_INPUT);

    expect(parsedData).toEqual(PATHS_INPUT);
  });

  test('fails parsing', () => {
    expectToThrowHandler(() => {
      zodParse(adapterSchema.repoPaths, {
        content: PATHS_INPUT.content,
        contentTypeInvalidKey: PATHS_INPUT.contentType,
      });
    }, (error) => {
      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toMatchInlineSnapshot('[GitAdpaterError: Validation error: Required at "contentType"]');
    });
  });
});

describe('buildFullPaths', () => {
  test('builds paths correctly', () => {
    const fullPaths = buildFullPaths(PATHS_INPUT);

    expect(FULL_PATHS).toEqual(fullPaths);
  });

  test(`throws when ${RepoPathsEnum.CONTENT} and ${RepoPathsEnum.CONTENT_TYPE} are equal`, () => {
    expectToThrowHandler(() => {
      buildFullPaths({
        content: PATHS_INPUT.content,
        contentType: PATHS_INPUT.content,
      });
    }, (error) => {
      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toMatchInlineSnapshot('[GitAdpaterError: Validation error: contentType and content paths must be different]');
    });
  });

  test('throws when path starts with slash', () => {
    expectToThrowHandler(() => {
      buildFullPaths({
        content: `/${PATHS_INPUT.content}`,
        contentType: PATHS_INPUT.content,
      });
    }, (error) => {
      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toMatchInlineSnapshot('[GitAdpaterError: Validation error: path cannot start with a slash at "content"]');
    });
  });
});
