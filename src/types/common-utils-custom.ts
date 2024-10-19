/**
 * Interface for the parameters of the errorLog function.
 */
export interface ErrorLogParams {
  msg?: string;  // The error message to log, default is "Something is wrong".
  error: any;    // The error object to log.
}