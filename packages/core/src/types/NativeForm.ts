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
  [key: PropertyKey]: NativeFormValue;
};

export type NativeFormValue =
  | NativeFormPrimitive
  | NativeFormArray
  | NativeFormObject;
