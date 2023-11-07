import { z } from "zod";

export enum CommandScope {
  All = 0,
  PrivateOnly,
  PublicOnly,
}

export const CommandSchema = z.object({
  id: z.number(),
  code: z.string().min(1),
  discord_command: z.string().min(1),
  telegram_command: z.string().min(1),
  discord_alias: z.string(),
  telegram_alias: z.string(),
  scope: z.nativeEnum(CommandScope), // All / Private only / Public only
  description: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const ListCommandSchema = z.array(CommandSchema);

export type Command = z.infer<typeof CommandSchema>;

export const CopySchema = z.object({
  id: z.number().nonnegative(),
  type: z.string().min(1),
  description: z.object({
    fact: z.array(z.string().min(1)),
    tip: z.array(z.string().min(1)),
  }),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Copy = z.infer<typeof CopySchema>;

export const ChangelogSchema = z.object({
  product: z.enum(["Mochi", "Mochi Discord", "Mochi Telegram", ""]),
  title: z.string().min(1),
  content: z.string().min(1),
  github_url: z.string().url().or(z.string()),
  thumbnail_url: z.string().url().or(z.string()),
  file_name: z.string().min(1),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  is_expired: z.boolean(),
});

export const ListChangelogSchema = z.array(ChangelogSchema);
export type Changelog = z.infer<typeof ChangelogSchema>;

const EmojiSchema = z.object({
  code: z.string().min(1),
  emoji: z.string().min(1),
  emoji_url: z.string().url().or(z.literal("")),
});

export const EmojiListSchema = z.array(EmojiSchema);

export type Emoji = z.infer<typeof EmojiSchema>;

const ThemeSchema = z.object({
  id: z.number().min(1),
  image: z.string(),
  slug: z.string(),
  name: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const ListThemeSchema = z.array(ThemeSchema);
export type Theme = z.infer<typeof ThemeSchema>;
