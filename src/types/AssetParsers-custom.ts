export type EndianessValue = "little" | "big";
export type AssetsDataType = 1 | 4 | 8;

export interface AssetParserLabels {
  offsetInt: number | null;
  valueHex: string[] | null;
  valueInt: number | null;
  endian: EndianessValue | null;
  dt: AssetsDataType | null;
}

export const initialAssetParserLabels: AssetParserLabels = {
  dt: null,
  endian: null,
  offsetInt: null,
  valueHex: null,
  valueInt: null,
};

export interface ModifyMetaSizeParams {
  int: number;
  operation?: "inc" | "dec";
}

export interface DependencyParserArg {
  buffer: string[];
  offset: number;
}

export interface ModifyDependencySizeParams {
  name: string;
  offset: number;
  operation?: "add" | "remove";
}

export interface ExistDependencies {
  name: string;
  index: number;
  startOffset: number;
  endOffset: number;
}

export type FirstFileParserParams = AssetParserLabels;

export type ModifyFirstFileParams = ModifyMetaSizeParams;

export type AssetSizeParserParams = AssetParserLabels;

export type ClassSizeParserArg = DependencyParserArg;

export type ClassSizeParams = AssetParserLabels;

export type ModifyClassSize = ModifyMetaSizeParams;
