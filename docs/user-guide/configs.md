# Configs

The plugin ships one preset, `recommended`: the settings its author holds to be good, one for every rule of the plugin that has an answer the same for every project. It is not the stylistic part of the old `stylelint-config-standard` — that one lives on as [`@stylistic/stylelint-config`](https://github.com/stylelint-stylistic/stylelint-config), for a migration that changes nothing — but the plugin's own opinion.

Extend it by the package's `recommended` subpath, from a configuration of any format:

```js
export default {
	extends: [
		"stylelint-config-standard",
		"@stylistic/stylelint-plugin/recommended",
	],
}
```

The preset lists the package in `plugins` itself, so nothing else is needed. What it sets is written once, in [`lib/configs/index.ts`](https://github.com/stylelint-stylistic/stylelint-stylistic/blob/main/lib/configs/index.ts): the table under the `@stylistic/` names for every file, and the same table under the `@stylistic/scss/` and `@stylistic/less/` names in two `overrides` entries, over `**/*.scss` and over `**/*.less`.

Neither entry names the package its syntax is parsed with, so the preset asks of a project nothing it did not ask of itself before, and a project of plain CSS installs no parser. A stylesheet is read by the copies of the family it belongs to — the core's over CSS, a namespace's over the syntax the project named for it — and a copy that does not read it yields in silence, so no rule is ever refused. What a project gets without naming a syntax is what it got before the namespaces: an `.scss` file parsed as CSS and read by the `@stylistic/` names, which is less of a stylesheet than the language it is written in, and no warning about it. Naming the syntax for it is what the [next section](#your-own-syntaxes) is for.

One setting of the preset is Stylelint's own: [`at-charset-rule-no-invalid`](https://stylelint.io/user-guide/rules/at-charset-rule-no-invalid). The rules of the plugin pass a `@charset` over, since its spelling is that rule's to judge, and a CSS file holding one gets a warning asking for the rule where the configuration leaves it off; the preset turns it on so that no such warning comes.

## Changing a setting

A setting of your own in `rules` wins over the preset's, under the name the preset sets it by: the `@stylistic/` name for a stylesheet read as CSS, the namespace's name for the files of a syntax your project named. `null` turns a rule off — under every name the preset sets it by, or the copies left standing ask to be replaced by their namespace.

```js
export default {
	extends: ["@stylistic/stylelint-plugin/recommended"],
	rules: {
		"@stylistic/string-quotes": "single",
		"@stylistic/scss/string-quotes": "single",
		"@stylistic/max-empty-lines": null
	}
}
```

A JavaScript configuration names the same settings through [`defineStylistic`](typed-configuration.md), with the editor completing and checking them.

## Your own syntaxes

The preset names no syntax, so a project that writes SCSS or Less has to name the one its files are written in for the rules to read them as themselves rather than as CSS — and the package that parses them is yours to install. `defineStylisticOverride` writes the whole entry at once: the files, the package, and the same table under that namespace's names. Since the preset already sets those names over `**/*.scss` and `**/*.less`, an entry of your own only has to name the syntax:

```js
import { defineStylisticOverride } from "@stylistic/stylelint-plugin"

export default {
	extends: ["@stylistic/stylelint-plugin/recommended"],
	overrides: [
		defineStylisticOverride({
			syntax: "scss",
			files: "**/*.scss",
			rules: {},
		}),
	],
}
```

Styled templates are a case of their own: they live in `.js` and `.ts` files, and which of those hold a stylesheet is your project's to say, so the preset leaves them out entirely. Name the files and the syntax, and take the table the preset is built out of — exported beside it as `configs.recommendedRules`:

```js
import { configs, defineStylisticOverride } from "@stylistic/stylelint-plugin"

export default {
	extends: ["@stylistic/stylelint-plugin/recommended"],
	overrides: [
		defineStylisticOverride({
			syntax: "styled",
			files: "**/*.{js,jsx,ts,tsx}",
			rules: configs.recommendedRules,
		}),
	],
}
```

A page holding a `<style lang="scss">` beside a plain `<style>` is read the same way, under `postcss-html`, with that entry over the HTML files rather than over the `.scss` ones. What each namespace answers differently is written on its own page: [`scss`](../../lib/syntaxes/scss/README.md), [`less`](../../lib/syntaxes/less/README.md), [`styled`](../../lib/syntaxes/styled/README.md).

## One setting under every name at once

The same table serves a project that changes a setting wherever the rules are read from. Such a configuration is built out of the table rather than extending the preset, since a setting written at the top level reaches the `@stylistic/` names alone:

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

| Rule                                                                                                 | Why the preset leaves it unset                                                                                                                                                            |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`at-rule-name-newline-after`](../../lib/rules/at-rule-name-newline-after/README.md)                 | The twin of `at-rule-name-space-after`, which the preset sets to `always`: every option of this rule would [conflict](conflicting-settings.md) with it or repeat it.                      |
| [`block-closing-brace-space-after`](../../lib/rules/block-closing-brace-space-after/README.md)       | The twin of `block-closing-brace-newline-after`, which the preset sets to `always`: a line break stands behind every closing brace, so no run is left for a space rule to speak of.       |
| [`block-opening-brace-newline-before`](../../lib/rules/block-opening-brace-newline-before/README.md) | The twin of `block-opening-brace-space-before`, which the preset sets to `always`: every option of this rule would conflict with it or repeat it.                                         |
| [`max-line-length`](../../lib/rules/max-line-length/README.md)                                       | Breaking code over lines by their width is a formatter's way rather than a stylistic convention, and a modern stylesheet grows long lines out of custom properties as a matter of course. |
| [`value-slash-newline-after`](../../lib/rules/value-slash-newline-after/README.md)                   | The twin of `value-slash-space-after`, which the preset sets to `always`: every option of this rule would conflict with it.                                                               |
| [`value-slash-newline-before`](../../lib/rules/value-slash-newline-before/README.md)                 | The twin of `value-slash-space-before`, which the preset sets to `always`: every option of this rule would conflict with it.                                                              |
