import { brightCyan } from "https://deno.land/std@0.221.0/fmt/colors.ts";
import { errorLog } from "./common-utils.ts";
import type { Selector, Validator } from "../types/cli-selectors-custom.ts";

export const selectors: Selector[] = [
  {
    message: "Choose Operation",
    options: [
      { name: brightCyan("Increase Skin Slots"), value: "iss" },
      { name: brightCyan("Traffic Spawn"), value: "tsp" },
    ],
  },
];

export const validators: Validator[] = [
  {
    name: "validateInteger",
    cb: (input: string): boolean => {
      const num = Number(input);
      if (!input || isNaN(num)) {
        errorLog({
          error: null,
          msg: "Please provide a number.",
        });
        return false;
      }
      if (num > 99) {
        errorLog({
          msg: "Please provide a value less than 100.",
          error: null,
        });
        return false;
      }
      return true;
    },
  },
];
