# Typed configuration

A JavaScript configuration can name this plugin's rules through two exported functions instead of writing the prefixed names by hand. They give you three things a hand-written configuration cannot have:

- **The names are completed and checked.** An editor offers the rule names and their options, and the compiler refuses a rule the plugin has no rule for, a primary option the rule does not take, a secondary key it does not spell, and a syntax it has no namespace for. Without them a typo in a name is an "Unknown rule" on every line, a typo in an option is a validation error at the run, and an unknown secondary key is passed over in silence.
- **The namespace is named once.** You write the short names, `color-hex-case` rather than `@stylistic/scss/color-hex-case`, and the syntax once for the whole block.
- **What several rules take alike is set once.** A list of functions to ignore, a severity for this plugin's rules alone, or a ban on autofixing goes into every rule that takes it.

Both functions return plain objects, so Stylelint knows nothing of them. A JSON or YAML configuration goes on naming the rules itself.

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

A name or a syntax the plugin does not know stops the run with one configuration error naming it. What an option holds is the rule's own to check at its turn, as it is today.

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

Configure one family of names per file. A namespace reads plain CSS too, so listing the core and a namespace over the same files would run every rule twice.
