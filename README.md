<p align="center">
  <img src="https://github.com/consolelabs/mochi.js/assets/25856620/a0d2a321-1a40-4a6d-a140-ee4a89a7e110" alt="mochi pose 5" width="40%" />
</p>

# Monorepo for everything related to Mochi and Javascript

## 🧰 What's included

🎛 [`mochi-formatter`](./packages/mochi-formatter/README.md): a set of formatters (text + digit) + oppionated components (functions that return markdown text) to render content on platforms such as Discord or Telegram, it makes use of the markdown syntax and the `code` syntax which preserves spaces and fixed-width characters.

🚀 [`mochi-rest`](./packages/mochi-rest/README.md): an SDK for Mochi's api ecosystems, built with Typescript and shipped with a response schema validator so that developers who are interested can build Mochi applications with confidence.

| Package                                                   | Version                                                                                                           |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [`mochi-formatter`](./packages/mochi-formatter/README.md) | <img src="https://badgen.net/npm/v/@consolelabs/mochi-formatter?cache=300&color=blue" alt="npm latest version" /> |
| [`mochi-rest`](./packages/mochi-rest/README.md)           | <img src="https://badgen.net/npm/v/@consolelabs/mochi-rest?cache=300&color=blue" alt="npm latest version" />      |
| [`mochi-mock`](./packages/mochi-mock/README.md)           | <img src="https://badgen.net/npm/v/@consolelabs/mochi-mock?cache=300&color=blue" alt="npm latest version" />      |

## 🤝 Contributing

**Use squash commit strategy in PRs**

Clone this repo, create a new branch from `main`, do your magic then open a pull request and send a request review to [vincent](https://github.com/tuanddd), your git commit should follow [conventional commit](https://www.conventionalcommits.org/en/v1.0.0/) format with the scope e.g. `feat(mochi-formatter): add a new component...`, after it is approved, you can merge the PR.
