/**
 * Interface representing a found sequence of bytes.
 */
export interface FoundSequence {
  start: number;
  end: number;
  hex: string[];
}

/**
 * Interface representing the result of the replaceBytes method.
 */
export interface ReplaceResult {
  oldBytes: string[];
  modifiedBytes: string[];
}

/**
 * Interface representing the result of the insertBytes method.
 */
export interface InsertResult {
  start: number;
  end: number;
  insertedBytes: string[];
}
