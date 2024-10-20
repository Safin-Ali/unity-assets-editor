export type EndianessValue = "little" | "big";

export interface AssetParserLabels {
    offsetInt: number | null;
    offsetHex: string[] | null;
    valueHex: string[] | null;
    valueInt: number | null;
    endian:EndianessValue | null
}

export interface ModifyMetaSizeParams {
    int: number;
    operation: "inc" | "dec";
}

export interface DependencyParserArg {
    buffer:string[],
    offset:number
}

export interface ModifyDependencySizeParams {
    name: string;
    offset:number;
    operation: "add" | "remove";
}

export interface ExistDependencies {
    name:string;
    index:number;
    startOffset:number;
    endOffset:number;
}