# Stylelint Stylistic

[![License: MIT][license-image]][license-url]
[![Changelog][changelog-image]][changelog-url]
[![Test Status][test-image]][test-url]

An updatable collection of stylistic rules for [Stylelint](https://github.com/stylelint/stylelint) (in plugin form).

[Stylelint has removed dozens of rules](https://stylelint.io/migration-guide/to-16#removed-deprecated-stylistic-rules) that enforce stylistic conventions. This project brought them back to keep styles consistent with your codeguide, and it has not stopped there: the list grows with rules of its own, so it is a collection rather than a fixed set.

## Installation and usage

Add `@stylistic/stylelint-plugin` and `stylelint` itself to your project:

```shell
npm add -D stylelint @stylistic/stylelint-plugin
```

> [!IMPORTANT]
> Install a published version. The repository carries no built `dist/`, so a dependency named by a Git reference does **not** work.

Create `stylelint.config.mjs` (or open your existing configuration), add `@stylistic/stylelint-plugin` to the plugins array and the rules you need to the rules list. [All rules from `@stylistic/stylelint-plugin`](https://stylelint-stylistic.github.io/user-guide/rules) need to be namespaced with `@stylistic/`. That prefix is the whole difference — an unprefixed name in the rules list is a rule of Stylelint's own, a prefixed one is a rule of this plugin:

```js
export default {
	plugins: ["@stylistic/stylelint-plugin"],
	rules: {
		"color-function-notation": "modern",
		"selector-max-compound-selectors": 2,

		"@stylistic/color-hex-case": "lower",
		"@stylistic/number-leading-zero": "always",
		"@stylistic/unit-case": "lower",
	},
}
```

A stylesheet written in SCSS or Less, or embedded in JavaScript as a styled template, is read by the same rules under a namespace of its own: see [Custom syntaxes](https://stylelint-stylistic.github.io/user-guide/custom-syntaxes). The rules can also be named by their short names, with the editor completing and checking them: see [Typed configuration](https://stylelint-stylistic.github.io/user-guide/typed-configuration).

## Documentation

- [Getting started](https://stylelint-stylistic.github.io/user-guide/getting-started)
- [Rule list](https://stylelint-stylistic.github.io/user-guide/rules)
- [Custom syntaxes](https://stylelint-stylistic.github.io/user-guide/custom-syntaxes)
- [Typed configuration](https://stylelint-stylistic.github.io/user-guide/typed-configuration)
- [Conflicting settings](https://stylelint-stylistic.github.io/user-guide/conflicting-settings)
- [Contributing](https://stylelint-stylistic.github.io/contributing)

## Need more?

ESLint deprecates stylistic rules, too. But you can continue to use them thanks to [ESLint Stylistic](https://eslint.style).

[license-url]: https://github.com/stylelint-stylistic/stylelint-stylistic/blob/main/LICENSE.md
[license-image]: https://img.shields.io/badge/License-MIT-limegreen.svg

[changelog-url]: https://stylelint-stylistic.github.io/changelog
[changelog-image]: https://img.shields.io/badge/Change-log-limegreen

[test-url]: https://github.com/stylelint-stylistic/stylelint-stylistic/actions
[test-image]: https://github.com/stylelint-stylistic/stylelint-stylistic/actions/workflows/test.yaml/badge.svg?branch=main
