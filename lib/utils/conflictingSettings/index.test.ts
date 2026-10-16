import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import scss from "postcss-scss"
import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import plugins from "../../index.ts"

import { type ConfiguredSetting, configuredSetting, conflictsAmong, conflictsError } from "./index.ts"

/** The break options each family's space options conflict with, written out by hand from measurements rather than derived from the module's own reading of the suffixes. */
const BEHIND_A_DELIMITER = {
	"always": [`always`, `never`],
	"always-multi-line": [`always`, `never`],
	"never-multi-line": [`always`],
}

const INSIDE_A_BLOCK = {
	"always": [`always`, `never`, `always-multi-line`, `never-multi-line`],
	"always-multi-line": [`always`, `never`, `always-multi-line`, `never-multi-line`],
	"never-multi-line": [`always`, `always-multi-line`],
}

const OUTSIDE_A_BLOCK = {
	"always": [`always`, `never`, `always-single-line`, `never-single-line`, `always-multi-line`, `never-multi-line`],
	"always-single-line": [`always`, `never`, `always-single-line`, `never-single-line`],
	"never-single-line": [`always`, `always-single-line`],
	"always-multi-line": [`always`, `never`, `always-multi-line`, `never-multi-line`],
	"never-multi-line": [`always`, `always-multi-line`],
}

const LINE_OPTIONS = [`always`, `never`, `always-single-line`, `never-single-line`]
const BLOCK_OPTIONS = [...LINE_OPTIONS, `always-multi-line`, `never-multi-line`]

/** Every family of twins: the break rule, every option the space twin takes, and the space options each break option conflicts with. */
const FAMILIES: [string, string[], Record<string, string[]>][] = [
	[`at-rule-name-newline-after`, [`always`, `always-single-line`], { "always": [`always`], "always-multi-line": [`always`] }],
	[`block-closing-brace-newline-after`, BLOCK_OPTIONS, OUTSIDE_A_BLOCK],
	[`block-closing-brace-newline-before`, BLOCK_OPTIONS, INSIDE_A_BLOCK],
	[`block-opening-brace-newline-after`, BLOCK_OPTIONS, INSIDE_A_BLOCK],
	[`block-opening-brace-newline-before`, BLOCK_OPTIONS, OUTSIDE_A_BLOCK],
	[`declaration-block-semicolon-newline-after`, LINE_OPTIONS, BEHIND_A_DELIMITER],
	[`declaration-block-semicolon-newline-before`, LINE_OPTIONS, BEHIND_A_DELIMITER],
	[`declaration-colon-newline-after`, [`always`, `never`, `always-single-line`], { "always": [`always`, `never`, `always-single-line`], "always-multi-line": [`always`, `never`] }],
	[`function-comma-newline-after`, LINE_OPTIONS, BEHIND_A_DELIMITER],
	[`function-comma-newline-before`, LINE_OPTIONS, BEHIND_A_DELIMITER],
	[`function-parentheses-newline-inside`, LINE_OPTIONS, BEHIND_A_DELIMITER],
	[`media-query-list-comma-newline-after`, LINE_OPTIONS, BEHIND_A_DELIMITER],
	[`media-query-list-comma-newline-before`, LINE_OPTIONS, BEHIND_A_DELIMITER],
	[`selector-list-comma-newline-after`, LINE_OPTIONS, BEHIND_A_DELIMITER],
	[`selector-list-comma-newline-before`, LINE_OPTIONS, BEHIND_A_DELIMITER],
	[`value-list-comma-newline-after`, LINE_OPTIONS, BEHIND_A_DELIMITER],
	[`value-list-comma-newline-before`, LINE_OPTIONS, BEHIND_A_DELIMITER],
	[`value-slash-newline-after`, LINE_OPTIONS, BEHIND_A_DELIMITER],
	[`value-slash-newline-before`, LINE_OPTIONS, BEHIND_A_DELIMITER],
]

/** A break rule and its space twin asking for different characters on every line. */
const TWINS = { "@stylistic/selector-list-comma-newline-after": `always`, "@stylistic/selector-list-comma-space-after": `always` }

/**
 * Spells a setting as a configuration reading one stylesheet hands it over.
 * @param name - The rule as configured behind `@stylistic/`, its namespace included.
 * @param value - The configured value, a primary or a whole setting opening with one.
 * @returns The setting.
 */
function setting (name: string, value: unknown): ConfiguredSetting {
	return configuredSetting(`@stylistic/${name}`, value)
}

