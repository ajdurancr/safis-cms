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

export type ClientErrorData = { message: string, statusCode: number}

class GitHubClientError extends GitAdpaterError {
  error: ClientErrorData

  constructor(description: string, error: ClientErrorData) {
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
