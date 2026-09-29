# Configs

The plugin ships one preset, `recommended`: the settings its author holds to be good, one for every rule of the plugin that has an answer the same for every project. It is not the stylistic part of the old `stylelint-config-standard` — that one lives on as [`@stylistic/stylelint-config`](https://github.com/stylelint-stylistic/stylelint-config), for a migration that changes nothing — but the plugin's own opinion.

Extend it by the package's `recommended` subpath, from a configuration of any format:

```json
{
	"extends": ["stylelint-config-standard", "@stylistic/stylelint-plugin/recommended"]
}
```

The preset lists the package in `plugins` itself, so nothing else is needed. What it sets is written once, in [`lib/configs/index.ts`](https://github.com/stylelint-stylistic/stylelint-stylistic/blob/main/lib/configs/index.ts): the table under the `@stylistic/` names for every file, and the same table under the `@stylistic/scss/` and `@stylistic/less/` names in two `overrides` entries, over `**/*.scss` with `postcss-scss` and over `**/*.less` with `postcss-less`. Those two packages stay dependencies of your project, and an entry whose files your project has none of loads nothing, so a project without SCSS needs no `postcss-scss`.

One setting of the preset is Stylelint's own: [`at-charset-rule-no-invalid`](https://stylelint.io/user-guide/rules/at-charset-rule-no-invalid). The rules of the plugin pass a `@charset` over, since its spelling is that rule's to judge, and a CSS file holding one gets a warning asking for the rule where the configuration leaves it off; the preset turns it on so that no such warning comes.

## Changing a setting

A setting of your own in `rules` wins over the preset's, under the name the preset sets it by: the `@stylistic/` name for plain CSS, the namespace's name for the files of a preprocessor. `null` turns a rule off.

```json
{
	"extends": ["@stylistic/stylelint-plugin/recommended"],
	"rules": {
		"@stylistic/string-quotes": "single",
		"@stylistic/scss/string-quotes": "single",
		"@stylistic/max-empty-lines": null
	}
}
```

A JavaScript configuration names the same settings through [`defineStylistic`](typed-configuration.md), with the editor completing and checking them.

## Other syntaxes

Styled templates are left out of the preset: they live in `.js` and `.ts` files, and which of those hold a stylesheet is your project's to say. The table the preset is built out of is exported beside it, as `configs.recommendedRules`, so a JavaScript configuration projects it under the `styled` namespace over the files it names:

```js
import { configs, defineStylisticOverride } from "@stylistic/stylelint-plugin"

export default {
	extends: ["@stylistic/stylelint-plugin/recommended"],
	overrides: [
		defineStylisticOverride({ syntax: "styled", files: "**/*.{js,jsx,ts,tsx}", rules: configs.recommendedRules }),
	],
}
```

The same table serves a project that changes one setting under every name at once. Such a configuration is built out of the table rather than extending the preset, since a setting written at the top level reaches the `@stylistic/` names alone:

```js
import { configs, defineStylistic, defineStylisticOverride } from "@stylistic/stylelint-plugin"

const rules = { ...configs.recommendedRules, "string-quotes": "single" }

export default {
	plugins: ["@stylistic/stylelint-plugin"],
	rules: {
		"at-charset-rule-no-invalid": true,
		...defineStylistic({ rules }),
	},
	overrides: [
		defineStylisticOverride({ syntax: "scss", files: "**/*.scss", rules }),
		defineStylisticOverride({ syntax: "less", files: "**/*.less", rules }),
	],
}
```

## The rules left unset

Every rule of the plugin is either in the preset or in this list, with the reason it is not; a rule added to the plugin without a decision fails the plugin's own build. A rule here is yours to set in `rules`, under its `@stylistic/` name.

| Rule | Why the preset leaves it unset |
| --- | --- |
| [`at-rule-name-newline-after`](../../lib/rules/at-rule-name-newline-after/README.md) | The twin of `at-rule-name-space-after`, which the preset sets to `always`: every option of this rule would [conflict](conflicting-settings.md) with it or repeat it. |
| [`block-closing-brace-space-after`](../../lib/rules/block-closing-brace-space-after/README.md) | The twin of `block-closing-brace-newline-after`, which the preset sets to `always`: a line break stands behind every closing brace, so no run is left for a space rule to speak of. |
| [`block-opening-brace-newline-before`](../../lib/rules/block-opening-brace-newline-before/README.md) | The twin of `block-opening-brace-space-before`, which the preset sets to `always`: every option of this rule would conflict with it or repeat it. |
| [`max-line-length`](../../lib/rules/max-line-length/README.md) | Breaking code over lines by their width is a formatter's way rather than a stylistic convention, and a modern stylesheet grows long lines out of custom properties as a matter of course. |
| [`value-slash-newline-after`](../../lib/rules/value-slash-newline-after/README.md) | The twin of `value-slash-space-after`, which the preset sets to `always`: every option of this rule would conflict with it. |
| [`value-slash-newline-before`](../../lib/rules/value-slash-newline-before/README.md) | The twin of `value-slash-space-before`, which the preset sets to `always`: every option of this rule would conflict with it. |
