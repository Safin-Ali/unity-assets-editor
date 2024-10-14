import { brightCyan } from "https://deno.land/std@0.221.0/fmt/colors.ts";
import { errorLog } from "./common-utils.js";

export const selectors = [
  {
    message: "Choose Operation",
    options: [
      {
        name: brightCyan("Increase Skin Slots"),
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
        errorLog(" please provide number");
        return false;
      }
      if (parseInt(input) > 99) {
        errorLog(" please provide less 100 value");
        return false;
      }
      return true;
    },
  },
];
