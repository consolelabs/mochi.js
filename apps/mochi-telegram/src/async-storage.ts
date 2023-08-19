import { AsyncLocalStorage } from "node:async_hooks";

type Storage = {
  data: any;
  start: number;
};

export const commandStore = new AsyncLocalStorage<Storage>();