/**
 * Lints a text and hands back the error the run stopped on.
 * @param options - As for `stylelint.lint`.
 * @returns The error, or nothing where the run went through.
 */
async function refusal (options: stylelint.LinterOptions): Promise<(Error & { code?: number }) | undefined> {
	try {
		await stylelint.lint(options)
	}
	catch (error) {
		return error as Error & { code?: number }
	}

	return undefined
}

describe(`conflictsAmong`, () => {
	it.each(FAMILIES)(`names the options of %s and its space twin that no run satisfies together, and no other`, (newlineRule, spaceOptions, conflicting) => {
		let spaceRule = newlineRule.replace(`-newline-`, `-space-`)
		let found: Record<string, string[]> = {}

		for (let newlineOption of Object.keys(conflicting)) {
			found[newlineOption] = spaceOptions.filter((spaceOption) => conflictsAmong([setting(newlineRule, newlineOption), setting(spaceRule, spaceOption)]).length === 1)
		}

		expect(found).toEqual(conflicting)
	})

	it(`finds a pair whichever of the two the configuration lists first, and names them in that order`, () => {
		let newline = setting(`selector-list-comma-newline-after`, `always`)
		let space = setting(`selector-list-comma-space-after`, `always`)

		expect(conflictsAmong([space, newline])).toEqual([{ first: space, second: newline, advice: `Set the first to "always-single-line" and the second to "always-multi-line", or turn one of them off.` }])
	})

	it(`advises the one option that has to change where the other speaks of its lines already`, () => {
		expect(conflictsAmong([setting(`value-list-comma-newline-after`, `always-multi-line`), setting(`value-list-comma-space-after`, `always`)])[0]?.advice).toBe(`Set the second to "always-single-line", or turn one of them off.`)
		expect(conflictsAmong([setting(`block-opening-brace-newline-before`, `always-single-line`), setting(`block-opening-brace-space-before`, `never`)])[0]?.advice).toBe(`Set the second to "never-multi-line", or turn one of them off.`)
	})

	it(`advises the other lines for an option that speaks of the wrong ones, and of the two ways round the one changing fewer settings`, () => {
		expect(conflictsAmong([setting(`block-opening-brace-newline-after`, `always`), setting(`block-opening-brace-space-after`, `never-multi-line`)])[0]?.advice).toBe(`Set the first to "always-multi-line" and the second to "never-single-line", or turn one of them off.`)
		expect(conflictsAmong([setting(`block-opening-brace-newline-before`, `never-single-line`), setting(`block-opening-brace-space-before`, `always`)])[0]?.advice).toBe(`Set the second to "always-multi-line", or turn one of them off.`)
	})

	it(`names no option where the two rules have none that agree, which is the colon's space rule under never`, () => {
		for (let newlineOption of [`always`, `always-multi-line`]) expect(conflictsAmong([setting(`declaration-colon-newline-after`, newlineOption), setting(`declaration-colon-space-after`, `never`)])[0]?.advice).toBe(`Change one of them, or turn one of them off.`)
	})

	it.each(FAMILIES)(`advises for %s and its space twin only options the two rules take and agree under`, (newlineRule, _spaceOptions, conflicting) => {
		let spaceRule = newlineRule.replace(`-newline-`, `-space-`)

		for (let [newlineOption, spaceOptions] of Object.entries(conflicting)) {
			for (let spaceOption of spaceOptions) {
				let advice = conflictsAmong([setting(newlineRule, newlineOption), setting(spaceRule, spaceOption)])[0]?.advice ?? ``

				// The advised options stand in quotation marks, the first setting's in front of the second's
				let advised = advice.split(`"`).filter((_part, at) => at % 2 === 1)
				let first = advice.includes(`the first to`) ? advised.shift() : newlineOption
				let second = advice.includes(`the second to`) ? advised.shift() : spaceOption

				if (first === newlineOption && second === spaceOption) expect(`${spaceRule}: ${spaceOption}`).toBe(`declaration-colon-space-after: never`)
				else expect(conflictsAmong([setting(newlineRule, first), setting(spaceRule, second)])).toEqual([])
			}
		}
	})

	it.each([
		[`block-closing-brace-newline-before`, [`never-multi-line`]],
		[`block-closing-brace-space-before`, [`always`, `never`, `always-multi-line`, `never-multi-line`]],
		[`max-empty-lines`, [0]],
	])(`finds the empty line in front of a closing brace conflicting with %s`, (rule, options) => {
		let emptyLine = setting(`block-closing-brace-empty-line-before`, `always-multi-line`)

		for (let option of options) expect(conflictsAmong([emptyLine, setting(rule, option)])).toHaveLength(1)

		expect(conflictsAmong([setting(`block-closing-brace-empty-line-before`, `never`), setting(rule, options[0])])).toEqual([])
	})

	it(`leaves the empty line beside the options that have room for it`, () => {
		let emptyLine = setting(`block-closing-brace-empty-line-before`, `always-multi-line`)

		expect(conflictsAmong([emptyLine, setting(`block-closing-brace-newline-before`, `always`), setting(`block-closing-brace-space-before`, `always-single-line`), setting(`max-empty-lines`, 1)])).toEqual([])
	})

	// A reversal under `never` asks for the empty line on the blocks it reaches, and the empty line makes the block multi-line, so what leaves no room for one leaves no room for the reversal either
	it.each([
		[`after-closing-brace`, [`never`, { except: [`after-closing-brace`] }]],
		[`last-nested`, [`never`, { except: [`last-nested`] }]],
		[`both reversals named`, [`never`, { except: [`after-closing-brace`, `last-nested`] }]],
		[`one reversal written as a bare string`, [`never`, { except: `after-closing-brace` }]],
	])(`finds the empty line the reversal %s stands behind conflicting with every partner that leaves no room for one`, (_reversal, value) => {
		for (let [rule, options] of [
			[`block-closing-brace-newline-before`, [`never-multi-line`]],
			[`block-closing-brace-space-before`, [`always`, `never`, `always-multi-line`, `never-multi-line`]],
			[`max-empty-lines`, [0]],
		] as [string, unknown[]][]) {
			for (let option of options) expect(conflictsAmong([setting(`block-closing-brace-empty-line-before`, value), setting(rule, option)])).toHaveLength(1)
		}
	})

	it(`names the primary alone in the message, the secondaries behind it being the rule's own`, () => {
		let found = conflictsAmong([setting(`block-closing-brace-empty-line-before`, [`never`, { except: [`after-closing-brace`] }]), setting(`max-empty-lines`, 0)])

		expect(conflictsError(found).message).toBe([
			`Conflicting settings:`,
			`  "@stylistic/block-closing-brace-empty-line-before": "never"`,
			`  "@stylistic/max-empty-lines": 0`,
			`Change one of them, or turn one of them off.`,
		].join(`\n`))
	})

	// A break rule's `always` is met by the break an empty line ends in, a space rule's `always-single-line` asks nothing of a block the line made multi-line, and `max-empty-lines: 1` allows the one line asked for
	it.each([
		[`as never alone`, `never`],
		[`as never turned over`, [`never`, { except: [`after-closing-brace`] }]],
	])(`leaves the empty line %s beside the neighbors that meet it`, (_asked, value) => {
		for (let [rule, option] of [
			[`block-closing-brace-newline-before`, `always`],
			[`block-closing-brace-space-before`, `always-single-line`],
			[`max-empty-lines`, 1],
		] as [string, unknown][]) expect(conflictsAmong([setting(`block-closing-brace-empty-line-before`, value), setting(rule, option)])).toEqual([])
	})

	it.each([`declaration-block-semicolon-newline-before`, `declaration-block-semicolon-space-before`, `function-comma-newline-before`, `function-comma-space-before`, `function-parentheses-newline-inside`, `function-parentheses-space-inside`, `value-list-comma-newline-before`, `value-list-comma-space-before`, `value-slash-newline-before`, `value-slash-space-before`])(`finds whitespace forbidden behind a call conflicting with every always of %s`, (rule) => {
		let never = setting(`function-whitespace-after`, `never`)
		let lines = rule.includes(`-newline-`) ? `multi` : `single`

		expect(conflictsAmong([never, setting(rule, `always`)])).toHaveLength(1)
		expect(conflictsAmong([setting(rule, `always-${lines}-line`), never])).toHaveLength(1)
		expect(conflictsAmong([never, setting(rule, `never`)])).toEqual([])
		expect(conflictsAmong([setting(`function-whitespace-after`, `always`), setting(rule, `always`)])).toEqual([])
	})

	it(`reads a break rule under one namespace and its space twin under another as the pair they are`, () => {
		expect(conflictsAmong([setting(`at-rule-name-newline-after`, `always`), setting(`less/at-rule-name-space-after`, `always`)])).toHaveLength(1)
	})

	it(`passes the pairs that meet over a delimiter at the edge of its container alone`, () => {
		expect(conflictsAmong([
			setting(`declaration-colon-space-after`, `always`),
			setting(`value-list-comma-space-before`, `never`),
			setting(`value-slash-space-before`, `never`),
			setting(`declaration-bang-space-before`, `always`),
			setting(`function-parentheses-space-inside`, `never`),
			setting(`function-comma-space-before`, `never`),
			setting(`function-comma-space-after`, `always`),
		])).toEqual([])
	})

	it(`passes an option the rule itself refuses`, () => {
		expect(conflictsAmong([setting(`selector-list-comma-newline-after`, `sometimes`), setting(`selector-list-comma-space-after`, `always`)])).toEqual([])
	})

	it(`spells every pair as the configuration does, a blank line between two of them`, () => {
		let found = conflictsAmong([setting(`scss/value-list-comma-newline-after`, `always-multi-line`), setting(`scss/value-list-comma-space-after`, `always`), setting(`block-closing-brace-empty-line-before`, `always-multi-line`), setting(`max-empty-lines`, 0)])

		expect(conflictsError(found).message).toBe([
			`Conflicting settings:`,
			`  "@stylistic/scss/value-list-comma-newline-after": "always-multi-line"`,
			`  "@stylistic/scss/value-list-comma-space-after": "always"`,
			`Set the second to "always-single-line", or turn one of them off.`,
			``,
			`Conflicting settings:`,
			`  "@stylistic/block-closing-brace-empty-line-before": "always-multi-line"`,
			`  "@stylistic/max-empty-lines": 0`,
			`Change one of them, or turn one of them off.`,
		].join(`\n`))
	})
})

