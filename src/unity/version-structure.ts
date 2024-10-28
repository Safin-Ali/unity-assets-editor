import { UABE_BUSSID } from "../enum/app-enums.ts";

const versionStructure = [
  {
    unity: "2021.3.40f1",
    metaSize: {
      start: 22,
      end: 24,
      endian: UABE_BUSSID.Endianess.B,
    },
    dep: {
      endian: UABE_BUSSID.Endianess.L,
      nullByte: 22,
      dependencyByteLeng: 32,
    },
    firstFile: {
      endian: UABE_BUSSID.Endianess.B,
      offsetBoundary: {
        status: true,
        boundary: 0x10,
      },
      start: 38,
      end: 40,
    },
    assetSize: {
      endian: UABE_BUSSID.Endianess.B,
      start: 30,
      end: 32,
    },
    classSize: {
      endian: UABE_BUSSID.Endianess.L,
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
