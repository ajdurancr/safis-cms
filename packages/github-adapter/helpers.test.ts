import { refType } from './constants';
import { ValidationError } from './error';
import { zodParse, buildFullPaths, createRefFullName } from './helpers';
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

describe('createRefFullName', () => {
  test('creates full reference name', () => {
    const validRefNames = [
      'test',
      'TEST',
      'feat/a.lockx',
      'test.123',
      'feat/123',
      'feat/feature-name/variant-a',
      'feat.name.a.1',
      'feat-branch_name',
      'head',
      'HEAD',
      '-test',
      'test-',
      'test@bar',
      '\ud83d\udca9',
      'ünicöde',
      '\x80',
    ];

    validRefNames.forEach((name) => {
      const fullRefName = createRefFullName(name);
      const fullRefTagName = createRefFullName(name, refType.TAG);

      expect(fullRefName).toEqual(`refs/${refType.BRANCH}/${name}`);
      expect(fullRefTagName).toEqual(`refs/${refType.TAG}/${name}`);
    });
  });

  test('throws on invalid reference names', () => {
    const invalidRefNames = [
      '',
      '.',
      '..',
      '/',
      '//',
      '/./',
      './.',
      '.test',
      'test/.123',
      'test.',
      'a.lock',
      'test/a.lock',
      'test/a.lock/b',
      'test.123.',
      'test/.123/branch',
      'test//123',
      '/test',
      'test/',
      'test..branch',
      'test@{branch',
      '\x7f',
    ];

    invalidRefNames.forEach((name) => {
      expectToThrowHandler(() => {
        createRefFullName(name);
      }, (error) => {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error).toMatchInlineSnapshot(`[GitAdpaterError: Validation error: ${name} is not a valid ref name]`);
      });

      expectToThrowHandler(() => {
        createRefFullName(name, refType.TAG);
      }, (error) => {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error).toMatchInlineSnapshot(`[GitAdpaterError: Validation error: ${name} is not a valid ref name]`);
      });
    });
  });

  test('throws on invalid ref type', () => {
    expectToThrowHandler(() => {
      createRefFullName('test', 'wrong-type' as any);
    }, (error) => {
      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toMatchInlineSnapshot('[GitAdpaterError: Validation error: Invalid enum value. Expected \'heads\' | \'tags\', received \'wrong-type\']');
    });
  });
});
