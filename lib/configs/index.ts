import type { Config } from "stylelint"

import { defineStylistic, type GlobalOptions, type RuleName, type RulesInput, type SyntaxName } from "../defineStylistic/index.ts"

/** The package, as a configuration names it in `plugins`; a string rather than the plugin itself, since the plugin's entry exports this module and Stylelint resolves the name from the directory of the configuration, which is inside the package. */
const PLUGIN = `@stylistic/stylelint-plugin`

/** The core rule that judges the spelling of a `@charset`, which the rules of the plugin pass over; a CSS file holding one gets a warning asking for the rule where the configuration leaves it off. */
const CHARSET_RULE = `at-charset-rule-no-invalid`

/** The recommended settings by short name, written once and projected under the core's names and under every namespace, so every option here is one each namespace takes. */
const RECOMMENDED_RULES = {
	"aspect-ratio-notation": `ratio`,
	"at-rule-name-case": `lower`,
	"at-rule-name-space-after": `always`,
	"at-rule-semicolon-newline-after": `always`,
	"at-rule-semicolon-space-before": `never`,
	"block-closing-brace-empty-line-before": `never`,
	"block-closing-brace-newline-after": `always`,
	"block-closing-brace-newline-before": `always`,
	"block-closing-brace-space-before": `always-single-line`,
	"block-opening-brace-newline-after": `always`,
	"block-opening-brace-space-after": `always-single-line`,
	"block-opening-brace-space-before": `always`,
	"color-hex-case": `lower`,
	"declaration-bang-space-after": `never`,
	"declaration-bang-space-before": `always`,
	"declaration-block-semicolon-newline-after": `always`,
	"declaration-block-semicolon-newline-before": `never-multi-line`,
	"declaration-block-semicolon-space-after": `always-single-line`,
	"declaration-block-semicolon-space-before": `never`,
	"declaration-block-single-line-max-declarations": 0,
	"declaration-block-trailing-semicolon": `always`,
	"declaration-colon-newline-after": `always-multi-line`,
	"declaration-colon-space-after": `always-single-line`,
	"declaration-colon-space-before": `never`,
	"function-comma-newline-after": `always-multi-line`,
	"function-comma-newline-before": `never-multi-line`,
	"function-comma-space-after": `always-single-line`,
	"function-comma-space-before": `never`,
	"function-max-empty-lines": 0,
	"function-parentheses-newline-inside": `always-multi-line`,
	"function-parentheses-space-inside": `never-single-line`,
	"function-whitespace-after": `always`,
	"indentation": `tab`,
	"linebreaks": `unix`,
	"max-empty-lines": 2,
	"media-feature-colon-space-after": `always`,
	"media-feature-colon-space-before": `never`,
	"media-feature-name-case": `lower`,
	"media-feature-parentheses-space-inside": `never`,
	"media-feature-range-operator-space-after": `always`,
	"media-feature-range-operator-space-before": `always`,
	"media-feature-slash-space-after": `always`,
	"media-feature-slash-space-before": `always`,
	"media-query-list-comma-newline-after": `always-multi-line`,
	"media-query-list-comma-newline-before": `never-multi-line`,
	"media-query-list-comma-space-after": `always-single-line`,
	"media-query-list-comma-space-before": `never-single-line`,
	"named-grid-areas-alignment": [true, { gap: 2, alignQuotes: true, alignColumns: true }],
	"no-empty-first-line": true,
	"no-eol-whitespace": true,
	"no-extra-semicolons": true,
	"no-missing-end-of-source-newline": true,
	"no-multiple-whitespaces": true,
	"number-leading-zero": `always`,
	"number-no-trailing-zeros": true,
	"property-case": `lower`,
	"selector-attribute-brackets-space-inside": `never`,
	"selector-attribute-operator-space-after": `never`,
	"selector-attribute-operator-space-before": `never`,
	"selector-combinator-space-after": `always`,
	"selector-combinator-space-before": `always`,
	"selector-descendant-combinator-no-non-space": true,
	"selector-list-comma-newline-after": `always`,
	"selector-list-comma-newline-before": `never-multi-line`,
	"selector-list-comma-space-after": `always-single-line`,
	"selector-list-comma-space-before": `never`,
	"selector-max-empty-lines": 0,
	"selector-pseudo-class-case": `lower`,
	"selector-pseudo-class-parentheses-space-inside": `never`,
	"selector-pseudo-element-case": `lower`,
	"string-quotes": `double`,
	"unicode-bom": `never`,
	"unit-case": `lower`,
	"value-list-comma-newline-after": `always-multi-line`,
	"value-list-comma-newline-before": `never-multi-line`,
	"value-list-comma-space-after": `always-single-line`,
	"value-list-comma-space-before": `never`,
	"value-list-max-empty-lines": 0,
	"value-slash-space-after": `always`,
	"value-slash-space-before": `always`,
} satisfies RulesInput

