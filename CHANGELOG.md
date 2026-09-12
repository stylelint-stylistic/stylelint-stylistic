<!-- markdownlint-disable MD024 -->
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com), and this project adheres to [Semantic Versioning](https://semver.org).

## [Unreleased]

### Changed

#### Namespaces for custom syntaxes

The rules under their core names no longer read an SCSS or Less stylesheet, or a styled template: such a file now gets one warning naming the namespace that holds the same rules with the same options and documentation, and nothing else of it is checked.

Rename the rules in the `overrides` block that sets `customSyntax` — `@stylistic/scss/indentation` in place of `@stylistic/indentation`, and `less` or `styled` in place of `scss` for the other two. Nothing else in the configuration changes, and a namespace reads plain CSS exactly as the core does.

The core is now written for plain CSS alone, so a construct only a preprocessor spells is read as the CSS it is: a Sass module (`ns.$a`), a placeholder selector (`%a`), a nested property (`font: { … }`), a comment opened by a double slash, an at-rule carrying neither block nor parameters, and a value opening with `@`. A plain CSS file spelling any of those may meet warnings it used to escape.

The new `defineStylistic` and `defineStylisticOverride` functions (see below) name the syntax once for the whole block, so the rules stay under their short names and you write no namespace at all.

#### Expanding the scope of the rules

- The [`named-grid-areas-alignment`](https://stylelint-stylistic.github.io/rules/named-grid-areas-alignment) rule now applies to the `grid-template` and `grid` properties too, and not only to `grid-template-areas` (see [#45](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/45)). Where your code spells those shorthands, the rule may start asking for corrections or writing them under `--fix`. For finer control use its new option (see below).

#### The following false negatives have been fixed

The rules below used to pass some code over in silence. They now warn on it, so code that used to be clean may need corrections.

- The `declaration-block-semicolon-newline-after`, `declaration-block-semicolon-newline-before`, `declaration-block-semicolon-space-after` and `declaration-block-semicolon-space-before` rules now check the declarations of an inline `style` attribute (see [#49](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/49)).
- The `declaration-colon-space-after` rule now looks for the whitespace after the colon where a custom property whose value holds a comment actually keeps it (see [#109](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/109)) ([@VChet](https://github.com/VChet)).
- The `indentation` rule now reports every mis-indented line of an at-rule's parameters holding comments, at the line and column the file spells (see [#65](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/65)).
- The `indentation` rule now corrects every mis-indented line of an at-rule, and not only one of them (see [#64](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/64)).

And also a huge number of false negatives found by tools and agents, which may likewise require you to fix the code.

#### Independence from the order of the rules

Many rules now read the settings of other rules and lean on them, so what `--fix` leaves no longer depends on where the configuration lists a rule (see [#352](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/352), [#354](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/354), [#355](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/355), [#477](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/477), [#502](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/502)). A rule writing a line break, for one, asks the `linebreaks` rule which break to write, wherever that rule is listed. Expect some new autocorrections in your code.

#### End-of-line characters

The plugin now reads a line break the way PostCSS and Stylelint do: a line feed, alone or behind the carriage return of a Windows pair. A bare carriage return and a form feed are plain whitespace, so a file broken with either is one line to every rule about breaks, empty lines and multi-line lists, and no rule reports a position your editor cannot show. The `linebreaks` rule still tells `\n` from `\r\n`.

### Added

#### New rules

- The [`aspect-ratio-notation`](https://stylelint-stylistic.github.io/rules/aspect-ratio-notation) rule, which specifies how the value of `aspect-ratio` is written (see [#18](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/18)).
- The [`declaration-block-single-line-max-declarations`](https://stylelint-stylistic.github.io/rules/declaration-block-single-line-max-declarations) rule, which limits the number of declarations within a single-line declaration block (see [#639](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/639)). Stylelint 18 removes the rule of its own, and this one takes the same option, so a configuration moves it by renaming it to `@stylistic/declaration-block-single-line-max-declarations`. It reads more than Stylelint's did — the single-line block of an at-rule as well (see [#640](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/640)) — and it is autofixable, which Stylelint's never was (see [#641](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/641)).
- The [`value-slash-newline-before`](https://stylelint-stylistic.github.io/rules/value-slash-newline-before) and [`value-slash-newline-after`](https://stylelint-stylistic.github.io/rules/value-slash-newline-after) rules, which require a newline or disallow whitespace on either side of the same solidus (see [#622](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/622)).
- The [`value-slash-space-before`](https://stylelint-stylistic.github.io/rules/value-slash-space-before), [`value-slash-space-after`](https://stylelint-stylistic.github.io/rules/value-slash-space-after), [`media-feature-slash-space-before`](https://stylelint-stylistic.github.io/rules/media-feature-slash-space-before) and [`media-feature-slash-space-after`](https://stylelint-stylistic.github.io/rules/media-feature-slash-space-after) rules, which require a single space or disallow whitespace on either side of the solidus of a value or of a media feature's ratio (see [#548](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/548)).

#### New options

- The [`max-line-length`](https://stylelint-stylistic.github.io/rules/max-line-length) rule now has an additional `tabSize` option (see [#10](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/10)), which measures a tab to the next tab stop of that width, so a file indented with tabs is as long as the editor's ruler shows.
- The [`named-grid-areas-alignment`](https://stylelint-stylistic.github.io/rules/named-grid-areas-alignment) rule now has an additional `alignColumns` option (see [#45](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/45)), which lays the line names and the sizes of a `grid-template` or `grid` shorthand out as columns of a table.

#### New autofixes

- The [`at-rule-name-newline-after`](https://stylelint-stylistic.github.io/rules/at-rule-name-newline-after) rule is now autofixable (see [#696](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/696)). Expect `--fix` to write the newlines the rule used to only ask for. Where your configuration also lists `at-rule-name-space-after` under `always`, the two now ask for different things in the same place and the order they are listed in decides which one wins. A `@charset` is reported but left as written, since breaking its head can leave the stylesheet declaring no encoding.
- The [`at-rule-semicolon-space-before`](https://stylelint-stylistic.github.io/rules/at-rule-semicolon-space-before) rule is now autofixable (see [#697](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/697)). Expect `--fix` to write the whitespace the rule used to only ask for.
- The [`block-closing-brace-space-after`](https://stylelint-stylistic.github.io/rules/block-closing-brace-space-after) rule is now autofixable (see [#698](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/698)). Expect `--fix` to write the whitespace the rule used to only ask for. Where your configuration also lists `block-closing-brace-newline-after` asking for something else of that same run, only one of the two now writes and the other reports.

#### New features

- The package now exports the [`defineStylistic` and `defineStylisticOverride`](https://stylelint-stylistic.github.io/user-guide/typed-configuration) functions for a JavaScript configuration (see [#624](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/624)). You name the rules by their short names and the syntax once for the whole block: an editor completes the names and the options, and the compiler refuses a rule, an option, a key or a syntax the plugin does not take.
- The plugin now ships a type declaration for what it exports, so a TypeScript configuration or a script importing the package reads the plugin list as `Plugin[]` rather than as `any`. Nothing about configuring the plugin changes.
- The plugin now says so when it is listed in `extends` instead of `plugins` (see [#14](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/14)). Such a configuration used to fail with every `@stylistic/` rule of it reported as unknown; the run now stops with a configuration error naming the field to move the package to.

### Fixed

- The `block-opening-brace-space-before` rule no longer removes a comment standing between the selector and the opening brace when fixing (see [#63](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/63)).
- The `indentation` rule no longer damages a declaration whose multi-line value holds comments when fixing (see [#62](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/62)).
- The `selector-combinator-space-before` rule no longer reports a combinator that opens a selector when a comment stands in front of it (see [#66](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/66)).
- The `indentation` rule no longer raises the whole of a selector list by a level when one selector of it is a pseudo-class broken over several lines (see [#74](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/74)).
- The `no-eol-whitespace` rule now trims every line of a comment when fixing, and not only the lines up to the first quotation mark in it (see [#67](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/67)).
- The `string-quotes` rule no longer loses its bearings in a declaration's value or an at-rule's parameters holding a comment (see [#61](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/61), [#33](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/33)).

And also a huge number of bugs found by tools and agents.

## [5.3.0] — 2026–08–09

### Added

- The `function-comma-newline-after` rule now has an additional `ignoreFunctions` option (see [#78](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/78)).
- The `function-comma-newline-before` rule now has an additional `ignoreFunctions` option (see [#81](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/81)).
- The `function-comma-space-after` rule now has an additional `ignoreFunctions` option (see [#82](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/82)).
- The `function-comma-space-before` rule now has an additional `ignoreFunctions` option (see [#83](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/83)).

## [5.2.1] — 2026–07–01

### Fixed

- The protocol in the repository's metadata URL now meets current requirements ([#79](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/79)) ([@BowenMilner](https://github.com/BowenMilner)).

## [5.2.0] — 2026–05–20

### Added

- The `declaration-block-semicolon-newline-before` rule is now autofixable.

### Fixed

- An exception for an empty custom property value has been added to the `declaration-block-semicolon-newline-before` and `declaration-colon-space-after` rules: the `--custom-prop: ;` and `--custom-prop:;` variants are now considered valid (see [#50](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/50)).

## [5.1.0] — 2026–03–28

### Added

- The `no-multiple-whitespaces` rule, which disallows multiple whitespaces between property values and function arguments.

### Fixed

- The dependencies have now been updated to versions that include security fixes.

## [5.0.1] — 2026–01–22

### Fixed

- The `selector-pseudo-class-parentheses-space-inside` rule no longer triggers false positives in multiline pseudo-classes.

## [5.0.0] — 2026–01–15

### Changed

- The plugin now requires:
	- `stylelint` version `17.0.0` or higher
	- `node.js` version `20.19.0` or higher

## [4.0.1] — 2026–01–15

### Fixed

- Multiline pseudos are now aligned correctly with the `@stylistic/indentation` rule.

	**Before**:

	```css
	.foo:where(
	:not(
	    .bar,
	    .baz
	)
	) {}
	```

	**Now**:

	```css
	.foo:where(
	  :not(
	    .bar,
	    .baz
	  )
	) {}
	```

## [4.0.0] — 2025–07–22

### Changed

- The plugin now requires `stylelint` version `16.22.0` or higher.

## [3.1.3] — 2025–06–25

### Fixed

- `stylelint` has been moved from `dependencies` to `devDependencies`. This may potentially fix some errors (see [Stylelint's documentation regarding `peerDependencies`](https://stylelint.io/developer-guide/plugins#peer-dependencies) and [PRs that explain the motivation behind this decision](https://github.com/stylelint/stylelint/issues/2812)).
- `postcss` has been moved from `devDependencies` to `dependencies`. This fixes the “Cannot find package `postcss`” and “Named export `Input` not found” error in some environments.

## [3.1.2] — 2025–02–05

### Fixed

- An explicit end position is now passed to all `report` calls. \
	The `report` calls no longer receive the `line` argument, which was [deprecated](https://github.com/stylelint/stylelint/pull/8244) in `stylelint@16.13.0`. \
	Previously, attempts to update `stylelint` to `16.13.0` version resulted in multiple DeprecationWarning messages ([#53](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/53)) ([@MorevM](https://github.com/MorevM)).
- Added an exception to the `declaration-block-semicolon-space-before` rule for an empty value of a custom property: now both `--custom-prop: ;` and `--custom-prop:;` are considered valid even with the `never` and `never-single-line` options. \
  You can find a detailed explanation in [the original issue](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/50) ([#51](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/51)) ([@MorevM](https://github.com/MorevM)).
- Fixed behavior of `baseIndentLevel` option of `indentation` rule when used in non-CSS files (e.g. when using `postcss-html` syntax) ([#47](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/47)) ([@net-solution](https://github.com/net-solution)).
- Fixed removing the starting indentation along with the blank line in the `no-empty-first-rule` rule ([#47](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/47)) ([@net-solution](https://github.com/net-solution)).

## [3.1.1] — 2024–10–04

### Fixed

- Indentation checking for property values that use dynamic expressions when using `postcss-styled-syntax` is now disabled ([#44](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/44)) ([@MorevM](https://github.com/MorevM)).

## [3.1.0] — 2024–09–23

### Added

- The `messageArgs` to 16 rules for custom message arguments. See [stylelint documentation](https://stylelint.io/user-guide/configure/#message) for details.

### Fixed

- Calculation of indentation using `postcss-styled-syntax` custom syntax ([#41](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/41)) ([@MorevM](https://github.com/MorevM)).

## [3.0.1] — 2024–08–18

### Fixed

- The `context.fix`, which is deprecated in `stylelint@16.8.2`, is no longer used. Previously, attempts to update `stylelint` to `16.8.2` version resulted in multiple DeprecationWarning messages ([#37](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/37)).

## [3.0.0] — 2024–07–30

### Changed

- The plugin now requires `stylelint` version `16.8.0` or higher.

## [2.1.3] — 2024–07–29

### Fixed

- Dependencies are now updated, which fixes test fails ([#29](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/29)) ([@ybiquitous](https://github.com/ybiquitous)).

## [2.1.2] — 2024–04–28

### Fixed

- Autofixing of `@charset` name by `string-quotes` rule ([#26](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/26)) ([@Mouvedia](https://github.com/Mouvedia)).

## [2.1.1] — 2024–03–31

### Fixed

- `block-closing-brace-empty-line-before` with except: ["after-closing-brace"] false negatives for CSS Nesting ([#22](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/22)) ([@firefoxic](https://github.com/firefoxic)).
- `named-grid-areas-alignment` for single-line input ([#21](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/21)) ([@MorevM](https://github.com/MorevM)).

## [2.1.0] — 2024–02–18

### Added

- `named-grid-areas-alignment` rule ([#16](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/16)) ([@MorevM](https://github.com/MorevM)).

## [2.0.0] — 2023–12–20

### Changed

- The repository renamed to `stylelint-stylistic` and moved to the organization of the same name.
- The plugin is published in `npm` under the new name `@stylistic/stylelint-plugin`. Therefore, you should:
	- change the former plugin name `stylelint-codeguide` to the new one in the config,
	- remove the old `stylelint-codeguide` package from dependencies
	- install the new `@stylistic/stylelint-plugin` package.
- The namespace of plugin rules has been renamed. Therefore, you should change the rules prefix from `codeguide/` to `@stylistic/` in the config.

## [1.0.2] — 2023–12–12

### Updated

- **Stylelint** to version `16.0.2`, which fixes the use of plugins in Windows.

## [1.0.1] — 2023–12–10

### Fixed

- Dependency definition.

## [1.0.0] — 2023–12–08

### Changed

- The required version of **Stylelint** is now at least `v16.0.1`.
- The required version of **Node.js** is now **LTS** at least `v18.12`, or at least `v20.9`.
- The plugin is now converted to a pure ES module.

## [0.3.2] — 2023–10–19

### Updated

- Stylelint to `^15.11.0`.
- Node.js to `>=18.16`.

## [0.3.1] — 2023–10–13

No meaningful changes.

## [0.3.0] — 2023–10–13

### Changed

- Along with updating the plugin to this release, Stylelint needs to be updated to `v15.10.3` as well.

### Updated

- All code according to `stylelint@15.10.3`.
- Peer dependency — `stylelint@15.10.3`.

## [0.2.2] — 2023–09–14

### Fixed

- The path to the internal module.

## [0.2.1] — 2023–07–08

### Fixed

- Any LTS version of Node.js on the 18th branch is now required (i.e. at least `18.12.0`), not the latest.
- Any version of Stylelint on the 15th branch is now required (i.e. at least `15.0.0`), not the latest.

## [0.2.0] — 2023–07–01

### Updated

- Peer dependency Stylelint to `15.9.0`.

## [0.1.5] — 2023–07–01

### Fixed

- All paths to docs.

## [0.1.4] — 2023–05–20

### Changed

- Reorganized `package.json`.

## [0.1.3] — 2023–03–28

### Removed

- The `deprecated` flag from the `meta` of each rule.

## [0.1.2] — 2023–03–28

### Fixed

- `Error [ERR_REQUIRE_ESM]: require() of ES Module`.

## [0.1.1] — 2023–03–28

### Added

- Babel until Stylelint is converted to ES Modules.

## [0.1.0] — 2023–03–28

### Added

- `at-rule-name-case` rule.
- `at-rule-name-newline-after` rule.
- `at-rule-name-space-after` rule.
- `at-rule-semicolon-newline-after` rule.
- `at-rule-semicolon-space-before` rule.
- `block-closing-brace-empty-line-before` rule.
- `block-closing-brace-newline-after` rule.
- `block-closing-brace-newline-before` rule.
- `block-closing-brace-space-after` rule.
- `block-closing-brace-space-before` rule.
- `block-opening-brace-newline-after` rule.
- `block-opening-brace-newline-before` rule.
- `block-opening-brace-space-after` rule.
- `block-opening-brace-space-before` rule.
- `color-hex-case` rule.
- `declaration-bang-space-after` rule.
- `declaration-bang-space-before` rule.
- `declaration-block-semicolon-newline-after` rule.
- `declaration-block-semicolon-newline-before` rule.
- `declaration-block-semicolon-space-after` rule.
- `declaration-block-semicolon-space-before` rule.
- `declaration-block-trailing-semicolon` rule.
- `declaration-colon-newline-after` rule.
- `declaration-colon-space-after` rule.
- `declaration-colon-space-before` rule.
- `function-comma-newline-after` rule.
- `function-comma-newline-before` rule.
- `function-comma-space-after` rule.
- `function-comma-space-before` rule.
- `function-max-empty-lines` rule.
- `function-parentheses-newline-inside` rule.
- `function-parentheses-space-inside` rule.
- `function-whitespace-after` rule.
- `indentation` rule.
- `linebreaks` rule.
- `max-empty-lines` rule.
- `max-line-length` rule.
- `media-feature-colon-space-after` rule.
- `media-feature-colon-space-before` rule.
- `media-feature-name-case` rule.
- `media-feature-parentheses-space-inside` rule.
- `media-feature-range-operator-space-after` rule.
- `media-feature-range-operator-space-before` rule.
- `media-query-list-comma-newline-after` rule.
- `media-query-list-comma-newline-before` rule.
- `media-query-list-comma-space-after` rule.
- `media-query-list-comma-space-before` rule.
- `no-empty-first-line` rule.
- `no-eol-whitespace` rule.
- `no-extra-semicolons` rule.
- `no-missing-end-of-source-newline` rule.
- `number-leading-zero` rule.
- `number-no-trailing-zeros` rule.
- `property-case` rule.
- `selector-attribute-brackets-space-inside` rule.
- `selector-attribute-operator-space-after` rule.
- `selector-attribute-operator-space-before` rule.
- `selector-combinator-space-after` rule.
- `selector-combinator-space-before` rule.
- `selector-descendant-combinator-no-non-space` rule.
- `selector-list-comma-newline-after` rule.
- `selector-list-comma-newline-before` rule.
- `selector-list-comma-space-after` rule.
- `selector-list-comma-space-before` rule.
- `selector-max-empty-lines` rule.
- `selector-pseudo-class-case` rule.
- `selector-pseudo-class-parentheses-space-inside` rule.
- `selector-pseudo-element-case` rule.
- `string-quotes` rule.
- `unicode-bom` rule.
- `unit-case` rule.
- `value-list-comma-newline-after` rule.
- `value-list-comma-newline-before` rule.
- `value-list-comma-space-after` rule.
- `value-list-comma-space-before` rule.
- `value-list-max-empty-lines` rule.

[Unreleased]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v5.3.0...HEAD
[5.3.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v5.2.1...v5.3.0
[5.2.1]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v5.2.0...v5.2.1
[5.2.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v5.1.0...v5.2.0
[5.1.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v5.0.1...v5.1.0
[5.0.1]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v5.0.0...v5.0.1
[5.0.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v4.0.1...v5.0.0
[4.0.1]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v4.0.0...v4.0.1
[4.0.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v3.1.3...v4.0.0
[3.1.3]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v3.1.2...v3.1.3
[3.1.2]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v3.1.1...v3.1.2
[3.1.1]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v3.1.0...v3.1.1
[3.1.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v3.0.1...v3.1.0
[3.0.1]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v3.0.0...v3.0.1
[3.0.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v2.1.3...v3.0.0
[2.1.3]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v2.1.2...v2.1.3
[2.1.2]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v2.1.1...v2.1.2
[2.1.1]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v2.1.0...v2.1.1
[2.1.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v1.0.2...v2.0.0
[1.0.2]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v0.3.2...v1.0.0
[0.3.2]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v0.2.2...v0.3.1
[0.3.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v0.2.2...v0.3.0
[0.2.2]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v0.1.5...v0.2.0
[0.1.5]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/releases/tag/v0.1.0
