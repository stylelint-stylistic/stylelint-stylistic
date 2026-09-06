import { readFileSync } from "node:fs"
import path from "node:path"

import stylelint, { type Config } from "stylelint"
import { describe, expect, expectTypeOf, it } from "vitest"

import plugin from "../index.ts"
import factories from "../rules/index.ts"
import { namespaces } from "../syntaxes/index.ts"
import type { ConfigurationError } from "../utils/configurationError/index.ts"

import { defineStylistic, defineStylisticOverride, type GlobalOptions, type Namespace, RULES_TAKING } from "./index.ts"

/** The exit code Stylelint reserves for a configuration error. */
const EXIT_CODE_INVALID_CONFIG = 78

describe(`defineStylistic`, () => {
	it(`names the rules of the core under "@stylistic/" where no syntax is named`, () => {
		expect(defineStylistic({ rules: { "color-hex-case": `lower`, "unit-case": `upper` } })).toEqual({
			"@stylistic/color-hex-case": [`lower`, {}],
			"@stylistic/unit-case": [`upper`, {}],
		})
	})

	it(`reads "css" as the core`, () => {
		expect(defineStylistic({ syntax: `css`, rules: { "color-hex-case": `lower` } })).toEqual({ "@stylistic/color-hex-case": [`lower`, {}] })
	})

	for (let syntax of [`scss`, `less`, `styled`] as const) {
		it(`names the rules of the "${syntax}" namespace under its segment`, () => {
			expect(defineStylistic({ syntax, rules: { "color-hex-case": `lower` } })).toEqual({ [`@stylistic/${syntax}/color-hex-case`]: [`lower`, {}] })
		})
	}

	it(`writes every shape of a setting as a pair, and leaves null alone`, () => {
		let secondary = { baseIndentLevel: 1, severity: `warning` } as const

		expect(defineStylistic({ rules: { "color-hex-case": null, "unit-case": [`lower`], "indentation": [`tab`, secondary] } })).toEqual({
			"@stylistic/color-hex-case": null,
			"@stylistic/unit-case": [`lower`, {}],
			"@stylistic/indentation": [`tab`, secondary],
		})
	})

	it(`names every namespace the plugin registers, and no other`, () => {
		let named: Record<Namespace, true> = { less: true, scss: true, styled: true }

		expect(Object.keys(named).toSorted()).toEqual(namespaces.map((syntax) => syntax.namespace).toSorted())
	})

	it(`stops the run with a configuration error on a syntax the plugin has no namespace for`, () => {
		let error: ConfigurationError | undefined

		try {
			defineStylistic({ syntax: `sass` as `scss`, rules: {} })
		}
		catch (thrown) {
			error = thrown as ConfigurationError
		}

		expect(error?.message).toBe(`"sass" is not a syntax of "@stylistic/stylelint-plugin": name one of "less", "scss", "styled", or "css" for plain CSS.`)
		expect(error?.code).toBe(EXIT_CODE_INVALID_CONFIG)
	})

	it(`stops the run with a configuration error on a name the plugin has no rule for`, () => {
		let error: ConfigurationError | undefined

		try {
			defineStylistic({ rules: { "colour-hex-case": `lower` } as unknown as { "color-hex-case": `lower` } })
		}
		catch (thrown) {
			error = thrown as ConfigurationError
		}

		expect(error?.message).toBe(`"colour-hex-case" is not a rule of "@stylistic/stylelint-plugin": the rules are named by their short names, "color-hex-case" for "@stylistic/color-hex-case".`)
		expect(error?.code).toBe(EXIT_CODE_INVALID_CONFIG)
	})

	it(`lints and fixes as the same entries written by hand do`, async () => {
		let code = `a { color: #FFF; width: 10PX }`
		let byHand = { plugins: plugin, rules: { "@stylistic/color-hex-case": `lower`, "@stylistic/unit-case": [`lower`, { severity: `warning` }] } }
		let defined = { plugins: plugin, rules: defineStylistic({ rules: { "color-hex-case": `lower`, "unit-case": [`lower`, { severity: `warning` }] } }) }
		let [byHandLint, definedLint] = await Promise.all([stylelint.lint({ code, config: byHand }), stylelint.lint({ code, config: defined })])

		expect(byHandLint.results[0]?.warnings).toHaveLength(2)
		expect(definedLint.results[0]?.warnings).toEqual(byHandLint.results[0]?.warnings)

		let [byHandFix, definedFix] = await Promise.all([stylelint.lint({ code, fix: true, config: byHand }), stylelint.lint({ code, fix: true, config: defined })])

		expect(definedFix.code).toBe(byHandFix.code)
		expect(definedFix.code).toBe(`a { color: #fff; width: 10px }`)
	})

	it(`writes a global option into the secondary options of every rule that takes it, and of no other`, () => {
		let rules = { "function-comma-space-after": `always`, "value-slash-space-after": [`always`], "color-hex-case": `lower`, "indentation": [`tab`, { baseIndentLevel: 1 }] } as const

		expect(defineStylistic({ rules }, { ignoreFunctions: [`url`], ignoreProperties: `grid-area` })).toEqual({
			"@stylistic/function-comma-space-after": [`always`, { ignoreFunctions: [`url`] }],
			"@stylistic/value-slash-space-after": [`always`, { ignoreFunctions: [`url`], ignoreProperties: `grid-area` }],
			"@stylistic/color-hex-case": [`lower`, {}],
			"@stylistic/indentation": [`tab`, { baseIndentLevel: 1 }],
		})
	})

	it(`writes a severity and a fix switch into every rule, and leaves a rule turned off alone`, () => {
		expect(defineStylistic({ rules: { "color-hex-case": `lower`, "unit-case": null, "indentation": [`tab`, { baseIndentLevel: 1 }] } }, { severity: `warning`, disableFix: true })).toEqual({
			"@stylistic/color-hex-case": [`lower`, { severity: `warning`, disableFix: true }],
			"@stylistic/unit-case": null,
			"@stylistic/indentation": [`tab`, { severity: `warning`, disableFix: true, baseIndentLevel: 1 }],
		})
	})

	it(`lets a rule's own option win over the global one`, () => {
		expect(defineStylistic({ rules: { "function-comma-space-after": [`always`, { ignoreFunctions: `calc`, severity: `error` }] } }, { ignoreFunctions: [`url`], severity: `warning` })).toEqual({
			"@stylistic/function-comma-space-after": [`always`, { ignoreFunctions: `calc`, severity: `error` }],
		})
	})

	it(`lists under each shared key every rule whose options spell it`, () => {
		for (let [key, names] of Object.entries(RULES_TAKING)) {
			let spelling = Object.keys(factories).filter((name) => readFileSync(new URL(`../rules/${name}/index.ts`, import.meta.url), `utf8`).includes(`${key}?:`))

			expect(names.toSorted(), key).toEqual(spelling.toSorted())
		}
	})

	it(`lints through a global severity as through one written into every rule by hand`, async () => {
		let code = `a { color: #FFF; width: 10PX }`
		let byHand = await stylelint.lint({ code, config: { plugins: plugin, rules: { "@stylistic/color-hex-case": [`lower`, { severity: `warning` }], "@stylistic/unit-case": [`lower`, { severity: `warning` }] } } })
		let defined = await stylelint.lint({ code, config: { plugins: plugin, rules: defineStylistic({ rules: { "color-hex-case": `lower`, "unit-case": `lower` } }, { severity: `warning` }) } })

		expect(byHand.results[0]?.warnings.map((warning) => warning.severity)).toEqual([`warning`, `warning`])
		expect(defined.results[0]?.warnings).toEqual(byHand.results[0]?.warnings)
	})

	it(`returns the overrides entry whole, naming the package the syntax is parsed with`, () => {
		let rules = { "color-hex-case": `lower` } as const

		expect(defineStylisticOverride({ syntax: `scss`, files: [`**/*.scss`], rules })).toEqual({ files: [`**/*.scss`], customSyntax: `postcss-scss`, rules: { "@stylistic/scss/color-hex-case": [`lower`, {}] } })
		expect(defineStylisticOverride({ syntax: `less`, files: `**/*.less`, rules })).toEqual({ files: `**/*.less`, customSyntax: `postcss-less`, rules: { "@stylistic/less/color-hex-case": [`lower`, {}] } })
		expect(defineStylisticOverride({ syntax: `styled`, files: [`**/*.{js,jsx,ts,tsx}`], rules })).toEqual({ files: [`**/*.{js,jsx,ts,tsx}`], customSyntax: `postcss-styled-syntax`, rules: { "@stylistic/styled/color-hex-case": [`lower`, {}] } })
		expect(defineStylisticOverride({ syntax: `css`, files: [`**/*.css`], rules })).toEqual({ files: [`**/*.css`], rules: { "@stylistic/color-hex-case": [`lower`, {}] } })
		expect(defineStylisticOverride({ files: [`**/*.css`], rules }, { severity: `warning` })).toEqual({ files: [`**/*.css`], rules: { "@stylistic/color-hex-case": [`lower`, { severity: `warning` }] } })
	})

	it(`lints an SCSS file through the overrides entry as through one written by hand`, async () => {
		let code = `a { color: #FFF; }`
		let codeFilename = path.join(process.cwd(), `tmp`, `entry.scss`)
		let byHand = await stylelint.lint({ code, codeFilename, config: { plugins: plugin, rules: {}, overrides: [{ files: [`**/*.scss`], customSyntax: `postcss-scss`, rules: { "@stylistic/scss/color-hex-case": `lower` } }] } })
		let defined = await stylelint.lint({ code, codeFilename, config: { plugins: plugin, rules: {}, overrides: [defineStylisticOverride({ syntax: `scss`, files: [`**/*.scss`], rules: { "color-hex-case": `lower` } })] } })

		expect(byHand.results[0]?.warnings).toHaveLength(1)
		expect(defined.results[0]?.warnings).toEqual(byHand.results[0]?.warnings)
	})

	it(`lints an SCSS stylesheet through the namespace it names`, async () => {
		let code = `a { color: #FFF; }`
		let byHand = await stylelint.lint({ code, config: { plugins: plugin, customSyntax: `postcss-scss`, rules: { "@stylistic/scss/color-hex-case": `lower` } } })
		let defined = await stylelint.lint({ code, config: { plugins: plugin, customSyntax: `postcss-scss`, rules: defineStylistic({ syntax: `scss`, rules: { "color-hex-case": `lower` } }) } })

		expect(byHand.results[0]?.warnings).toHaveLength(1)
		expect(defined.results[0]?.warnings).toEqual(byHand.results[0]?.warnings)
	})
})

