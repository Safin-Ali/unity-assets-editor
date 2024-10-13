import {brightRed } from "https://deno.land/std@0.221.0/fmt/colors.ts";

export const selectors = [
  {
    message: "Choose Operation",
    options: [
      {
        name: "Increase Skin Slots",
        value: "iss",
      },
    ],
  },
];

export const validators = [
  {
    name: "validateInteger",
    cb: (input) => {
      if (!input || isNaN(input)) {
        console.dir(brightRed(" please provide number"));
        return false;
      }
      if (parseInt(input) > 99) {
        console.dir(brightRed(" please provide less 100 value"));
        return false;
      }
      return true;
    },
  },
];
