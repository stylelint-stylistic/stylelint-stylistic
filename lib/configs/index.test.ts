import { readFileSync } from "node:fs"
import path from "node:path"

import stylelint, { type Config } from "stylelint"
import { describe, expect, expectTypeOf, it } from "vitest"

import { pick } from "../../vitest.helpers.ts"
import { defineStylistic, defineStylisticOverride, type Namespace, type RulesInput } from "../defineStylistic/index.ts"
import factories from "../rules/index.ts"
import { namespaces } from "../syntaxes/index.ts"

import { CHARSET_RULE, configs, EXCLUDED_RULES } from "./index.ts"

/** The plugin loaded from source in place of the package the preset names, which resolves to the built package. */
const PLUGIN = new URL(`../index.ts`, import.meta.url).pathname

/** The preset with the plugin loaded from source, as every lint below extends it. */
const PRESET = { ...configs.recommended, plugins: [PLUGIN] }

/** A space no editor trims from the end of a line. */
const S = ` `

/** The warning the core's copy of a rule reports over a stylesheet its syntax refuses. */
const REFUSAL = /does not read a stylesheet parsed with this syntax/u

/** The page listing the rules the preset leaves unset, which holds the same list as `EXCLUDED_RULES`. */
const CONFIGS_PAGE = readFileSync(new URL(`../../docs/user-guide/configs.md`, import.meta.url), `utf8`)

/** A stylesheet every rule of the preset accepts. */
const CLEAN = `a {\n\tcolor: red;\n}\n`

/** The file the syntax is written in, for the preset's `overrides`; any path outside the repository does, since `codeFilename` names a file that need not exist. */
const FILE = { css: `/project/a.css`, scss: `/project/a.scss`, less: `/project/a.less`, styled: `/project/a.tsx` }

/** The package each namespace's stylesheets are parsed with. */
const CUSTOM_SYNTAX: Record<Namespace, string> = { scss: `postcss-scss`, less: `postcss-less`, styled: `postcss-styled-syntax` }

/** The least stylesheet of each namespace: an empty file, or, for styled, a file holding a one-line template, since a file holding no template holds no stylesheet for the rules to be handed. */
const EMPTY: Record<Namespace, string> = { scss: ``, less: ``, styled: `const A = styled.div\`color: red;\`\n` }

