import { EventEmitter } from "node:events";

export const appEmitter = new EventEmitter();

export const restartApp = () => {
  setTimeout(() => {
    console.clear();
    appEmitter.emit("restart");
  }, 3000);
};
