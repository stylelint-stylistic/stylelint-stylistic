<!-- markdownlint-disable MD024 -->
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com), and this project adheres to [Semantic Versioning](https://semver.org).

## [Unreleased]

### Fixed

- An explicit end position is now passed to all `report` calls. \
	The `report` calls no longer receive the `line` argument, which was [deprecated](https://github.com/stylelint/stylelint/pull/8244) in `stylelint@16.13.0`. \
	Previously, attempts to update `stylelint` to `16.13.0` version resulted in multiple DeprecationWarning messages ([#53](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/53)) ([@MorevM](https://github.com/MorevM)).
- Added an exception to the `declaration-block-semicolon-space-before` rule for an empty value of a custom property: now both `--custom-prop: ;` and `--custom-prop:;` are considered valid even with the `never` and `never-single-line` options. \
  You can find a detailed explanation in [the original issue](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/50) ([#51](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/51)) ([@MorevM](https://github.com/MorevM)).
- Fixed behavior of `baseIndentLevel` option of `indentation` rule when used in non-CSS files (e.g. when using `postcss-html` syntax) ([#47](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/47)) ([@net-solution](https://github.com/net-solution)).
- Fixed removing the starting indentation along with the blank line in the `no-empty-first-rule` rule ([#47](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/47)) ([@net-solution](https://github.com/net-solution)).

## [3.1.1] — 2024–10–04

### Fixed

- Indentation checking for property values that use dynamic expressions when using `postcss-styled-syntax` is now disabled ([#44](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/44)) ([@MorevM](https://github.com/MorevM)).

## [3.1.0] — 2024–09–23

### Added

- The `messageArgs` to 16 rules for custom message arguments. See [stylelint documentation](https://stylelint.io/user-guide/configure/#message) for details.

### Fixed

- Calculation of indentation using `postcss-styled-syntax` custom syntax ([#41](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/41)) ([@MorevM](https://github.com/MorevM)).

## [3.0.1] — 2024–08–18

### Fixed

- The `context.fix`, which is deprecated in `stylelint@16.8.2`, is no longer used. Previously, attempts to update `stylelint` to `16.8.2` version resulted in multiple DeprecationWarning messages ([#37](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/37)).

## [3.0.0] — 2024–07–30

### Changed

- The plugin now requires `stylelint` version `16.8.0` or higher.

## [2.1.3] — 2024–07–29

### Fixed

- Dependencies are now updated, which fixes test fails ([#29](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/29)) ([@ybiquitous](https://github.com/ybiquitous)).

## [2.1.2] — 2024–04–28

### Fixed

- Autofixing of `@charset` name by `string-quotes` rule ([#26](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/26)) ([@Mouvedia](https://github.com/Mouvedia)).

## [2.1.1] — 2024–03–31

### Fixed

- `block-closing-brace-empty-line-before` with except: ["after-closing-brace"] false negatives for CSS Nesting ([#22](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/22)) ([@firefoxic](https://github.com/firefoxic)).
- `named-grid-areas-alignment` for single-line input ([#21](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/21)) ([@MorevM](https://github.com/MorevM)).

## [2.1.0] — 2024–02–18

### Added

- `named-grid-areas-alignment` rule ([#16](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/16)) ([@MorevM](https://github.com/MorevM)).

## [2.0.0] — 2023–12–20

### Changed

- The repository renamed to `stylelint-stylistic` and moved to the organization of the same name.
- The plugin is published in `npm` under the new name `@stylistic/stylelint-plugin`. Therefore, you should:
	- change the former plugin name `stylelint-codeguide` to the new one in the config,
	- remove the old `stylelint-codeguide` package from dependencies
	- install the new `@stylistic/stylelint-plugin` package.
- The namespace of plugin rules has been renamed. Therefore, you should change the rules prefix from `codeguide/` to `@stylistic/` in the config.

## [1.0.2] — 2023–12–12

### Updated

- **Stylelint** to version `16.0.2`, which fixes the use of plugins in Windows.

## [1.0.1] — 2023–12–10

### Fixed

- Dependency definition.

## [1.0.0] — 2023–12–08

### Changed

- The required version of **Stylelint** is now at least `v16.0.1`.
- The required version of **Node.js** is now **LTS** at least `v18.12`, or at least `v20.9`.
- The plugin is now converted to a pure ES module.

## [0.3.2] — 2023–10–19

### Updated

- Stylelint to `^15.11.0`.
- Node.js to `>=18.16`.

## [0.3.1] — 2023–10–13

No meaningful changes.

## [0.3.0] — 2023–10–13

### Changed

- Along with updating the plugin to this release, Stylelint needs to be updated to `v15.10.3` as well.

### Updated

- All code according to `stylelint@15.10.3`.
- Peer dependency — `stylelint@15.10.3`.

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

- The `deprecated` flag from the `meta` of each rule.

## [0.1.2] — 2023–03–28

### Fixed

- `Error [ERR_REQUIRE_ESM]: require() of ES Module`.

## [0.1.1] — 2023–03–28

### Added

- Babel until Stylelint is converted to ES Modules.

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

[Unreleased]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v3.1.1...HEAD
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
