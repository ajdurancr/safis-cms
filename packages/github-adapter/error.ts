/* eslint-disable max-classes-per-file */

import { z } from 'zod';
import { ValidationError as FromZodValidationError } from 'zod-validation-error';

class GitAdpaterError extends Error {
  description: string

  errors?: any

  constructor(description: string, errors?: any) {
    super();
    this.name = 'GitAdpaterError';
    this.errors = errors;
    this.description = description;
  }

  get message(): string {
    const description = this.description ? `${this.description} ` : '';
    const stringifiedErrors = this.errors ? JSON.stringify(this.errors, null, 2) : '';

    return `${description}${stringifiedErrors}`;
  }

  toString() {
    return this.message;
  }
}

class ValidationError extends GitAdpaterError {
  constructor(error: FromZodValidationError) {
    super(error.message, error.details);
  }

  get message(): string {
    return this.description;
  }
}

type GHClientErrorObj = { message: string, statusCode: number}

class GitHubClientError extends GitAdpaterError {
  error: GHClientErrorObj

  constructor(description: string, error: GHClientErrorObj) {
    super(description);

    this.error = error;
  }

  get message(): string {
    const description = this.description ? `${this.description}: ` : '';

    return `${description}${this.error.message}`;
  }
}

export {
  GitAdpaterError,
  ValidationError,
  GitHubClientError,
};
