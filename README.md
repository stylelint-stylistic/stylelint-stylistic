# stylelint-codeguide

[![License: MIT][license-image]][license-url]
[![Test Status][test-image]][test-url]
[![NPM version][npm-image]][npm-url]
[![Vulnerabilities count][vulnerabilities-image]][vulnerabilities-url]

An updatable collection of stylistic rules for [Stylelint](https://github.com/stylelint/stylelint) (in plugin form).

## About and purpose

[Stylelint has removed 76 rules](https://stylelint.io/migration-guide/to-16#removed-deprecated-stylistic-rules) that enforce stylistic conventions.

stylelint-codeguide returns these rules to keep styles consistent with your codeguide. In addition, new rules may be added in the future.

The plugin follows [Stylelint's guidelines](https://stylelint.io/developer-guide/rules).

## Installation and usage

Add `stylelint-codeguide` and `stylelint` itself to your project:

```shell
npm install --save-dev stylelint stylelint-codeguide
```

Create the `.stylelintrc` config file (or open the existing one), add `stylelint-codeguide` to the plugins array and the rules you need to the rules list. [All rules from stylelint-codeguide](https://github.com/firefoxic/stylelint-codeguide/blob/main/docs/user-guide/rules.md) need to be namespaced with `@stylistic/`:

```json
{
	"plugins": [
		"stylelint-codeguide"
	],
	"rules": {
		// syntax rules from stylelint:
		"color-function-notation": "modern",
		"selector-max-compound-selectors": 2,
		// ...
		// stylistic rules from stylelint-codeguide:
		"@stylistic/color-hex-case": "lower",
		"@stylistic/number-leading-zero": "always",
		"@stylistic/unit-case": "lower"
	}
}
```

Please refer to [Stylelint docs](https://stylelint.io/user-guide/get-started) for detailed info on using this linter.

## Important documents

- [Changelog](https://github.com/firefoxic/stylelint-codeguide/blob/main/CHANGELOG.md)
- [Contributing](https://github.com/firefoxic/stylelint-codeguide/blob/main/CONTRIBUTING.md)
- [License](./LICENSE)

[test-url]: https://github.com/firefoxic/stylelint-codeguide/actions?workflow=Test
[test-image]: https://github.com/firefoxic/stylelint-codeguide/actions/workflows/test.yaml/badge.svg?branch=main

[npm-url]: https://www.npmjs.com/package/stylelint-codeguide
[npm-image]: https://img.shields.io/npm/v/stylelint-codeguide?logo=npm&logoColor=fff

[license-url]: https://github.com/firefoxic/stylelint-codeguide/blob/main/LICENSE
[license-image]: https://img.shields.io/badge/License-MIT-limegreen.svg

[vulnerabilities-url]: https://snyk.io/test/github/firefoxic/stylelint-codeguide
[vulnerabilities-image]: https://snyk.io/test/github/firefoxic/stylelint-codeguide/badge.svg
