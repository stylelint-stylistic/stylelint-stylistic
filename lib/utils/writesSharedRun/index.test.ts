import { type Declaration, parse, type Rule } from "postcss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { css } from "../../syntaxes/css/index.ts"
import type { Syntax } from "../../syntaxes/index.ts"

import { sharesRunWithSemicolon, writesSharedRun } from "./index.ts"

const COLON_SPACE = `@stylistic/declaration-colon-space-after`
const COLON_NEWLINE = `@stylistic/declaration-colon-newline-after`
const SEMICOLON_SPACE = `@stylistic/declaration-block-semicolon-space-before`
const SEMICOLON_NEWLINE = `@stylistic/declaration-block-semicolon-newline-before`

describe(`writesSharedRun`, () => {
	it(`a declaration whose value has a word of its own, whose two runs are two`, () => {
		let rules = { [COLON_SPACE]: `always`, [SEMICOLON_SPACE]: `never` }

		expect(ask(`a { b: c ; }`, rules, COLON_SPACE)).toBe(true)
		expect(ask(`a { b: c ; }`, rules, SEMICOLON_SPACE)).toBe(true)
	})

	it(`a declaration carrying a flag, whose semicolon's run is the end of the flag's raw`, () => {
		let rules = { [COLON_SPACE]: `always`, [SEMICOLON_SPACE]: `never` }

		expect(ask(`a { b: !important ; }`, rules, COLON_SPACE)).toBe(true)
		expect(ask(`a { b: !important ; }`, rules, SEMICOLON_SPACE)).toBe(true)
	})

	it(`the last declaration of a block where the file writes no semicolon behind it, which the semicolon rules pass over`, () => {
		expect(ask(`a { b: }`, { [COLON_SPACE]: `always`, [SEMICOLON_SPACE]: `never` }, COLON_SPACE)).toBe(true)
	})

	it(`a configuration listing the asking rule alone, or none of the four`, () => {
		expect(ask(`a { b: ; }`, { [COLON_SPACE]: `always` }, COLON_SPACE)).toBe(true)
		expect(ask(`a { b: ; }`, { "@stylistic/color-hex-case": `lower` }, SEMICOLON_SPACE)).toBe(true)
		expect(ask(`a { b: ; }`, {}, SEMICOLON_NEWLINE)).toBe(true)
	})

	it(`a rule that is none of the four`, () => {
		expect(ask(`a { b: ; }`, { [COLON_SPACE]: `always`, [SEMICOLON_SPACE]: `never` }, `@stylistic/color-hex-case`)).toBe(true)
	})

	it(`the rule the configuration lists later, where the two ask for different things of one run`, () => {
		let colonFirst = { [COLON_SPACE]: `always`, [SEMICOLON_SPACE]: `never` }
		let semicolonFirst = { [SEMICOLON_SPACE]: `never`, [COLON_SPACE]: `always` }

		expect(ask(`a { b: ; }`, colonFirst, COLON_SPACE)).toBe(false)
		expect(ask(`a { b: ; }`, colonFirst, SEMICOLON_SPACE)).toBe(true)
		expect(ask(`a { b: ; }`, semicolonFirst, COLON_SPACE)).toBe(true)
		expect(ask(`a { b: ; }`, semicolonFirst, SEMICOLON_SPACE)).toBe(false)
	})

	it(`both rules, where the two ask for the same thing`, () => {
		expect(ask(`a { b:; }`, { [COLON_SPACE]: `always`, [SEMICOLON_SPACE]: `always` }, COLON_SPACE)).toBe(true)
		expect(ask(`a { b:; }`, { [COLON_SPACE]: `always`, [SEMICOLON_SPACE]: `always` }, SEMICOLON_SPACE)).toBe(true)
		expect(ask(`a { b: ; }`, { [COLON_NEWLINE]: `always`, [SEMICOLON_NEWLINE]: `always` }, COLON_NEWLINE)).toBe(true)
		expect(ask(`a { b: ; }`, { [COLON_NEWLINE]: `always`, [SEMICOLON_NEWLINE]: `always` }, SEMICOLON_NEWLINE)).toBe(true)
		expect(ask(`a {\n\tb: ;\n}`, { [COLON_SPACE]: `never`, [SEMICOLON_NEWLINE]: `never-multi-line` }, COLON_SPACE)).toBe(true)
		expect(ask(`a {\n\tb: ;\n}`, { [COLON_SPACE]: `never`, [SEMICOLON_NEWLINE]: `never-multi-line` }, SEMICOLON_NEWLINE)).toBe(true)
	})

	it(`the space rule and the newline rule of one end, which ask for different things`, () => {
		expect(ask(`a { b: ; }`, { [COLON_NEWLINE]: `always`, [SEMICOLON_SPACE]: `always` }, COLON_NEWLINE)).toBe(false)
		expect(ask(`a { b: ; }`, { [COLON_NEWLINE]: `always`, [SEMICOLON_SPACE]: `always` }, SEMICOLON_SPACE)).toBe(true)
		expect(ask(`a { b: ; }`, { [SEMICOLON_NEWLINE]: `always`, [COLON_SPACE]: `always` }, SEMICOLON_NEWLINE)).toBe(false)
		expect(ask(`a { b: ; }`, { [SEMICOLON_NEWLINE]: `always`, [COLON_SPACE]: `always` }, COLON_SPACE)).toBe(true)
	})

	it(`the run behind a comment on the colon's line, which the newline rule of the colon reads and the space rule does not`, () => {
		expect(ask(`a { b: /*c*/ ; }`, { [COLON_NEWLINE]: `always`, [SEMICOLON_SPACE]: `never` }, COLON_NEWLINE)).toBe(false)
		expect(ask(`a { b: /*c*/ ; }`, { [COLON_NEWLINE]: `always`, [SEMICOLON_SPACE]: `never` }, SEMICOLON_SPACE)).toBe(true)
		expect(ask(`a { b: /*c*/ ; }`, { [COLON_SPACE]: `always`, [SEMICOLON_SPACE]: `never` }, COLON_SPACE)).toBe(true)
		expect(ask(`a { b: /*c*/ ; }`, { [SEMICOLON_SPACE]: `never`, [COLON_SPACE]: `always` }, SEMICOLON_SPACE)).toBe(true)
	})

	it(`a value holding two comments, or a word behind the comment, whose run behind the first comment is nobody else's`, () => {
		expect(ask(`a { b: /*c*/ /*d*/ ; }`, { [COLON_NEWLINE]: `always`, [SEMICOLON_SPACE]: `never` }, COLON_NEWLINE)).toBe(true)
		expect(ask(`a { b: /*c*/ d ; }`, { [COLON_NEWLINE]: `always`, [SEMICOLON_SPACE]: `never` }, COLON_NEWLINE)).toBe(true)
	})

	it(`a never option of the semicolon space rule on a custom property, which leaves a single space alone and so accepts the space rule of the colon`, () => {
		expect(ask(`a { --b:; }`, { [COLON_SPACE]: `always`, [SEMICOLON_SPACE]: `never` }, COLON_SPACE)).toBe(true)
		expect(ask(`a { b:; }`, { [COLON_SPACE]: `always`, [SEMICOLON_SPACE]: `never` }, COLON_SPACE)).toBe(false)
		expect(ask(`a { --b:; }`, { [COLON_NEWLINE]: `always`, [SEMICOLON_SPACE]: `never` }, COLON_NEWLINE)).toBe(false)
		expect(ask(`a { --b:  ; }`, { [SEMICOLON_SPACE]: `never`, [COLON_SPACE]: `always` }, SEMICOLON_SPACE)).toBe(true)
	})

	it(`the never option of the semicolon newline rule, which leaves a single space alone on every declaration`, () => {
		expect(ask(`a {\n\tb:;\n}`, { [COLON_SPACE]: `always`, [SEMICOLON_NEWLINE]: `never-multi-line` }, COLON_SPACE)).toBe(true)
		expect(ask(`a {\n\t--b:;\n}`, { [COLON_SPACE]: `always`, [SEMICOLON_NEWLINE]: `never-multi-line` }, COLON_SPACE)).toBe(true)
		expect(ask(`a {\n\tb:;\n}`, { [COLON_NEWLINE]: `always`, [SEMICOLON_NEWLINE]: `never-multi-line` }, COLON_NEWLINE)).toBe(false)
	})

	it(`a declaration the colon rules do not read, which shares its run with nobody`, () => {
		expect(ask(`a { $x: ; }`, { [SEMICOLON_SPACE]: `never`, [COLON_SPACE]: `always` }, SEMICOLON_SPACE)).toBe(true)
		expect(ask(`a { b: ; }`, { [SEMICOLON_SPACE]: `never`, [COLON_SPACE]: `always` }, SEMICOLON_SPACE, { ...css, isStandardDeclaration: () => false })).toBe(true)
	})

	it(`a block the asking rule's break puts over several lines, which wakes the neighbour's multi-line option`, () => {
		expect(ask(`a { b:; }`, { [COLON_NEWLINE]: `always`, [SEMICOLON_NEWLINE]: `never-multi-line` }, COLON_NEWLINE)).toBe(false)
		expect(ask(`a { b:; }`, { [SEMICOLON_NEWLINE]: `never-multi-line`, [COLON_NEWLINE]: `always` }, COLON_NEWLINE)).toBe(true)
	})

	it(`the rule listed last, which writes whatever its own write does to the block, since nothing behind it can rewrite`, () => {
		expect(ask(`a { b:\n; }`, { [COLON_NEWLINE]: `always`, [SEMICOLON_NEWLINE]: `never-multi-line` }, SEMICOLON_NEWLINE)).toBe(true)
		expect(ask(`a {\n\tb:\n;\n}`, { [COLON_NEWLINE]: `always`, [SEMICOLON_NEWLINE]: `never-multi-line` }, SEMICOLON_NEWLINE)).toBe(true)
	})

	it(`three rules, where a rule ahead of two contradicting ones writes only what both accept`, () => {
		let rules = { [COLON_SPACE]: `always`, [SEMICOLON_SPACE]: `never`, [SEMICOLON_NEWLINE]: `never-multi-line` }

		expect(ask(`a {\n\tb: ;\n}`, rules, COLON_SPACE)).toBe(false)
		expect(ask(`a {\n\tb: ;\n}`, rules, SEMICOLON_SPACE)).toBe(true)
		expect(ask(`a {\n\tb:;\n}`, { [COLON_SPACE]: `always`, [SEMICOLON_NEWLINE]: `never-multi-line`, [SEMICOLON_SPACE]: `never` }, COLON_SPACE)).toBe(false)
	})

	it(`four rules, where each is asked about every rule behind it and not about one of them`, () => {
		let rules = { [SEMICOLON_SPACE]: `never-single-line`, [COLON_NEWLINE]: `always`, [COLON_SPACE]: `always-single-line`, [SEMICOLON_NEWLINE]: `always-multi-line` }

		expect(ask(`a { b: ; }`, rules, SEMICOLON_SPACE)).toBe(false)
		expect(ask(`a { b: ; }`, rules, COLON_NEWLINE)).toBe(false)
		expect(ask(`a { b:; }`, rules, COLON_SPACE)).toBe(true)
	})

	it(`a single-line option the break of the rule behind silences, whose write costs the file nothing`, () => {
		expect(ask(`a { b: ; }`, { [SEMICOLON_SPACE]: `never-single-line`, [COLON_NEWLINE]: `always` }, SEMICOLON_SPACE)).toBe(true)
		expect(ask(`a { b:; }`, { [SEMICOLON_SPACE]: `always-single-line`, [COLON_NEWLINE]: `always` }, SEMICOLON_SPACE)).toBe(true)
		expect(ask(`a { b: ; }`, { [SEMICOLON_SPACE]: `never`, [COLON_NEWLINE]: `always` }, SEMICOLON_SPACE)).toBe(false)
	})

	it(`the value of a custom property, which the semicolon rule's break puts over several lines and the colon's single-line option falls silent about`, () => {
		expect(ask(`a { --b: ; }`, { [SEMICOLON_NEWLINE]: `always`, [COLON_SPACE]: `always-single-line` }, SEMICOLON_NEWLINE)).toBe(true)
		expect(ask(`a { b: ; }`, { [SEMICOLON_NEWLINE]: `always`, [COLON_SPACE]: `always-single-line` }, SEMICOLON_NEWLINE)).toBe(false)
		expect(ask(`a { --b: ; }`, { [SEMICOLON_NEWLINE]: `always`, [COLON_SPACE]: `always` }, SEMICOLON_NEWLINE)).toBe(false)
	})

	it(`the same value under the break of the other colon rule, which lands in the raw between and not in the value, so the single-line option behind still speaks and the break is not written`, () => {
		expect(ask(`a { --b: ; }`, { [COLON_NEWLINE]: `always`, [COLON_SPACE]: `always-single-line` }, COLON_NEWLINE)).toBe(false)
		expect(ask(`a { --b: ; }`, { [COLON_SPACE]: `always-single-line`, [COLON_NEWLINE]: `always` }, COLON_SPACE)).toBe(true)
	})

	it(`a neighbour silent about the block as the asking rule leaves it`, () => {
		expect(ask(`a { b:\n; }`, { [COLON_SPACE]: `always`, [SEMICOLON_SPACE]: `never-single-line` }, COLON_SPACE)).toBe(false)
		expect(ask(`a { b:\n; top: 0;\n}`, { [COLON_SPACE]: `always`, [SEMICOLON_SPACE]: `never-single-line` }, COLON_SPACE)).toBe(true)
	})

	it(`the run at the head of a value carrying a flag, which the two colon rules share between themselves and the semicolon rules do not`, () => {
		expect(ask(`a { b: !important ; }`, { [COLON_NEWLINE]: `always`, [COLON_SPACE]: `always` }, COLON_NEWLINE)).toBe(false)
		expect(ask(`a { b: !important ; }`, { [COLON_NEWLINE]: `always`, [COLON_SPACE]: `always` }, COLON_SPACE)).toBe(true)
		expect(ask(`a { b: !important ; }`, { [COLON_SPACE]: `always`, [COLON_NEWLINE]: `always` }, COLON_SPACE)).toBe(false)
		expect(ask(`a { b: !important ; }`, { [COLON_SPACE]: `always`, [COLON_NEWLINE]: `always` }, COLON_NEWLINE)).toBe(true)
	})

	it(`the same head run on a value carrying a word, and a semicolon rule listed among the two, which reads no run of theirs`, () => {
		expect(ask(`a { b:  c; }`, { [COLON_NEWLINE]: `always`, [COLON_SPACE]: `always` }, COLON_NEWLINE)).toBe(false)
		expect(ask(`a { b:  c; }`, { [COLON_NEWLINE]: `always`, [SEMICOLON_SPACE]: `never`, [COLON_SPACE]: `always` }, COLON_NEWLINE)).toBe(false)
		expect(ask(`a { b:  c ; }`, { [COLON_SPACE]: `always`, [SEMICOLON_SPACE]: `never` }, COLON_SPACE)).toBe(true)
		expect(ask(`a { b: // c\n; }`, { [COLON_NEWLINE]: `always`, [COLON_SPACE]: `always` }, COLON_NEWLINE)).toBe(false)
	})

	it(`a block comment standing right on the colon, which parts the two colon rules' runs`, () => {
		expect(ask(`a { b: /*c*/ x; }`, { [COLON_NEWLINE]: `always`, [COLON_SPACE]: `never` }, COLON_SPACE)).toBe(true)
		expect(ask(`a { b: /*c*/ x; }`, { [COLON_NEWLINE]: `always`, [COLON_SPACE]: `never` }, COLON_NEWLINE)).toBe(true)
	})

	it(`a rule behind whose fix the configuration turned off, which reports the run and cannot rewrite it, so it gates nothing`, () => {
		expect(ask(`a { b:\n; }`, { [COLON_SPACE]: `always`, [SEMICOLON_SPACE]: [`never`, { disableFix: true }] }, COLON_SPACE)).toBe(true)
		expect(ask(`a { b:\n; }`, { [COLON_SPACE]: `always`, [SEMICOLON_SPACE]: `never` }, COLON_SPACE)).toBe(false)
		expect(ask(`a { b: !important ; }`, { [COLON_NEWLINE]: `always`, [COLON_SPACE]: [`always`, { disableFix: true }] }, COLON_NEWLINE)).toBe(true)
	})

	it(`the rules of the asking rule's own namespace, and not the core's`, () => {
		let scss: Syntax = { ...css, namespace: `scss` }

		expect(ask(`a { b: ; }`, { [COLON_SPACE]: `always`, [SEMICOLON_SPACE]: `never` }, `@stylistic/scss/declaration-colon-space-after`, scss)).toBe(true)
		expect(ask(`a { b: ; }`, { "@stylistic/scss/declaration-colon-space-after": `always`, "@stylistic/scss/declaration-block-semicolon-space-before": `never` }, `@stylistic/scss/declaration-colon-space-after`, scss)).toBe(false)
		expect(ask(`a { b: ; }`, { "@stylistic/scss/declaration-colon-space-after": `always`, "@stylistic/scss/declaration-block-semicolon-space-before": `never` }, COLON_SPACE)).toBe(true)
	})
})

