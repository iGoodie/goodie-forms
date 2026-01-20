export type NativeFormPrimitive =
  | string
  | number
  | boolean
  | bigint
  | symbol
  | null
  | undefined
  | Date
  | File
  | Blob;

export type NativeFormArray = NativeFormValue[];

export type NativeFormObject = {
  [key: string]: NativeFormValue;
};

export type NativeFormValue =
  | NativeFormPrimitive
  | NativeFormObject
  | NativeFormArray;

// TODO: Find a way to enforce NativeForm shape.
