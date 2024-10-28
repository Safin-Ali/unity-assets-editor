import { EventEmitter } from "node:events";

// Define an interface for the events
interface AppEvents {
  restart: void; // No payload for 'restart' event
}

// Extend EventEmitter with your custom event types
class AppEmitter extends EventEmitter {
  override emit<K extends keyof AppEvents>(
    event: K,
    ...args: AppEvents[K] extends undefined ? [] : [AppEvents[K]]
  ): boolean {
    return super.emit(event, ...args);
  }

  override on<K extends keyof AppEvents>(
    event: K,
    listener: (
      ...args: AppEvents[K] extends undefined ? [] : [AppEvents[K]]
    ) => void,
  ): this {
    return super.on(event, listener);
  }
}

export const appEmitter = new AppEmitter();

export const restartApp = () => {
  setTimeout(() => {
    console.clear();
    appEmitter.emit("restart"); // Emit 'restart' event
  }, 3000);
};
