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

### 1. Sync data

First, sync the mock data to your local project, this should clone/overwrite the remote data mock repo

```bash
// npm or yarn
npx mochi-mock

// pnpm
pnpm exec mochi-mock
```

### 2. Spy request

```javascript
import spyRequest from "@consolelabs/mochi-mock";
// or
const spyRequest = require("@consolelabs/mochi-mock");

// ensure that mocker only runs in development
if (process.env.NODE_ENV === "development") {
  spyRequest();
}
```

### 3. Mock response

#### Method 1 (recommended, requires [wretch](https://github.com/elbywan/wretch#addons) package)

Register a new addon for your wretch instance

```javascript
import { MockAddon } from "@consolelabs/mochi-mock";
import wretch from "@consolelabs";

const api = wretch().addon(MockAddon);

// somewhere else in your business logic
const data = api.mock("path/to/json/mock/file").get().json();
```

#### Method 2

The other way is to attach a custom header called `X-Mochi-Mock` with the json file as the header's value (this is also how the mocker works under the hood)

## 🤝 Contributing

If you happen to change the mock data, kindly submit a PR with the changes so the team can review it
