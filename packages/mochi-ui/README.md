# Mochi formatters

## Usage

```typescript
import fmt, { Platform } from '@consolelabs/mochi-formatter';

fmt.profileAPI = '';

const [account, otherAccount] = await fmt.account(
  Platform.Web,
  profile_id,
  other_profile_id
);

console.log(account);
// {
//  value: string;
//  id: string;
//  url: string;
//  platform?:
//    | Platform.App
//    | Platform.Mochi
//    | Platform.Discord
//    | Platform.Telegram
//    | Platform.Twitter
//    | null;
// }
```
