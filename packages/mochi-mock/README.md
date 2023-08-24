<p align="center">
  <img src="https://github.com/consolelabs/mochi.js/assets/25856620/3a4124dc-5e86-4cfd-b33c-a1ba1aca370f" alt="mochi pose 13" width="40%" />
</p>

# Mochi Mock

This pacakge is used to mock data returned by api that are not yet finished so that front-end devs can use the mock data to continue their work

## 🌈 Installation

```bash
// npm
npm i @consolelabs/mochi-mock

// yarn
yarn add @consolelabs/mochi-mock

// pnpm
pnpm add @consolelabs/mochi-mock
```

## 🚀 Usage

First, sync the mock data to your local project, this should clone/overwrite the remote data mock repo

```bash
// npm or yarn
npx mochi-mock

// pnpm
pnpm exec mochi-mock
```

Then, begin mocking in your code

```javascript
// somewhere in your code, preferrably the entry file e.g. src/index.js

import mock from "@consolelabs/mochi-mock";
// or
const mock = require("@consolelabs/mochi-mock");

// begin mock
mock();
```

During development, you can change the mock data file and see the api response be updated as well

## 🤝 Contributing

If you happen to change the mock data, kindly submit a PR with the changes so the team can review it
