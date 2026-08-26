# Stylelint Stylistic

[![License: MIT][license-image]][license-url]
[![Changelog][changelog-image]][changelog-url]
[![Test Status][test-image]][test-url]

An updatable collection of stylistic rules for [Stylelint](https://github.com/stylelint/stylelint) (in plugin form).

## About and purpose

[Stylelint has removed 76 rules](https://stylelint.io/migration-guide/to-16#removed-deprecated-stylistic-rules) that enforce stylistic conventions. This project brought them back to keep styles consistent with your codeguide, and it has not stopped there: the list grows with rules of its own, so it is a collection rather than a fixed set.

## Installation and usage

Add `@stylistic/stylelint-plugin` and `stylelint` itself to your project:

```shell
npm add -D stylelint @stylistic/stylelint-plugin
```

Create the `.stylelintrc` config file (or open the existing one), add `@stylistic/stylelint-plugin` to the plugins array and the rules you need to the rules list. [All rules from `@stylistic/stylelint-plugin`](https://github.com/stylelint-stylistic/stylelint-stylistic/blob/main/docs/user-guide/rules.md) need to be namespaced with `@stylistic/`. That prefix is the whole difference — an unprefixed name in the rules list is a rule of Stylelint's own, a prefixed one is a rule of this plugin:

```json
{
	"plugins": [
		"@stylistic/stylelint-plugin"
	],
	"rules": {
		"color-function-notation": "modern",
		"selector-max-compound-selectors": 2,

		"@stylistic/color-hex-case": "lower",
		"@stylistic/number-leading-zero": "always",
		"@stylistic/unit-case": "lower"
	}
}
```

---

Please refer to [Stylelint docs](https://stylelint.io/user-guide/get-started) for detailed info on using this linter.

## Need more?

ESLint deprecates stylistic rules, too. But you can continue to use them thanks to [ESLint Stylistic](https://eslint.style).

## Important documents

- [Rule list](https://github.com/stylelint-stylistic/stylelint-stylistic/blob/main/docs/user-guide/rules.md)
- [Contributing](https://github.com/stylelint-stylistic/stylelint-stylistic/blob/main/CONTRIBUTING.md)

[license-url]: https://github.com/stylelint-stylistic/stylelint-stylistic/blob/main/LICENSE.md
[license-image]: https://img.shields.io/badge/License-MIT-limegreen.svg

[changelog-url]: https://github.com/stylelint-stylistic/stylelint-stylistic/blob/main/CHANGELOG.md
[changelog-image]: https://img.shields.io/badge/Change-log-limegreen

[test-url]: https://github.com/stylelint-stylistic/stylelint-stylistic/actions
[test-image]: https://github.com/stylelint-stylistic/stylelint-stylistic/actions/workflows/test.yaml/badge.svg?branch=main
