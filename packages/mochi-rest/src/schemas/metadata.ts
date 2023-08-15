import { z } from "zod";

enum CommandScope {
  All,
  PublicOnly,
  PrivateOnly,
}

export const CommandSchema = z.object({
  id: z.number(),
  code: z.string(),
  discord_command: z.string(),
  telegram_command: z.string(),
  scope: z.nativeEnum(CommandScope), // All / Public only / Private only
  description: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const ListCommandSchema = z.array(CommandSchema);

export type Command = z.infer<typeof CommandSchema>;

export const CopySchema = z.object({
  fact: z.array(z.string()),
  tip: z.array(z.string()),
});

export type Copy = z.infer<typeof CopySchema>;
