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