/** The rules the preset leaves unset, each with its reason. Every rule of the registry stands either here or in the table, which the type holds: a new rule without a decision fails the build. */
const EXCLUDED_RULES: Record<Exclude<RuleName, keyof typeof RECOMMENDED_RULES>, string> = {
	"at-rule-name-newline-after": `the twin of \`at-rule-name-space-after\`, which the preset sets to \`always\`: every option of this rule would conflict with it or repeat it`,
	"block-closing-brace-space-after": `the twin of \`block-closing-brace-newline-after\`, which the preset sets to \`always\`: a line break stands behind every closing brace, so no run is left for a space rule to speak of`,
	"block-opening-brace-newline-before": `the twin of \`block-opening-brace-space-before\`, which the preset sets to \`always\`: every option of this rule would conflict with it or repeat it`,
	"max-line-length": `breaking code over lines by their width is a formatter's way rather than a stylistic convention, and a modern stylesheet grows long lines out of custom properties as a matter of course`,
	"value-slash-newline-after": `the twin of \`value-slash-space-after\`, which the preset sets to \`always\`: every option of this rule would conflict with it`,
	"value-slash-newline-before": `the twin of \`value-slash-space-before\`, which the preset sets to \`always\`: every option of this rule would conflict with it`,
}

/** Files to read with a custom syntax; `false` leaves that syntax out. */
type SyntaxFiles = string | readonly string[] | false

/** Values that vary between projects while keeping the recommended table's other settings. */
export type CustomizeOptions = {
	indent?: `tab` | number,
	quotes?: `single` | `double`,
	maxEmptyLines?: number,
	singleLineBlocks?: boolean,
	linebreaks?: `unix` | `windows`,
	severity?: GlobalOptions[`severity`],
	disableFix?: boolean,
	syntaxes?: { scss?: SyntaxFiles, less?: SyntaxFiles, styled?: SyntaxFiles },
}

/** The options with unknown keys refused at both levels. */
type ExactOptions<O extends CustomizeOptions> = O & Record<Exclude<keyof O, keyof CustomizeOptions>, never> & (O extends { syntaxes: infer S }
	? { syntaxes: S & Record<Exclude<keyof S, keyof NonNullable<CustomizeOptions[`syntaxes`]>>, never> }
	: unknown)

const DEFAULT_SYNTAXES = { scss: `**/*.scss`, less: `**/*.less` } as const

/**
 * Builds the recommended preset with project-wide choices and optional syntax entries.
 * @param options - The settings to change from the recommended preset.
 * @returns The Stylelint configuration object.
 */
function customize<const O extends CustomizeOptions = Record<never, never>> (options?: ExactOptions<O>): Config {
	let settings = options ?? {} as O
	let rules = {
		...RECOMMENDED_RULES,
		...(settings.indent !== undefined && { indentation: settings.indent }),
		...(settings.quotes !== undefined && { "string-quotes": settings.quotes }),
		...(settings.maxEmptyLines !== undefined && { "max-empty-lines": settings.maxEmptyLines }),
		...(settings.singleLineBlocks !== undefined && { "declaration-block-single-line-max-declarations": settings.singleLineBlocks ? 1 : 0 }),
		...(settings.linebreaks !== undefined && { linebreaks: settings.linebreaks }),
	} satisfies RulesInput
	let globals: GlobalOptions = {
		...(settings.severity !== undefined && { severity: settings.severity }),
		...(settings.disableFix !== undefined && { disableFix: settings.disableFix }),
	}
	let syntaxes = { ...DEFAULT_SYNTAXES, ...settings.syntaxes }
	let overrides = Object.entries(syntaxes).flatMap(([syntax, files]) => {
		if (files === false) return []

		let normalizedFiles: string | string[] = typeof files === `string` ? files : [...files]

		return [{ files: normalizedFiles, rules: defineStylistic({ syntax: syntax as SyntaxName, rules }, globals) }]
	})

	return {
		plugins: [PLUGIN],
		rules: {
			[CHARSET_RULE]: true,
			...defineStylistic({ rules }, globals),
		},
		...(overrides.length > 0 && { overrides }),
	}
}

let recommended = customize()

/** The presets of the plugin, and the table the recommended one is built out of, for a configuration that projects it under another namespace or changes a setting under every name at once. */
export let configs = { recommended, recommendedRules: RECOMMENDED_RULES, customize }

export { CHARSET_RULE, EXCLUDED_RULES }
