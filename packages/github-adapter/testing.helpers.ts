// handles non-async throwable calls
const expectToThrowHandler = (
  throwableCallback: () => void,
  errorHandler: (error: any) => void,
): void => {
  if (!throwableCallback) throw new Error('throwableCallback param is required');
  if (!errorHandler) throw new Error('errorHandler param is required');

  try {
    throwableCallback();

    // in case throwableCallback did not throw
    throw new Error('throwableCallback must throw an error');
  } catch (error: any) {
    errorHandler(error);
  }
};

export { expectToThrowHandler };