describe(`sharesRunWithSemicolon`, () => {
	it(`the run of a value that is nothing but whitespace, which both colon rules share with the semicolon`, () => {
		expect(shares(`a { b: ; }`, COLON_SPACE)).toBe(true)
		expect(shares(`a { b: ; }`, COLON_NEWLINE)).toBe(true)
		expect(shares(`a { b:; }`, COLON_NEWLINE)).toBe(true)
		expect(shares(`a { --b: ; }`, COLON_NEWLINE)).toBe(true)
	})

	it(`the run behind a comment on the colon's line, which the newline rule shares and the space rule does not`, () => {
		expect(shares(`a { b: /*c*/ ; }`, COLON_NEWLINE)).toBe(true)
		expect(shares(`a { b: /*c*/ ; }`, COLON_SPACE)).toBe(false)
	})

	it(`a declaration whose runs are two, or one a side passes over`, () => {
		expect(shares(`a { b: c ; }`, COLON_NEWLINE)).toBe(false)
		expect(shares(`a { b: !important ; }`, COLON_NEWLINE)).toBe(false)
		expect(shares(`a { b: }`, COLON_NEWLINE)).toBe(false)
	})

	it(`a rule that is none of the four, and the names of the asking rule's own namespace`, () => {
		expect(shares(`a { b: ; }`, `@stylistic/color-hex-case`)).toBe(false)
		expect(shares(`a { b: ; }`, `@stylistic/scss/declaration-colon-newline-after`)).toBe(false)
		expect(sharesRunWithSemicolon({ ...css, namespace: `scss` }, lastDeclarationOf(`a { b: ; }`), `@stylistic/scss/declaration-colon-newline-after`)).toBe(true)
	})
})

