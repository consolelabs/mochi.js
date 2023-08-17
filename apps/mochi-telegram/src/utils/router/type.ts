import { createMachine } from "xstate";
import { Context as TgContext } from "telegraf";
import {
  InlineKeyboardButton,
  InputFile,
} from "telegraf/typings/core/types/typegram";

export type Context = {
  renderer: Record<string, Renderer>;
  id?: string;
  page?: number;
  totalPage?: number;
  [K: string]: any;
};

type CreateMachineParams = Parameters<typeof createMachine<Context, any, any>>;

export type MachineConfig = CreateMachineParams[0] & { id: string };
export type MachineOptions = CreateMachineParams[1];

type PaginationButtonsGetter = (
  page: number,
  totalPage: number
) => InlineKeyboardButton[];

export type Renderer = (
  tgContext: TgContext,
  event: string,
  context: Record<any, any>,
  paginationButtons: PaginationButtonsGetter
) => Promise<
  | {
      text?: string | null;
      photo?: InputFile;
      context?: Record<any, any>;
      options?: Record<any, any>;
    }
  | null
  | void
  | undefined
>;