/** A stylesheet the preset rejects once per rule, and what the rule says of it; every rule of the table has one, which the type holds. */
const REJECTED: Record<keyof typeof configs.recommendedRules, { description: string, code: string, message: string }> = {
	"aspect-ratio-notation": {
		description: `a ratio written as one number`,
		code: `a { aspect-ratio: 2; }`,
		message: `Expected "2" to be "2 / 1"`,
	},
	"at-rule-name-case": {
		description: `an at-rule name in mixed case`,
		code: `@Layer a;`,
		message: `Expected "Layer" to be "layer"`,
	},
	"at-rule-name-space-after": {
		description: `no whitespace behind an at-rule name`,
		code: `@media(min-width: 1px) {}`,
		message: `Expected single space after at-rule name "@media"`,
	},
	"at-rule-semicolon-newline-after": {
		description: `two at-rules on one line`,
		code: `@layer a; @layer b;`,
		message: `Expected newline after ";"`,
	},
	"at-rule-semicolon-space-before": {
		description: `a space in front of an at-rule's semicolon`,
		code: `@layer a ;`,
		message: `Unexpected whitespace before ";"`,
	},
	"block-closing-brace-empty-line-before": {
		description: `an empty line in front of a closing brace`,
		code: `a {\n\tcolor: red;\n\n}`,
		message: `Unexpected empty line before closing brace`,
	},
	"block-closing-brace-newline-after": {
		description: `two blocks on one line`,
		code: `a { color: red; } b { color: blue; }`,
		message: `Expected newline after "}"`,
	},
	"block-closing-brace-newline-before": {
		description: `a single-line block`,
		code: `a { color: red; }`,
		message: `Expected newline before "}"`,
	},
	"block-closing-brace-space-before": {
		description: `a single-line block closed right behind its semicolon`,
		code: `a { color: red;}`,
		message: `Expected single space before "}" of a single-line block`,
	},
	"block-opening-brace-newline-after": {
		description: `a declaration on the line of the opening brace`,
		code: `a { color: red; }`,
		message: `Expected newline after "{"`,
	},
	"block-opening-brace-space-after": {
		description: `a single-line block opened right in front of its declaration`,
		code: `a {color: red; }`,
		message: `Expected single space after "{" of a single-line block`,
	},
	"block-opening-brace-space-before": {
		description: `an opening brace right behind the selector`,
		code: `a{ color: red; }`,
		message: `Expected single space before "{"`,
	},
	"color-hex-case": {
		description: `a hex color in upper case`,
		code: `a { color: #FFF; }`,
		message: `Expected "#FFF" to be "#fff"`,
	},
	"declaration-bang-space-after": {
		description: `a space behind the bang of a flag`,
		code: `a { color: red ! important; }`,
		message: `Unexpected whitespace after "!"`,
	},
	"declaration-bang-space-before": {
		description: `no whitespace in front of the bang of a flag`,
		code: `a { color: red!important; }`,
		message: `Expected single space before "!"`,
	},
	"declaration-block-semicolon-newline-after": {
		description: `two declarations on one line`,
		code: `a { color: red; top: 0; }`,
		message: `Expected newline after ";"`,
	},
	"declaration-block-semicolon-newline-before": {
		description: `a semicolon on a line of its own`,
		code: `a {\n\tcolor: red\n\t;\n}`,
		message: `Unexpected whitespace before ";" in a multi-line declaration block`,
	},
	"declaration-block-semicolon-space-after": {
		description: `no whitespace behind a semicolon of a single-line block`,
		code: `a { color: red;top: 0; }`,
		message: `Expected single space after ";" in a single-line declaration block`,
	},
	"declaration-block-semicolon-space-before": {
		description: `a space in front of a semicolon`,
		code: `a { color: red ; }`,
		message: `Unexpected whitespace before ";"`,
	},
	"declaration-block-single-line-max-declarations": {
		description: `a single-line block holding a declaration`,
		code: `a { color: red; }`,
		message: `Too many declarations, maximum 0`,
	},
	"declaration-block-trailing-semicolon": {
		description: `a last declaration without a semicolon`,
		code: `a { color: red }`,
		message: `Expected a trailing semicolon`,
	},
	"declaration-colon-newline-after": {
		description: `a multi-line value opening on the line of the colon`,
		code: `a {\n\tgrid-template-columns: 1fr\n\t\t1fr;\n}`,
		message: `Expected newline after ":" with a multi-line declaration`,
	},
	"declaration-colon-space-after": {
		description: `no whitespace behind the colon of a single-line declaration`,
		code: `a { color:red; }`,
		message: `Expected single space after ":" with a single-line declaration`,
	},
	"declaration-colon-space-before": {
		description: `a space in front of the colon`,
		code: `a { color : red; }`,
		message: `Unexpected whitespace before ":"`,
	},
	"function-comma-newline-after": {
		description: `a comma of a multi-line call followed by a space`,
		code: `a {\n\ttransform: translate(1,\n\t\t1, 1);\n}`,
		message: `Expected newline after "," in a multi-line function`,
	},
	"function-comma-newline-before": {
		description: `a comma of a multi-line call opening a line`,
		code: `a {\n\ttransform: translate(1\n\t\t, 1);\n}`,
		message: `Unexpected whitespace before "," in a multi-line function`,
	},
	"function-comma-space-after": {
		description: `no whitespace behind a comma of a single-line call`,
		code: `a { transform: translate(1,1); }`,
		message: `Expected single space after "," in a single-line function`,
	},
	"function-comma-space-before": {
		description: `a space in front of a comma of a call`,
		code: `a { transform: translate(1 , 1); }`,
		message: `Unexpected whitespace before ","`,
	},
	"function-max-empty-lines": {
		description: `an empty line inside a call`,
		code: `a {\n\ttransform: translate(\n\n\t\t1, 1\n\t);\n}`,
		message: `Expected no more than 0 empty lines`,
	},
	"function-parentheses-newline-inside": {
		description: `a multi-line call whose first argument follows the parenthesis`,
		code: `a {\n\ttransform: translate(1,\n\t\t1\n\t);\n}`,
		message: `Expected newline after "(" in a multi-line function`,
	},
	"function-parentheses-space-inside": {
		description: `a space behind the opening parenthesis of a single-line call`,
		code: `a { transform: translate( 1, 1); }`,
		message: `Unexpected whitespace after "(" in a single-line function`,
	},
	"function-whitespace-after": {
		description: `two calls with nothing between them`,
		code: `a { transform: translate(1, 1)scale(2); }`,
		message: `Expected whitespace after ")"`,
	},
	"indentation": {
		description: `a declaration indented with spaces`,
		code: `a {\n  color: red;\n}`,
		message: `Expected indentation of 1 tab`,
	},
	"linebreaks": {
		description: `a line ended with a Windows pair`,
		code: `a {}\r\n`,
		message: `Expected linebreak to be unix`,
	},
	"max-empty-lines": {
		description: `three empty lines in a row`,
		code: `a {}\n\n\n\nb {}`,
		message: `Expected no more than 2 empty lines`,
	},
	"media-feature-colon-space-after": {
		description: `no whitespace behind the colon of a media feature`,
		code: `@media (min-width:1px) {}`,
		message: `Expected single space after ":"`,
	},
	"media-feature-colon-space-before": {
		description: `a space in front of the colon of a media feature`,
		code: `@media (min-width : 1px) {}`,
		message: `Unexpected whitespace before ":"`,
	},
	"media-feature-name-case": {
		description: `a media feature name in upper case`,
		code: `@media (MIN-WIDTH: 1px) {}`,
		message: `Expected "MIN-WIDTH" to be "min-width"`,
	},
	"media-feature-parentheses-space-inside": {
		description: `a space behind the opening parenthesis of a media feature`,
		code: `@media ( min-width: 1px) {}`,
		message: `Unexpected whitespace after "("`,
	},
	"media-feature-range-operator-space-after": {
		description: `no whitespace behind a range operator`,
		code: `@media (width >=1px) {}`,
		message: `Expected single space after range operator`,
	},
	"media-feature-range-operator-space-before": {
		description: `no whitespace in front of a range operator`,
		code: `@media (width>= 1px) {}`,
		message: `Expected single space before range operator`,
	},
	"media-feature-slash-space-after": {
		description: `no whitespace behind the solidus of a media feature's ratio`,
		code: `@media (aspect-ratio: 16 /9) {}`,
		message: `Expected single space after "/"`,
	},
	"media-feature-slash-space-before": {
		description: `no whitespace in front of the solidus of a media feature's ratio`,
		code: `@media (aspect-ratio: 16/ 9) {}`,
		message: `Expected single space before "/"`,
	},
	"media-query-list-comma-newline-after": {
		description: `a comma of a multi-line media query list followed by a space`,
		code: `@media screen, print,\n\tspeech {}`,
		message: `Expected newline after "," in a multi-line list`,
	},
	"media-query-list-comma-newline-before": {
		description: `a comma of a multi-line media query list opening a line`,
		code: `@media screen\n\t, print {}`,
		message: `Unexpected whitespace before "," in a multi-line list`,
	},
	"media-query-list-comma-space-after": {
		description: `no whitespace behind a comma of a single-line media query list`,
		code: `@media screen,print {}`,
		message: `Expected single space after "," in a single-line list`,
	},
	"media-query-list-comma-space-before": {
		description: `a space in front of a comma of a single-line media query list`,
		code: `@media screen , print {}`,
		message: `Unexpected whitespace before "," in a single-line list`,
	},
	"named-grid-areas-alignment": {
		description: `two rows of grid areas whose cells are not aligned`,
		code: `a {\n\tgrid-template-areas:\n\t\t"a a"\n\t\t"bb bb";\n}`,
		message: `Expected \`grid-template-areas\` value to be aligned`,
	},
	"no-empty-first-line": {
		description: `a file opening with an empty line`,
		code: `\na {}\n`,
		message: `Unexpected empty line`,
	},
	"no-eol-whitespace": {
		description: `a space at the end of a line`,
		code: `a {}${S}\n`,
		message: `Unexpected whitespace at end of line`,
	},
	"no-extra-semicolons": {
		description: `a semicolon behind a block`,
		code: `a {};`,
		message: `Unexpected extra semicolon`,
	},
	"no-missing-end-of-source-newline": {
		description: `a file ending without a line break`,
		code: `a {}`,
		message: `Unexpected missing end-of-source newline`,
	},
	"no-multiple-whitespaces": {
		description: `two spaces between the parts of a value`,
		code: `a { gap: 1em  2em; }`,
		message: `Unexpected multiple whitespace`,
	},
	"number-leading-zero": {
		description: `a fraction without a leading zero`,
		code: `a { opacity: .5; }`,
		message: `Expected a leading zero`,
	},
	"number-no-trailing-zeros": {
		description: `a number with a trailing zero`,
		code: `a { opacity: 0.50; }`,
		message: `Unexpected trailing zero(s)`,
	},
	"property-case": {
		description: `a property in upper case`,
		code: `a { COLOR: red; }`,
		message: `Expected "COLOR" to be "color"`,
	},
	"selector-attribute-brackets-space-inside": {
		description: `a space behind the opening bracket of an attribute selector`,
		code: `[ href] {}`,
		message: `Unexpected whitespace after "["`,
	},
	"selector-attribute-operator-space-after": {
		description: `a space behind the operator of an attribute selector`,
		code: `[href= "a"] {}`,
		message: `Unexpected whitespace after "="`,
	},
	"selector-attribute-operator-space-before": {
		description: `a space in front of the operator of an attribute selector`,
		code: `[href ="a"] {}`,
		message: `Unexpected whitespace before "="`,
	},
	"selector-combinator-space-after": {
		description: `no whitespace behind a combinator`,
		code: `a >b {}`,
		message: `Expected single space after ">"`,
	},
	"selector-combinator-space-before": {
		description: `no whitespace in front of a combinator`,
		code: `a> b {}`,
		message: `Expected single space before ">"`,
	},
	"selector-descendant-combinator-no-non-space": {
		description: `two spaces as a descendant combinator`,
		code: `a  b {}`,
		message: `Unexpected "  "`,
	},
	"selector-list-comma-newline-after": {
		description: `a selector list on one line`,
		code: `a, b {}`,
		message: `Expected newline after ","`,
	},
	"selector-list-comma-newline-before": {
		description: `a comma of a multi-line selector list opening a line`,
		code: `a\n, b {}`,
		message: `Unexpected whitespace before "," in a multi-line list`,
	},
	"selector-list-comma-space-after": {
		description: `no whitespace behind a comma of a single-line selector list`,
		code: `a,b {}`,
		message: `Expected single space after "," in a single-line list`,
	},
	"selector-list-comma-space-before": {
		description: `a space in front of a comma of a selector list`,
		code: `a , b {}`,
		message: `Unexpected whitespace before ","`,
	},
	"selector-max-empty-lines": {
		description: `an empty line inside a selector list`,
		code: `a,\n\nb {}`,
		message: `Expected no more than 0 empty lines`,
	},
	"selector-pseudo-class-case": {
		description: `a pseudo-class in upper case`,
		code: `a:HOVER {}`,
		message: `Expected ":HOVER" to be ":hover"`,
	},
	"selector-pseudo-class-parentheses-space-inside": {
		description: `a space behind the opening parenthesis of a pseudo-class`,
		code: `a:not( b) {}`,
		message: `Unexpected whitespace after "("`,
	},
	"selector-pseudo-element-case": {
		description: `a pseudo-element in upper case`,
		code: `a::BEFORE {}`,
		message: `Expected "::BEFORE" to be "::before"`,
	},
	"string-quotes": {
		description: `a single-quoted string`,
		code: `a { content: 'x'; }`,
		message: `Expected double quotes`,
	},
	"unicode-bom": {
		description: `a stylesheet opening with a byte order mark`,
		code: `\uFEFFa {}\n`,
		message: `Unexpected Unicode BOM`,
	},
	"unit-case": {
		description: `a unit in upper case`,
		code: `a { top: 1PX; }`,
		message: `Expected "PX" to be "px"`,
	},
	"value-list-comma-newline-after": {
		description: `a comma of a multi-line value list followed by a space`,
		code: `a {\n\ttransition: color 1s,\n\t\ttop 1s, left 1s;\n}`,
		message: `Expected newline after "," in a multi-line list`,
	},
	"value-list-comma-newline-before": {
		description: `a comma of a multi-line value list opening a line`,
		code: `a {\n\ttransition: color 1s\n\t\t, top 1s;\n}`,
		message: `Unexpected whitespace before "," in a multi-line list`,
	},
	"value-list-comma-space-after": {
		description: `no whitespace behind a comma of a single-line value list`,
		code: `a { transition: color 1s,top 1s; }`,
		message: `Expected single space after "," in a single-line list`,
	},
	"value-list-comma-space-before": {
		description: `a space in front of a comma of a value list`,
		code: `a { transition: color 1s , top 1s; }`,
		message: `Unexpected whitespace before ","`,
	},
	"value-list-max-empty-lines": {
		description: `an empty line inside a value list`,
		code: `a {\n\ttransition: color 1s,\n\n\t\ttop 1s;\n}`,
		message: `Expected no more than 0 empty lines`,
	},
	"value-slash-space-after": {
		description: `no whitespace behind the solidus of a value`,
		code: `a { grid-area: 1 /2; }`,
		message: `Expected single space after "/"`,
	},
	"value-slash-space-before": {
		description: `no whitespace in front of the solidus of a value`,
		code: `a { grid-area: 1/ 2; }`,
		message: `Expected single space before "/"`,
	},
}

