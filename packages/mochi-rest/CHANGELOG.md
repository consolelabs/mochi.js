# @consolelabs/mochi-rest

## 5.1.0

### Minor Changes

- Add new profiles/search api

## 5.0.6

### Patch Changes

- Update typing for Moniker schema

## 5.0.5

### Patch Changes

- Add missing icon field optional string

## 5.0.4

### Patch Changes

- Adjust typing

## 5.0.3

### Patch Changes

- Add missing prefix mochi-wallet to get balance url

## 5.0.2

### Patch Changes

- Fix get balance url

## 5.0.1

### Patch Changes

- Ignore error from path param builder

## 5.0.0

### Major Changes

- BREAKING CHANGE: change the return type of api.pay.mochiWallet.getBalance method

## 4.2.2

### Patch Changes

- 47fafea: Expose type

## 4.2.1

### Patch Changes

- Add status field for mochi tx

## 4.2.0

### Minor Changes

- ca3559c: Add support for platform facebook

## 4.1.0

### Minor Changes

- Add auth api for facebook/twitter/gmail

## 4.0.1

### Patch Changes

- Add unset method for token

## 4.0.0

### Major Changes

- remove apiKey option, add token() method

## 3.1.0

### Minor Changes

- Add new get themes endpoint

## 3.0.16

### Patch Changes

- Update MochiTx schema

## 3.0.15

### Patch Changes

- Include "web" in platform enum

## 3.0.14

### Patch Changes

- Upgrade zod to avoid exploit

## 3.0.13

### Patch Changes

- Schema update

## 3.0.12

### Patch Changes

- Fix method of connect

## 3.0.11

### Patch Changes

- Update auth/connect method

## 3.0.10

### Patch Changes

- Update auth/connect methods

## 3.0.9

### Patch Changes

- UI tweak

## 3.0.8

### Patch Changes

- Remove log

## 3.0.7

### Patch Changes

- Debug

## 3.0.6

### Patch Changes

- new recap/top component

## 3.0.5

### Patch Changes

- Fix mochi identity bring emoji out of hyperlink, fix payme/paylink status text

## 3.0.4

### Patch Changes

- Fix typing for leaderboard response

## 3.0.3

### Patch Changes

- amount, activities, txns, pay-mes, relative time

## 3.0.2

### Patch Changes

- Adjust fetch size of emojis

## 3.0.1

### Patch Changes

- Add support for mail identity

## 3.0.0

### Major Changes

- 2b5df61: Using rest client now requires api urls to be passed in

## 2.0.10

### Patch Changes

- 433ab34: Fix stuff

## 2.0.9

### Patch Changes

- 26437de: formatUsdDigit and emoji metadata fetch by chunks

## 2.0.8

### Patch Changes

- ad5b290: Add emojis, fix changelog

## 2.0.7

### Patch Changes

- a15db2f: Fix price change percentage could be negative

## 2.0.6

### Patch Changes

- 2f85735: Add compare coins api

## 2.0.5

### Patch Changes

- c4c5e37: Remove changelog mark view mechanism

## 2.0.4

### Patch Changes

- 62d6adc: Add get swap route method + convert render from async to sync

## 2.0.3

### Patch Changes

- 01db972: Check is_expired of changelog before showing

## 2.0.2

### Patch Changes

- c33fdbd: Fix the settle_at field can be null

## 2.0.1

### Patch Changes

- 39e6671: Expose get paylinks and paymes

## 2.0.0

### Major Changes

- 360ea22: Change method getChangelogs to getLatestChangelog

## 1.7.0

### Minor Changes

- 7abc833: Add resolve telegram usernames api

## 1.6.1

### Patch Changes

- eb849f4: Command alias

## 1.6.0

### Minor Changes

- c766199: Add filenme override to markRead method and change formatting of heading

## 1.5.1

### Patch Changes

- a479f45: Remove mochi-mock as dependency of mochi-rest

## 1.5.0

### Minor Changes

- 85a49fb: Add changelog component + methods for checking for new changelogs

## 1.4.0

### Minor Changes

- dec9dfe: Add changelog metadata methods to rest client
- 8d68adb: Add metadata whitelist token and balance UI to show whitelisted tokens

## 1.3.6

### Patch Changes

- Updated dependencies [f20e14c]
  - @consolelabs/mochi-mock@0.1.0

## 1.3.5

### Patch Changes

- Updated dependencies [10d0f14]
  - @consolelabs/mochi-mock@0.0.7

## 1.3.4

### Patch Changes

- Updated dependencies [07cbdda]
  - @consolelabs/mochi-mock@0.0.6

## 1.3.3

### Patch Changes

- Updated dependencies [ac7dcf6]
  - @consolelabs/mochi-mock@0.0.5

## 1.3.2

### Patch Changes

- Updated dependencies [1067bbc]
  - @consolelabs/mochi-mock@0.0.4

## 1.3.1

### Patch Changes

- 3bb670a: Mocker use custom header
- Updated dependencies [3bb670a]
  - @consolelabs/mochi-mock@0.0.3

## 1.3.0

### Minor Changes

- 72f9724: Add "log" option to mochi-rest, add env detect logic to mochi-mock

## 1.2.0

### Minor Changes

- 0c82e58: Add command alias and auth by discord api

## 1.1.1

### Patch Changes

- b8d5ade: Swap PrivateOnly and PublicOnly in CommandScope

## 1.1.0

### Minor Changes

- 405a805: Export CommandScope enum

## 1.0.0

### Major Changes

- Initial release
