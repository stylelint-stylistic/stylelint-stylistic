# Stylelint Stylistic

[![License: MIT][license-image]][license-url]
[![Test Status][test-image]][test-url]
[![NPM version][npm-image]][npm-url]
[![Vulnerabilities count][vulnerabilities-image]][vulnerabilities-url]

An updatable collection of stylistic rules for [Stylelint](https://github.com/stylelint/stylelint) (in plugin form).

## About and purpose

[Stylelint has removed 76 rules](https://stylelint.io/migration-guide/to-16#removed-deprecated-stylistic-rules) that enforce stylistic conventions. This project returns these rules to keep styles consistent with your codeguide. In addition, new rules may be added in the future.

## Installation and usage

Add `@stylistic/stylelint-plugin` and `stylelint` itself to your project:

```shell
npm add -D stylelint @stylistic/stylelint-plugin
```

Create the `.stylelintrc` config file (or open the existing one), add `@stylistic/stylelint-plugin` to the plugins array and the rules you need to the rules list. [All rules from `@stylistic/stylelint-plugin`](https://github.com/stylelint-stylistic/stylelint-stylistic/blob/main/docs/user-guide/rules.md) need to be namespaced with `@stylistic/`:

```json
{
	"plugins": [
		"@stylistic/stylelint-plugin"
	],
	"rules": {
		// syntax rules from stylelint:
		"color-function-notation": "modern",
		"selector-max-compound-selectors": 2,

		// stylistic rules from @stylistic/stylelint-plugin:
		"@stylistic/color-hex-case": "lower",
		"@stylistic/number-leading-zero": "always",
		"@stylistic/unit-case": "lower"
	}
}
```

To avoid listing a lot of rules, you can use [`@stylistic/stylelint-config`](https://www.npmjs.com/package/@stylistic/stylelint-config), which returns the stylistic rules removed in [`stylelint-config-standard`](https://github.com/stylelint/stylelint-config-standard/releases/tag/30.0.0) and [`stylelint-config-recommended`](https://github.com/stylelint/stylelint-config-recommended/releases/tag/10.0.1).

---

Please refer to [Stylelint docs](https://stylelint.io/user-guide/get-started) for detailed info on using this linter.

## Need more?

ESLint deprecates stylistic rules, too. But you can continue to use them thanks to [ESLint Stylistic](https://eslint.style).

## Important documents

- [Rule list](https://github.com/stylelint-stylistic/stylelint-stylistic/blob/main/docs/user-guide/rules.md)
- [Changelog](https://github.com/stylelint-stylistic/stylelint-stylistic/blob/main/CHANGELOG.md)
- [Contributing](https://github.com/stylelint-stylistic/stylelint-stylistic/blob/main/CONTRIBUTING.md)
- [License](./LICENSE)

[test-url]: https://github.com/stylelint-stylistic/stylelint-stylistic/actions?workflow=Test
[test-image]: https://github.com/stylelint-stylistic/stylelint-stylistic/actions/workflows/test.yaml/badge.svg?branch=main

[npm-url]: https://www.npmjs.com/package/@stylistic/stylelint-plugin
[npm-image]: https://img.shields.io/npm/v/@stylistic/stylelint-plugin?logo=npm&logoColor=fff

[license-url]: https://github.com/stylelint-stylistic/stylelint-stylistic/blob/main/LICENSE
[license-image]: https://img.shields.io/badge/License-MIT-limegreen.svg

[vulnerabilities-url]: https://snyk.io/test/github/stylelint-stylistic/stylelint-stylistic
[vulnerabilities-image]: https://snyk.io/test/github/stylelint-stylistic/stylelint-stylistic/badge.svg