/**
 * Lints a stylesheet through Stylelint itself, extending the preset as a project's configuration does, and reads the result as the tests below do.
 * @param code - The stylesheet.
 * @param codeFilename - The file it stands in, whose extension picks the preset's `overrides` entry.
 * @param [rules] - The project's own settings over the preset's.
 * @returns The warnings by rule and text, the parse errors and the option warnings.
 */
async function lintExtending (code: string, codeFilename: string, rules: Config[`rules`] = {}): Promise<{ warnings: { rule: string, text: string }[], parseErrors: unknown[], invalidOptionWarnings: unknown[] }> {
	// An object in `extends` is what Stylelint accepts since 15.9, and what its type does not spell yet
	let { results } = await stylelint.lint({ code, codeFilename, config: { "extends": [PRESET as unknown as string], rules } })
	let { warnings, parseErrors, invalidOptionWarnings } = pick(results)

	return { warnings: warnings.map(({ rule, text }) => ({ rule, text })), parseErrors, invalidOptionWarnings }
}

describe(`the recommended preset`, () => {
	it(`names the package in plugins, the table under the core's names in rules beside the charset rule, and one overrides entry per preprocessor with its syntax`, () => {
		expect(configs.recommended.plugins).toEqual([`@stylistic/stylelint-plugin`])
		expect(configs.recommended.rules).toEqual({ [CHARSET_RULE]: true, ...defineStylistic({ rules: configs.recommendedRules }) })
		expect(configs.recommended.overrides).toEqual([
			{ files: `**/*.scss`, customSyntax: `postcss-scss`, rules: defineStylistic({ syntax: `scss`, rules: configs.recommendedRules }) },
			{ files: `**/*.less`, customSyntax: `postcss-less`, rules: defineStylistic({ syntax: `less`, rules: configs.recommendedRules }) },
		])
	})

	it(`decides every rule of the registry, in the table or in the list of the rules left unset, and no rule twice`, () => {
		let inTable = Object.keys(configs.recommendedRules)
		let leftUnset = Object.keys(EXCLUDED_RULES)

		expect([...inTable, ...leftUnset].toSorted()).toEqual(Object.keys(factories).toSorted())
		expect(inTable.filter((name) => leftUnset.includes(name))).toEqual([])
	})

	it(`names every rule it leaves unset on its page, and no other`, () => {
		let listed = [...CONFIGS_PAGE.matchAll(/^\| \[`([a-z-]+)`\]\(/gmu)].map(([, name]) => name)

		expect(listed.toSorted()).toEqual(Object.keys(EXCLUDED_RULES).toSorted())
	})

	it(`accepts a stylesheet written its way`, async () => {
		let { warnings, parseErrors, invalidOptionWarnings } = await lintExtending(CLEAN, FILE.css)

		expect({ warnings, parseErrors, invalidOptionWarnings }).toEqual({ warnings: [], parseErrors: [], invalidOptionWarnings: [] })
	})

	describe(`rejects, rule by rule,`, () => {
		for (let [name, { description, code, message }] of Object.entries(REJECTED)) {
			let ruleName = `@stylistic/${name}`
			let setting = configs.recommended.rules?.[ruleName]

			if (setting === undefined) throw new Error(`The preset sets no "${ruleName}"`)

			it(`${description}, under \`${name}\``, async () => {
				let { results } = await stylelint.lint({ code, config: { plugins: [PLUGIN], rules: { [ruleName]: setting } } })
				let { warnings, parseErrors, invalidOptionWarnings } = pick(results)

				expect(parseErrors).toEqual([])
				expect(invalidOptionWarnings).toEqual([])
				expect(warnings.map(({ rule, text }) => ({ rule, text }))).toEqual([{ rule: ruleName, text: `${message} (${ruleName})` }])
			})
		}
	})

	describe(`is taken by every syntax`, () => {
		it(`under the core's names, over an empty stylesheet`, async () => {
			let { results } = await stylelint.lint({ code: ``, config: { plugins: [PLUGIN], rules: configs.recommended.rules ?? {} } })

			expect(pick(results).invalidOptionWarnings).toEqual([])
		})

		for (let syntax of namespaces) {
			let namespace = syntax.namespace as Namespace

			it(`under the "${namespace}" namespace, over the least stylesheet, where an option the syntax refuses is reported`, async () => {
				let rules = defineStylistic({ syntax: namespace, rules: configs.recommendedRules })

				/**
				 * Lints the least stylesheet of the namespace, named by a file so that the linter itself validates the options rather than the runner of the tests.
				 * @param settings - The rules.
				 * @returns The option warnings.
				 */
				async function invalidOptionsOf (settings: Record<string, unknown>): Promise<unknown[]> {
					let { results } = await stylelint.lint({ code: EMPTY[namespace], codeFilename: FILE[namespace], config: { plugins: [PLUGIN], customSyntax: CUSTOM_SYNTAX[namespace], rules: settings } })

					return pick(results).invalidOptionWarnings
				}

				expect(await invalidOptionsOf(rules)).toEqual([])
				// The control: the same run reports an option the namespace does not take, so an empty list above says the table's options are taken
				expect(await invalidOptionsOf({ ...rules, [`@stylistic/${namespace}/color-hex-case`]: `mixed` })).toHaveLength(1)
			})
		}
	})

	describe(`reads a file of a preprocessor through the namespace's copies`, () => {
		for (let [syntax, filename] of [[`scss`, FILE.scss], [`less`, FILE.less]] as const) {
			it(`over a .${syntax} file, which no core name refuses`, async () => {
				let { warnings, parseErrors, invalidOptionWarnings } = await lintExtending(`a {\n\tb: 1PX; // c\n}\n`, filename)

				expect(parseErrors).toEqual([])
				expect(invalidOptionWarnings).toEqual([])
				expect(warnings.map(({ rule }) => rule)).toEqual([`@stylistic/${syntax}/unit-case`])
				expect(warnings.filter(({ text }) => REFUSAL.test(text))).toEqual([])
			})
		}
	})

	it(`yields to a setting the configuration extending it writes under a namespace's name, over the files of that syntax alone`, async () => {
		let rules = { "@stylistic/scss/string-quotes": `single` }

		expect((await lintExtending(`a {\n\tcontent: 'x';\n}\n`, FILE.scss, rules)).warnings).toEqual([])
		expect((await lintExtending(`a {\n\tcontent: 'x';\n}\n`, FILE.css, rules)).warnings.map(({ rule }) => rule)).toEqual([`@stylistic/string-quotes`])
	})

	it(`asks for the charset rule of the core, so a file holding a @charset gets no warning of the plugin about it`, async () => {
		let { warnings } = await lintExtending(`@charset "utf-8";\n\na {\n\tcolor: red;\n}\n`, FILE.css)

		expect(warnings).toEqual([])
	})
})

describe(`the types of the presets`, () => {
	it(`stand in a Stylelint configuration`, () => {
		expectTypeOf(configs.recommended).toExtend<Config>()
		expectTypeOf(configs.recommendedRules).toExtend<RulesInput>()
	})

	it(`let the table be projected under another namespace, and changed under every name at once`, () => {
		expectTypeOf(defineStylisticOverride({ syntax: `styled`, files: `**/*.{js,jsx,ts,tsx}`, rules: configs.recommendedRules })).toExtend<NonNullable<Config[`overrides`]>[number]>()
		expectTypeOf(defineStylistic({ rules: { ...configs.recommendedRules, "string-quotes": `single` } })).toExtend<Config[`rules`]>()
	})

	it(`are read off the built package by its subpath`, () => {
		let { exports } = JSON.parse(readFileSync(path.join(import.meta.dirname, `..`, `..`, `package.json`), `utf8`)) as { exports: Record<string, { "types": string, "default": string }> }

		expect(exports[`./recommended`]).toEqual({ "types": `./dist/configs/recommended.d.ts`, "default": `./dist/configs/recommended.js` })
	})
})