/**
 * Asks whether the named rule's run of the last declaration of a stylesheet's first rule is the semicolon's too.
 * @param code - The stylesheet.
 * @param ruleName - The name of the asking rule.
 * @returns What `sharesRunWithSemicolon` answers.
 */
function shares (code: string, ruleName: string): boolean {
	return sharesRunWithSemicolon(css, lastDeclarationOf(code), ruleName)
}

/**
 * Asks whether a rule writes the run of the last declaration of a stylesheet's first rule.
 * @param code - The stylesheet.
 * @param rules - The rules the configuration lists, in the order it lists them.
 * @param ruleName - The name of the asking rule.
 * @param syntax - The syntax the asking rule is built over.
 * @returns What `writesSharedRun` answers.
 */
function ask (code: string, rules: Record<string, unknown>, ruleName: string, syntax: Syntax = css): boolean {
	return writesSharedRun(syntax, lastDeclarationOf(code), result(rules), ruleName)
}

/**
 * Parses a stylesheet and picks the last declaration of its first rule.
 * @param code - The stylesheet.
 * @returns The declaration.
 */
function lastDeclarationOf (code: string): Declaration {
	return (parse(code).first as Rule).last as Declaration
}

/**
 * Builds the least of a Stylelint result that holds a configuration.
 * @param rules - The rules the configuration lists.
 * @returns The result.
 */
function result (rules: Record<string, unknown>): PostcssResult {
	return { stylelint: { config: { rules } } } as unknown as PostcssResult
}
