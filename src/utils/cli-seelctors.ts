import { brightCyan } from "https://deno.land/std@0.221.0/fmt/colors.ts";
import { warningLog } from "./common-utils.ts";
import type { Selector, Validator } from "../types/cli-selectors-custom.ts";

export const selectors: Selector[] = [
  {
    message: "Choose Operation",
    options: [
      { name: brightCyan("Increase Skin Slots"), value: "iss" },
      { name: brightCyan("Traffic Spawn"), value: "tsp" },
      // { name: brightCyan("Protect OBB"), value: "obbpt" },
    ],
  },
];

export const validators: Validator[] = [
  {
    name: "validateInteger",
    cb: (input: string): boolean => {
      const num = Number(input);
      if (!input || isNaN(num)) {
        warningLog("Please provide a number.");
        return false;
      }
      if (num > 99) {
        warningLog("Please provide a value less than 100.");
        return false;
      }
      return true;
    },
  },
];
