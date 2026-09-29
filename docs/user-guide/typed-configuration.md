# Typed configuration

A JavaScript configuration can name this plugin's rules through two exported functions instead of writing the prefixed names by hand. You write the short names, `color-hex-case` rather than `@stylistic/scss/color-hex-case`, and the syntax once for the whole block. An editor completes the names and the options, and the compiler refuses a rule, a primary option, a secondary key or a syntax the plugin does not have, where a hand-written configuration meets a typo in a name as an "Unknown rule" on every line, in an option as a validation error at the run, and in a secondary key not at all. What several rules take alike is set once, in the [shared options](#shared-options).

Both functions return plain objects, so Stylelint knows nothing of them. Both refuse two settings of one call that [conflict with each other](conflicting-settings.md), as the plugin does at the run for a configuration put together any other way, and their types refuse such a pair in the editor: each of the two settings is typed with a message naming the other. A JSON or YAML configuration goes on naming the rules itself.

## `defineStylistic`

It takes the syntax and the rules, and returns the settings under the names Stylelint reads:

```js
import { defineStylistic } from "@stylistic/stylelint-plugin"

export default {
	plugins: ["@stylistic/stylelint-plugin"],
	rules: {
		"color-function-notation": "modern",
		...defineStylistic({
			rules: {
				"color-hex-case": "lower",
				"indentation": ["tab", { baseIndentLevel: 1 }],
			},
		}),
	},
}
```

The `rules` object takes the settings exactly as Stylelint's own `rules` does: a bare primary option, a pair of the primary and the secondary options, or `null` to turn a rule off. Every setting comes back as a pair, `{ "@stylistic/color-hex-case": ["lower", {}] }`.

`syntax` names the namespace the rules are read under: `scss`, `less` or `styled`. Naming `css`, or naming nothing, gives the core names.

```js
defineStylistic({ syntax: "scss", rules: { "color-hex-case": "lower" } })
// → { "@stylistic/scss/color-hex-case": ["lower", {}] }
```

A name or a syntax the plugin does not know stops the run with one configuration error naming it. What an option holds is checked by the rule when it runs.

## Shared options

A second argument holds what several rules take alike. Each key is written into every rule that takes it, and the rule's own option wins over it:

```js
defineStylistic({
	rules: {
		"function-comma-space-after": "always",
		"value-slash-space-before": ["never", { ignoreFunctions: ["clamp"] }],
	},
}, { severity: "warning", ignoreFunctions: ["url"] })
```

| Key                | Reaches                                          |
| ------------------ | ------------------------------------------------ |
| `ignoreFunctions`  | the `function-comma-*` and `value-slash-*` rules |
| `ignoreProperties` | the `value-slash-*` rules                        |
| `severity`         | every rule                                       |
| `disableFix`       | every rule                                       |

`severity` here makes this plugin's rules warnings while Stylelint's own stay errors, which `defaultSeverity` cannot: that one holds for the whole configuration.

## `defineStylisticOverride`

It takes `files` besides and returns the whole `overrides` entry, with the `customSyntax` the syntax is parsed with — `postcss-scss`, `postcss-less` or `postcss-styled-syntax`, each of which stays a dependency of your project:

```js
import { defineStylisticOverride } from "@stylistic/stylelint-plugin"

export default {
	plugins: ["@stylistic/stylelint-plugin"],
	overrides: [
		defineStylisticOverride({ syntax: "scss", files: ["**/*.scss"], rules: { "color-hex-case": "lower" } }),
		defineStylisticOverride({ syntax: "less", files: ["**/*.less"], rules: { "color-hex-case": "lower" } }),
	],
}
```

It takes the same second argument as `defineStylistic`, and the same syntax names; a `css` entry, or one naming no syntax, comes back without `customSyntax`.

Configuring one family per file, as `defineStylisticOverride` does, lists no rule twice over a file; where a rule is listed twice, it is still read once (see [Custom syntaxes](custom-syntaxes.md)).
