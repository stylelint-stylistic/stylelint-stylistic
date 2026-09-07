import { type Declaration, parse, type Rule } from "postcss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { css } from "../../syntaxes/css/index.ts"

import { closedBySemicolon, trailingSemicolonAsked, valueAsClosed } from "./index.ts"

const TRAILING = `@stylistic/declaration-block-trailing-semicolon`

describe(`trailingSemicolonAsked`, () => {
	it(`a configuration listing the rule under neither of its options, or not at all`, () => {
		expect(asked(`a { b: }`, {})).toBeUndefined()
		expect(asked(`a { b: }`, { "@stylistic/color-hex-case": `lower` })).toBeUndefined()
		expect(asked(`a { b: }`, { [TRAILING]: `sometimes` })).toBeUndefined()
	})

	it(`a live always, which closes the last declaration of a block whether the file writes a semicolon behind it or not`, () => {
		expect(asked(`a { b: }`, { [TRAILING]: `always` })).toBe(true)
		expect(asked(`a { b: ; }`, { [TRAILING]: `always` })).toBe(true)
		expect(asked(`a { b: ; /*c*/ }`, { [TRAILING]: `always` })).toBe(true)
	})

	it(`a live never, behind which no semicolon stands whether the file writes one to take away or none`, () => {
		expect(asked(`a { b: ; }`, { [TRAILING]: `never` })).toBe(false)
		expect(asked(`a { b: }`, { [TRAILING]: `never` })).toBe(false)
	})

	it(`a rule whose fix the configuration turned off, which reports and moves nothing`, () => {
		expect(asked(`a { b: }`, { [TRAILING]: [`always`, { disableFix: true }] })).toBeUndefined()
	})

	it(`a rule a disable comment silences over the declaration, whose fix Stylelint then declines, and one the configuration reads past such comments`, () => {
		expect(trailingSemicolonAsked(css, declarationOf(`a { b: }`, -1), disabled({ [TRAILING]: `always` }, { [TRAILING]: [{ start: 1 }] }))).toBeUndefined()
		expect(trailingSemicolonAsked(css, declarationOf(`a { b: }`, -1), disabled({ [TRAILING]: `always` }, { all: [{ start: 1, end: 1 }] }))).toBeUndefined()
		expect(trailingSemicolonAsked(css, declarationOf(`a { b: }`, -1), disabled({ [TRAILING]: `always` }, { [TRAILING]: [{ start: 2 }] }))).toBe(true)
		expect(trailingSemicolonAsked(css, declarationOf(`a { b: }`, -1), disabled({ [TRAILING]: `always` }, { [TRAILING]: [{ start: 1 }] }, true))).toBe(true)
	})

	it(`a secondary option the rule refuses, under which it runs no check at all`, () => {
		expect(asked(`a { b: }`, { [TRAILING]: [`always`, { ignore: `bogus` }] })).toBeUndefined()
		expect(asked(`a { b: }`, { [TRAILING]: [`always`, { ignored: `single-declaration` }] })).toBeUndefined()
		expect(asked(`a { c: red; b: }`, { [TRAILING]: [`always`, { ignore: [`single-declaration`], severity: `warning` }] })).toBe(true)
	})

	it(`a block of one declaration the rule is told to pass over, and one of two it is not`, () => {
		expect(asked(`a { b: }`, { [TRAILING]: [`always`, { ignore: `single-declaration` }] })).toBeUndefined()
		expect(asked(`a { c: red; b: }`, { [TRAILING]: [`always`, { ignore: `single-declaration` }] })).toBe(true)
	})

	it(`a declaration that is not the one its block ends on, whose semicolon the rule is not about`, () => {
		expect(asked(`a { b: ; c: red }`, { [TRAILING]: `never` }, 0)).toBeUndefined()
	})

	it(`a declaration standing at the top level of a stylesheet, which ends no declaration block`, () => {
		expect(trailingSemicolonAsked(css, parse(`b: `).first as Declaration, result({ [TRAILING]: `always` }))).toBeUndefined()
	})

	it(`a custom property a comment stands behind, whose semicolon PostCSS writes whatever the flag says, so never takes nothing away`, () => {
		expect(asked(`a { --b: ; /*c*/ }`, { [TRAILING]: `never` })).toBeUndefined()
		expect(asked(`a { --b: ; }`, { [TRAILING]: `never` })).toBe(false)
	})
})

