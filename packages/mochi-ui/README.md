# Mochi formatters

## Usage

```typescript
import UI from "@consolelabs/mochi-ui";
import Redis from "ioredis";

// optionally use redis for better perf
UI.redis = new Redis();

const [account, otherAccount] = await UI.resolve(
  Platform.Web,
  profile_id,
  other_profile_id
);

const markdownText = await UI.components.balance({
  /* props */
});
```

## API

### `redis`

```typescript
import UI from "@consolelabs/mochi-ui";
// only ioredis is supported for now
import Redis from "ioredis";

UI.redis = new Redis();
```

You can optionally assign an instance of `Redis` to improve perf

### `resolve(on: Platform.Web | Platform.Discord | Platform.Telegram, profile_id_A: string, profile_id_B?: string)`

```typescript
const [account, otherAccount] = await UI.resolve(
  Platform.Web, // if you're using UI library on web
  profile_id,
  other_profile_id
);

// or using it on self
const [account] = await UI.resolve(Platform.Web, profile_id);
```

Takes in a platform that you're rendering on, a pair of profile ids to resolve, `profile_id_B` defaults to `profile_id_A` if not passed in. The return value is an object with the following properties

```typescript
type UsernameFmt = {
  // this value is markdown
  value: string;
  // the id of that platform
  id: string;
  // url of this account
  url: string;
  // same as `value` but in plain text format
  plain: string;
  // in case of invalid account, this will be null
  platform?:
    | Platform.App
    | Platform.Mochi
    | Platform.Discord
    | Platform.Telegram
    | Platform.Twitter
    | Platform.Vault
    | null;
};
```

### components
