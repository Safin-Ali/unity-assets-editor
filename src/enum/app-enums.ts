enum ENV {
  DEV = "0",
  PRO = "1",
}

enum Prompt {
  IncreaseSkinSlots = "iss",
  TrafficSpawn = "tsp",
}

export enum Endianess {
  L = "little",
  B = "big",
}

export enum AssetsDataTypes {
  Int = 4,
  Sint64 = 8,
  UInt8 = 1
}

export const UABE_BUSSID = {
  ENV,
  Prompt,
  Endianess,
  AssetsDataTypes
};
