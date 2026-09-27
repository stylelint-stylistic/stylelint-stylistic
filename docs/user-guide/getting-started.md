# Getting started

Add `@stylistic/stylelint-plugin` and `stylelint` itself to your project:

```shell
npm add -D stylelint @stylistic/stylelint-plugin
```

Create the `.stylelintrc` config file (or open the existing one), add `@stylistic/stylelint-plugin` to the plugins array and the rules you need to the rules list. [All rules from `@stylistic/stylelint-plugin`](./rules.md) need to be namespaced with `@stylistic/`. That prefix is the whole difference — an unprefixed name in the rules list is a rule of Stylelint's own, a prefixed one is a rule of this plugin:

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

The rules above read plain CSS. A stylesheet written in SCSS or Less, or embedded in JavaScript as a styled template, is read by the same rules under a namespace of its own — see [Custom syntaxes](./custom-syntaxes.md).

---

Please refer to [Stylelint docs](https://stylelint.io/user-guide/get-started) for detailed info on using this linter.
