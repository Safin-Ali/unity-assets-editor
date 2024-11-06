export interface BlockField {
    hex:string[];
    int:number;
}

export interface EOCHD {
    CDHFStartOffset:BlockField;
    CDHFBytesTotalSize:BlockField;
    CDHFTotalRecord:BlockField;
    CDHFNumberRecord:BlockField;
    offset:number;
}

export interface LFH {
    offset:number;
    crc32:BlockField;
    fileName:string;
}
export interface CDFH {
    offset:number;
    extVersion:BlockField;
    crc32:BlockField;
    fileName:string;
}