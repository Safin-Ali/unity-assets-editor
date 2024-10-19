export interface Option {
  name: string;
  value: string;
}

export interface Selector {
  message: string;
  options: Option[];
}

export interface Validator {
  name: string;
  cb: (input: string) => boolean;
}