describe(`closedBySemicolon`, () => {
	it(`the file as it stands, where the rule is not configured`, () => {
		expect(closed(`a { b: ; }`, {})).toBe(true)
		expect(closed(`a { b: }`, {})).toBe(false)
		expect(closed(`a { b: /*c*/ }`, {})).toBe(false)
	})

	// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/536
	it(`the file as the rule will leave it, whichever way it stands`, () => {
		expect(closed(`a { b: }`, { [TRAILING]: `always` })).toBe(true)
		expect(closed(`a { b: ; }`, { [TRAILING]: `never` })).toBe(false)
	})
})

describe(`valueAsClosed`, () => {
	it(`the value as it stands, where no live never is to take the run in front of the semicolon away`, () => {
		expect(value(`a { b: ; }`, {})).toBe(` `)
		expect(value(`a { b: ; }`, { [TRAILING]: `always` })).toBe(` `)
		expect(value(`a { b: ; }`, { [TRAILING]: [`never`, { disableFix: true }] })).toBe(` `)
		expect(value(`a { b: }`, { [TRAILING]: `never` })).toBe(``)
	})

	// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/536
	it(`the value less the run a live never takes away with the semicolon`, () => {
		expect(value(`a { b: ; }`, { [TRAILING]: `never` })).toBe(``)
		expect(value(`a { b:  ; }`, { [TRAILING]: `never` })).toBe(``)
		expect(value(`a { b: x ; }`, { [TRAILING]: `never` })).toBe(`x`)
		expect(value(`a { --b: /*c*/ ; }`, { [TRAILING]: `never` })).toBe(` /*c*/`)
	})

	it(`a flag behind the value, whose raw is what never trims and the value stays as it is`, () => {
		expect(value(`a { b: x !important ; }`, { [TRAILING]: `never` })).toBe(`x`)
	})
})

/**
 * Asks what the trailing-semicolon rule will leave behind a declaration of a stylesheet's first rule, the last one unless told otherwise.
 * @param code - The stylesheet.
 * @param rules - The rules the configuration lists.
 * @param [index] - Which declaration of the rule to ask about, counted from the front.
 * @returns What `trailingSemicolonAsked` answers.
 */
function asked (code: string, rules: Record<string, unknown>, index: number = -1): boolean | undefined {
	return trailingSemicolonAsked(css, declarationOf(code, index), result(rules))
}

/**
 * Asks whether a semicolon closes the last declaration of a stylesheet's first rule.
 * @param code - The stylesheet.
 * @param rules - The rules the configuration lists.
 * @returns What `closedBySemicolon` answers.
 */
function closed (code: string, rules: Record<string, unknown>): boolean {
	return closedBySemicolon(css, declarationOf(code, -1), result(rules))
}

/**
 * Reads the value of the last declaration of a stylesheet's first rule as the trailing-semicolon rule will leave it.
 * @param code - The stylesheet.
 * @param rules - The rules the configuration lists.
 * @returns The value.
 */
function value (code: string, rules: Record<string, unknown>): string {
	return valueAsClosed(css, declarationOf(code, -1), result(rules))
}

/**
 * Parses a stylesheet and picks a declaration of its first rule.
 * @param code - The stylesheet.
 * @param index - Which declaration to pick, counted from the front, or from the back where negative.
 * @returns The declaration.
 */
function declarationOf (code: string, index: number): Declaration {
	let rule = parse(code).first as Rule
	let declarations = rule.nodes.filter((node) => node.type === `decl`)

	return declarations.at(index) as Declaration
}

/**
 * Builds the least of a Stylelint result that holds a configuration.
 * @param rules - The rules the configuration lists.
 * @returns The result.
 */
function result (rules: Record<string, unknown>): PostcssResult {
	return { stylelint: { config: { rules } } } as unknown as PostcssResult
}

/**
 * Builds the least of a Stylelint result that holds a configuration and the ranges disable comments opened.
 * @param rules - The rules the configuration lists.
 * @param disabledRanges - The ranges, by the rule name a comment opened them under.
 * @param [ignoreDisables] - Whether the configuration ignores the disable comments.
 * @returns The result.
 */
function disabled (rules: Record<string, unknown>, disabledRanges: Record<string, object[]>, ignoreDisables?: boolean): PostcssResult {
	return { stylelint: { config: { rules, ignoreDisables }, disabledRanges } } as unknown as PostcssResult
}
