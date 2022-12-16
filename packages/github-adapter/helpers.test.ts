import { ValidationError } from './error';
import { zodParse, buildFullPaths } from './helpers';
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
    try {
      zodParse(adapterSchema.repoPaths, {
        content: PATHS_INPUT.content,
        contentTypeInvalidKey: PATHS_INPUT.contentType,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).errors).toEqual([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: [
            'contentType',
          ],
          message: 'contentType path is required',
        },
      ]);
    }
  });
});

describe('buildFullPaths', () => {
  test('builds paths correctly', () => {
    const fullPaths = buildFullPaths(PATHS_INPUT);

    expect(FULL_PATHS).toEqual(fullPaths);
  });

  test(`throws when ${RepoPathsEnum.CONTENT} and ${RepoPathsEnum.CONTENT_TYPE} are equal`, () => {
    try {
      buildFullPaths({
        content: PATHS_INPUT.content,
        contentType: PATHS_INPUT.content,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).errors).toEqual([{
        code: 'custom',
        path: [],
        message: 'contentType and content paths must be different',
      }]);
    }
  });
});
