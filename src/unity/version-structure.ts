import { UABE_BUSSID } from "../enum/app-enums.ts";

const versionStructure = [
  {
    unity: "2021.3.40f1",
    metaSize:{
      start:22,
      end:24,
      endian:UABE_BUSSID.Endianess.B
    },
    dep:{
      endian:UABE_BUSSID.Endianess.L,
      nullByte:22,
      dependencyByteLeng:32
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
