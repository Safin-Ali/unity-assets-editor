import { UABE_BUSSID } from "../enum/app-enums.ts";

const versionStructure = [
  {
    unity: "2021.3.40f1",
    metaSize: {
      start: 20,
      endian: UABE_BUSSID.Endianess.B,
      dt: UABE_BUSSID.AssetsDataTypes.Int,
    },
    dep: {
      endian: UABE_BUSSID.Endianess.L,
      nullByte: 22,
      dependencyByteLeng: 32,
      dt: UABE_BUSSID.AssetsDataTypes.Int,
    },
    firstFile: {
      endian: UABE_BUSSID.Endianess.B,
      offsetBoundary: {
        status: true,
        boundary: 0x10,
      },
      start: 32,
      dt: UABE_BUSSID.AssetsDataTypes.Sint64,
    },
    assetSize: {
      endian: UABE_BUSSID.Endianess.B,
      start: 24,
      dt: UABE_BUSSID.AssetsDataTypes.Sint64,
    },
    classSize: {
      endian: UABE_BUSSID.Endianess.L,
      dt: UABE_BUSSID.AssetsDataTypes.Int,
    },
    monoBehavior: {
      pptr: {
        endian: UABE_BUSSID.Endianess.L,
        fileId: UABE_BUSSID.AssetsDataTypes.Int,
        pathId: UABE_BUSSID.AssetsDataTypes.Sint64,
        arraySize: UABE_BUSSID.AssetsDataTypes.Int,
      },
    },
    iss: {
      mono: {
        alias: 4128,
        objDep: 224,
      },
    },
  },
];

export const currentVersion = versionStructure[0];

/**
 * 11 ofset byte give hex value as integer ofr offset value metasize start
 */
