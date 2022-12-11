/* eslint-disable max-classes-per-file */

import { z } from 'zod';

class GitAdpaterError extends Error {
  description: string

  errors: any[]

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
  constructor(errors: z.ZodIssue[]) {
    super('Invalid params', errors);
  }
}

export {
  GitAdpaterError,
  ValidationError,
};
