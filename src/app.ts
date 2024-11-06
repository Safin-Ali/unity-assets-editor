import {
  brightBlue,
  brightRed,
} from "https://deno.land/std@0.221.0/fmt/colors.ts";
import { CLIHandler } from "./classes/CLIHandler.ts";
import { appEmitter, restartApp } from "./event/app-event.ts";
import { textCB } from "https://deno.land/x/deno_figlet@1.0.0/mod.ts";
import "https://deno.land/x/deno_figlet@1.0.0/dist/fonts/_doom.ts";
import { brightGreen } from "https://deno.land/std@0.170.0/fmt/colors.ts";
import { UABE_BUSSID } from "./enum/app-enums.ts";

Deno.env.set("UABE_BUSSID", UABE_BUSSID.ENV.DEV);

appEmitter.on("restart", () => {
  console.log(`${brightGreen("Created by")} ${brightRed("DevSA")}`);
  textCB("UABE BUSSID", "doom", undefined, (myAwesomeFiglet) => {
    console.log(brightBlue(myAwesomeFiglet));
    new CLIHandler();
  });
});

restartApp();