describe(`the types of defineStylistic`, () => {
	it(`spell every setting as a pair under the prefixed names, and null as given`, () => {
		expectTypeOf(defineStylistic({ syntax: `scss`, rules: { "color-hex-case": `lower`, "indentation": [`tab`, { baseIndentLevel: 1 }] } })).toEqualTypeOf<{
			"@stylistic/scss/color-hex-case": [`lower`, Record<never, never>],
			"@stylistic/scss/indentation": [`tab`, { baseIndentLevel: 1 }],
		}>()
		expectTypeOf(defineStylistic({ rules: { "unit-case": [`upper`] } })).toEqualTypeOf<{ "@stylistic/unit-case": [`upper`, Record<never, never>] }>()
		expectTypeOf(defineStylistic({ syntax: `css`, rules: { "unit-case": null } })).toEqualTypeOf<{ "@stylistic/unit-case": null }>()
	})

	it(`take the keys Stylelint reads on any rule, beside the rule's own or alone`, () => {
		defineStylistic({ rules: { "max-line-length": [80, { ignore: `comments`, severity: `warning` }] } })
		defineStylistic({ rules: { "color-hex-case": [`lower`, { severity: `warning`, disableFix: true, message: `x`, url: `y`, reportDisables: true }] } })
		defineStylistic({ rules: { "declaration-colon-newline-after": [`always`, { severity: `error` }] } })
	})

	it(`refuse a primary option the rule does not take`, () => {
		// @ts-expect-error `mixed` is no option of the rule
		defineStylistic({ rules: { "color-hex-case": `mixed` } })
		// @ts-expect-error a number is no option of the rule
		defineStylistic({ rules: { indentation: [`tab`, { baseIndentLevel: `one` }] } })
	})

	it(`refuse a name the plugin has no rule for`, () => {
		// @ts-expect-error the rule is `color-hex-case`
		expect(() => defineStylistic({ rules: { "colour-hex-case": `lower` } })).toThrow()
	})

	it(`refuse a key the rule's secondary options do not spell`, () => {
		// @ts-expect-error the key is `baseIndentLevel`
		defineStylistic({ rules: { indentation: [`tab`, { baseIndentLvl: 1 }] } })
		// @ts-expect-error the rule reads no secondary options, so it takes only the common keys
		defineStylistic({ rules: { "declaration-colon-newline-after": [`always`, { ignore: `comments` }] } })
		// @ts-expect-error the rule reads no secondary options, so it takes only the common keys
		defineStylistic({ rules: { "color-hex-case": [`lower`, { ignoreFunctions: [`url`] }] } })
	})

	it(`write the global options a rule takes into its setting, and no other`, () => {
		expectTypeOf(defineStylistic({ rules: { "function-comma-space-after": `always`, "color-hex-case": `lower`, "unit-case": null, "indentation": [`tab`, { baseIndentLevel: 1 }] } }, { ignoreFunctions: [`url`], severity: `warning` })).toExtend<{
			"@stylistic/function-comma-space-after": [`always`, { ignoreFunctions: readonly [`url`], severity: `warning` }],
			"@stylistic/color-hex-case": [`lower`, { severity: `warning` }],
			"@stylistic/unit-case": null,
			"@stylistic/indentation": [`tab`, { severity: `warning`, baseIndentLevel: 1 }],
		}>()
	})

	it(`stand in the \`rules\` of a typed Stylelint configuration, with and without global options`, () => {
		let hoisted = { "color-hex-case": `lower`, "indentation": [`tab`, { baseIndentLevel: 1 }] } as const

		expectTypeOf(defineStylistic({ rules: hoisted })).toExtend<Config[`rules`]>()
		expectTypeOf(defineStylistic({ syntax: `scss`, rules: { "unit-case": [`lower`], "max-line-length": [80, { ignore: `comments` }] } })).toExtend<Config[`rules`]>()
		expectTypeOf(defineStylistic({ rules: hoisted }, { severity: `warning`, ignoreFunctions: [`url`] })).toExtend<Config[`rules`]>()
	})

	it(`name every rule a shared key reaches, in the list the run reads and in the type alike`, () => {
		expectTypeOf<(typeof RULES_TAKING)[`ignoreFunctions`][number]>().toEqualTypeOf<`function-comma-newline-after` | `function-comma-newline-before` | `function-comma-space-after` | `function-comma-space-before` | `value-slash-newline-after` | `value-slash-newline-before` | `value-slash-space-after` | `value-slash-space-before`>()
		expectTypeOf<(typeof RULES_TAKING)[`ignoreProperties`][number]>().toEqualTypeOf<`value-slash-newline-after` | `value-slash-newline-before` | `value-slash-space-after` | `value-slash-space-before`>()
		expectTypeOf<GlobalOptions[`ignoreFunctions`]>().toEqualTypeOf<string | RegExp | (string | RegExp)[] | undefined>()
	})

	it(`refuse a global option no rule takes, and a value the rules do not take it as`, () => {
		// @ts-expect-error no rule takes `ignore` alike
		defineStylistic({ rules: {} }, { ignore: `comments` })
		// @ts-expect-error a severity is `warning` or `error`
		defineStylistic({ rules: {} }, { severity: `warn` })
		// @ts-expect-error the rules take a string, a pattern or a list of them
		defineStylistic({ rules: {} }, { ignoreFunctions: 1 })
	})

	it(`return an overrides entry Stylelint's Config takes, its customSyntax read off the syntax`, () => {
		expectTypeOf(defineStylisticOverride({ syntax: `scss`, files: [`**/*.scss`], rules: { "color-hex-case": `lower` } })).toEqualTypeOf<{ files: `**/*.scss`[], customSyntax: `postcss-scss`, rules: { "@stylistic/scss/color-hex-case": [`lower`, Record<never, never>] } }>()
		expectTypeOf(defineStylisticOverride({ files: `**/*.css`, rules: { "color-hex-case": `lower` } })).toEqualTypeOf<{ files: `**/*.css`, rules: { "@stylistic/color-hex-case": [`lower`, Record<never, never>] } }>()
		expectTypeOf(defineStylisticOverride({ syntax: `styled`, files: [`**/*.tsx`], rules: { indentation: [`tab`] } }, { severity: `warning` })).toExtend<NonNullable<Config[`overrides`]>[number]>()
		expectTypeOf(defineStylisticOverride({ syntax: `css`, files: [`**/*.css`], rules: { "unit-case": null } })).toExtend<NonNullable<Config[`overrides`]>[number]>()
	})

	it(`refuse a syntax the plugin has no namespace for`, () => {
		// @ts-expect-error the namespace is `scss`
		expect(() => defineStylistic({ syntax: `sass`, rules: {} })).toThrow()
	})
})
