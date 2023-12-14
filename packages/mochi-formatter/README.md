<p align="center">
  <img src="https://github.com/consolelabs/mochi.js/assets/25856620/aa8250b3-4f3e-4231-aa9e-e788b8883ea4" alt="mochi pose 13" width="40%" />
</p>

# Mochi UI <img src="https://badgen.net/npm/v/@consolelabs/mochi-formatter?cache=300" alt="npm latest version" />

This package includes the basic components that you need to render any Mochi data, generally speaking there are 3 main goal:

- Render Mochi identity
- Use components such as balance list, activities, transactions list, etc...
- Utilize helpers such as text/number formatters, etc...

## 🚀 Usage

```typescript
import API from "@consolelabs/mochi-rest";
import UI, { utils } from "@consolelabs/mochi-formatter";
import Redis from "ioredis";

// optionally use redis for better perf
UI.redis = new Redis();

const api = new API({});
api.init().then(() => {
  UI.api = api;
});

const [account, otherAccount] = await UI.formatProfile(
  Platform.Web,
  profile_id,
  other_profile_id
);

const markdownText = await UI.components.balance({
  /* props */
});

const formattedUsd = utils.formatUsdDigit(23.12563);
console.log(formattedUsd); // "$23.12"
```

## 🤖 API

### `resolve(on: Platform.Web | Platform.Discord | Platform.Telegram, profile_id_A: string, profile_id_B?: string)`

```typescript
const [account, otherAccount] = await UI.formatProfile(
  Platform.Web, // if you're using UI library on web
  profile_id,
  other_profile_id
);

// or using it on self
const [account] = await UI.formatProfile(Platform.Web, profile_id);
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

### Utilities

- `formatUsdDigit(input: string | number | object): string`: returns a string representation of the usd value with $ prefix
- `formatPercentDigit(input: string | number | object): string`: returns a string representation of the percentage value with % suffix
- `formatTokenDigit(input: string | number | object): string`: returns a string representation of the token value
- `formatDigit(options: object): string`: the base formatter, the shape of options is:

```typescript
type Options = {
  value: string | number;
  // how many numbers to keep after decimal point
  fractionDigits?: number;
  // decides whether the result should have commas
  withoutCommas?: boolean;
  // use shorten form e.g. 200,000 -> 200K, $1,234,567,890 -> $1B
  // note that by using this option some precision of number will be lost
  shorten?: boolean;
  // use for very small numbers e.g. 1e-8
  scientificFormat?: boolean;
};
```

Note: All the format functions except `formatDigit` follows the same decimal point formatting rule, that is:

- For percentage value, automatically hide decimal point if value >= 10
- For USD value, automatically hide decimal point if value >= 100
- For token value, automatically hide decimal point if value >= 1000

- In case of having to show decimal point, we only take maximum 2 digits that are not 0 starting from the dot, if both are 0 then take the first digit that is not zero, some examples:

```
0.02345 -> 0.02
0.2103 -> 0.2
0.00003981 -> 0.0003
```

### components (coming soon)
