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

class RestClientError extends GitAdpaterError {
  _message: string

  code: number

  constructor(description: string, message: string, statusCode: number) {
    super(description);

    this._message = message;
    this.code = statusCode;
  }

  get message(): string {
    const description = this.description ? `${this.description}: ` : '';

    return `${description}${this._message}`;
  }
}

export {
  GitAdpaterError,
  ValidationError,
  RestClientError,
};
