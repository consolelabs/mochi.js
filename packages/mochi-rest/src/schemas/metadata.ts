import { z } from "zod";

enum CommandScope {
  All = 0,
  PublicOnly,
  PrivateOnly,
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
  fact: z.array(z.string().nonempty()),
  tip: z.array(z.string().nonempty()),
});

export type Copy = z.infer<typeof CopySchema>;
