import { z } from "zod";

export enum CommandScope {
  All = 0,
  PrivateOnly,
  PublicOnly,
}

export const CommandSchema = z.object({
  id: z.number(),
  code: z.string().nonempty(),
  discord_command: z.string().nonempty(),
  telegram_command: z.string().nonempty(),
  scope: z.nativeEnum(CommandScope), // All / Private only / Public only
  description: z.string(),
  created_at: z.string().datetime().nonempty(),
  updated_at: z.string().datetime().nonempty(),
});

export const ListCommandSchema = z.array(CommandSchema);

export type Command = z.infer<typeof CommandSchema>;

export const CopySchema = z.object({
  id: z.number().nonnegative(),
  type: z.string().nonempty(),
  description: z.object({
    fact: z.array(z.string().nonempty()),
    tip: z.array(z.string().nonempty()),
  }),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Copy = z.infer<typeof CopySchema>;