describe(`a configuration holding conflicting settings`, () => {
	it.each([
		[`in a run that only checks`, false],
		[`in a run that may write`, true],
	])(`stops the run with the code of a configuration error, %s`, async (_run, fix) => {
		let error = await refusal({ code: `a, b {}`, config: { plugins, rules: TWINS }, fix })

		expect(error?.code).toBe(78)
		expect(error?.message).toBe(`Conflicting settings:\n  "@stylistic/selector-list-comma-newline-after": "always"\n  "@stylistic/selector-list-comma-space-after": "always"\nSet the first to "always-multi-line" and the second to "always-single-line", or turn one of them off.`)
	})

	it(`stops it over a stylesheet neither rule has anything to say about`, async () => {
		expect((await refusal({ code: `a {}`, config: { plugins, rules: TWINS } }))?.code).toBe(78)
	})

	// The empty line a reversal under `never` stands behind has no file beside any refuser, and which of the two rules the configuration lists first used to decide what the file became
	it.each([
		[`block-closing-brace-newline-before`, `never-multi-line`],
		[`block-closing-brace-space-before`, `always`],
		[`max-empty-lines`, 0],
	])(`stops the run over the empty line the reversal asks for, %s listed either way round`, async (refuser, option) => {
		let emptyLine = { "@stylistic/block-closing-brace-empty-line-before": [`never`, { except: [`after-closing-brace`] }] }
		let neighbor = { [`@stylistic/${refuser}`]: option }

		let errors = await Promise.all([{ ...emptyLine, ...neighbor }, { ...neighbor, ...emptyLine }].flatMap((rules) => [false, true].map(async (fix) => await refusal({ code: `a {\n\nb { color: red }\n\n}\n`, config: { plugins, rules }, fix }))))

		expect(errors.map((error) => error?.code)).toEqual([78, 78, 78, 78])
		for (let error of errors) expect(error?.message).toContain(`"@stylistic/block-closing-brace-empty-line-before": "never"`)
	})

	it(`writes no file to fix under --fix, the run stopping before a rule reads it`, async () => {
		let directory = mkdtempSync(path.join(tmpdir(), `conflicting-`))
		let file = path.join(directory, `a.css`)
		let rules = { "@stylistic/block-closing-brace-empty-line-before": [`never`, { except: [`after-closing-brace`] }], "@stylistic/max-empty-lines": 0 }
		let before = `a {\n\nb { color: red }\n\n}\n`

		writeFileSync(file, before)

		try {
			expect((await refusal({ files: file, config: { plugins, rules }, fix: true }))?.code).toBe(78)
			expect(readFileSync(file, `utf8`)).toBe(before)
		}
		finally {
			rmSync(directory, { recursive: true, force: true })
		}
	})

	it(`passes the neighbors the empty line a reversal asks for has room beside`, async () => {
		let emptyLine = { "@stylistic/block-closing-brace-empty-line-before": [`never`, { except: [`after-closing-brace`] }] }

		let errors = await Promise.all([[`block-closing-brace-newline-before`, `always`], [`block-closing-brace-space-before`, `always-single-line`], [`max-empty-lines`, 1]].map(async ([refuser, option]) => await refusal({ code: `a { color: red }`, config: { plugins, rules: { ...emptyLine, [`@stylistic/${refuser}`]: option } } })))

		expect(errors).toEqual([undefined, undefined, undefined])
	})

	it(`reads the settings a secondary option, a severity or a fix turned off stand beside`, async () => {
		let rules = { "@stylistic/selector-list-comma-newline-after": [`always`, { severity: `warning` }], "@stylistic/selector-list-comma-space-after": [`always`, { disableFix: true }] }

		expect((await refusal({ code: `a, b {}`, config: { plugins, rules } }))?.code).toBe(78)
	})

	it.each([
		[`by a bare null`, null],
		[`by a null opening its array`, [null]],
	])(`passes a rule that is turned off %s, a twin and a copy under another namespace alike`, async (_spelling, off) => {
		let rules = { "@stylistic/selector-list-comma-newline-after": `always`, "@stylistic/selector-list-comma-space-after": off }

		expect(await refusal({ code: `a,\nb {}`, config: { plugins, rules } })).toBeUndefined()
		expect(await refusal({ code: `a { b: 1PX }`, config: { plugins, rules: { "@stylistic/scss/unit-case": `upper`, "@stylistic/unit-case": off } } })).toBeUndefined()
	})

	it(`reads the configuration as Stylelint merged it for the file, a pair put together by an override included`, async () => {
		let config = { plugins, rules: { "@stylistic/selector-list-comma-newline-after": `always` }, overrides: [{ files: [`**/*.css`], rules: { "@stylistic/selector-list-comma-space-after": `always` } }] }

		expect((await refusal({ code: `a,\nb {}`, codeFilename: `a.css`, config }))?.code).toBe(78)
		expect(await refusal({ code: `a,\nb {}`, codeFilename: `a.pcss`, config })).toBeUndefined()
	})

	it(`reads what the configuration extends`, async () => {
		let directory = mkdtempSync(path.join(tmpdir(), `conflicting-`))
		let base = path.join(directory, `base.config.mjs`)

		writeFileSync(base, `export default { rules: { "@stylistic/selector-list-comma-newline-after": "always" } }\n`)

		try {
			expect((await refusal({ code: `a,\nb {}`, config: { "extends": [base], plugins, "rules": { "@stylistic/selector-list-comma-space-after": `always` } } }))?.code).toBe(78)
			expect(await refusal({ code: `a, b {}`, config: { "extends": [base], plugins, "rules": { "@stylistic/selector-list-comma-space-after": `always`, "@stylistic/selector-list-comma-newline-after": null } } })).toBeUndefined()
		}
		finally {
			rmSync(directory, { recursive: true, force: true })
		}
	})

	it(`passes two settings that meet over a delimiter at the edge of its container alone, where the comma rule leaves the run to the parentheses rule`, async () => {
		let rules = { "@stylistic/function-comma-space-after": `never`, "@stylistic/function-parentheses-space-inside": `always` }
		let { results } = await stylelint.lint({ code: `a { b: var( --x, ) }`, config: { plugins, rules } })

		expect(results[0]?.warnings).toEqual([])
	})

	it(`asks only the copy of each rule that reads the stylesheet, so two copies of one rule never meet, and a twin under another namespace meets the core's only where it reads the root`, async () => {
		expect(await refusal({ code: `a { b: 1px }`, config: { plugins, rules: { "@stylistic/scss/unit-case": `upper`, "@stylistic/unit-case": `lower` } } })).toBeUndefined()
		expect(await refusal({ code: `a { b: 1px }`, config: { plugins, rules: { "@stylistic/scss/unit-case": `upper`, "@stylistic/less/unit-case": `lower` } } })).toBeUndefined()

		let twins = { "@stylistic/selector-list-comma-newline-after": `always`, "@stylistic/scss/selector-list-comma-space-after": `always` }

		expect((await refusal({ code: `a, b {}`, config: { plugins, rules: twins } }))?.code).toBe(78)
		expect(await refusal({ code: `a, b {}`, config: { plugins, rules: { ...twins, "@stylistic/selector-list-comma-space-after": `always-single-line` } } })).toBeUndefined()
		expect(await refusal({ code: `a, b {}`, config: { plugins, rules: twins, customSyntax: scss } })).toBeUndefined()
	})
})
