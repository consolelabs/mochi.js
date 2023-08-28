<p align="center">
  <img src="https://github.com/consolelabs/mochi.js/assets/25856620/ea835197-5ed7-45e3-a42f-3e696dfd11fb" alt="mochi pose 04" width="40%" />
</p>

# Mochi Mock

This package is used to mock json file normally returned by backend apis

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
npx mochi-mock -i

// pnpm
pnpm exec mochi-mock -i
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
const data = api
  .mock("path/to/json/mock/file", { query: "optional" })
  .get()
  .json();
```

#### Method 2

The other way is to attach a custom header called `X-Mochi-Mock` with the json file as the header's value (this is also how the mocker works under the hood)

## ❓ FAQ

### Do I need to follow some kind of format in my mock json file?

No, just use regular objects/list at the root, the response returned by the mocker will be converted to a format that is the same from a real api

### Does the mocker support query string?

Yes, and there are also some reserved keys like `page` and `size` that are used for pagination. Anyother key/value pair is treated as filtering value, for example, this file:

```json
[
  {
    "id": 1,
    "name": "john"
  },
  {
    "id": 2,
    "name": "ben"
  }
]
```

mocking this file with query string `?name=john` will only return list with 1 element

## 🤝 Contributing

If you happen to change the mock data, kindly submit a PR with the changes so the team can review it
