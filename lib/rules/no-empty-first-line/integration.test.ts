import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import { pick } from "../../../vitest.helpers.ts"
import plugins from "../../index.ts"

/**
 * Fixes one snippet twice under two rules and reads the output back after each run; Stylelint runs the rules in the order the configuration spells them, so the object handed here decides which takes its turn first.
 * @param code - The snippet.
 * @param rules - The two rules, in the order the configuration is to spell them.
 * @param customSyntax - The syntax to parse the snippet with, where it is not a plain stylesheet.
 * @returns The file each of the two runs left and how many warnings the pair has about it.
 */
async function fixTwice (code: string, rules: object, customSyntax?: string): Promise<{
	once: string,
	onceWarnings: number,
	twice: string,
	twiceWarnings: number,
}> {
	let options = { config: { plugins, rules }, ...(customSyntax && { customSyntax }) }

	let firstRun = await stylelint.lint({ code, fix: true, ...options })
	let once = firstRun.code ?? code
	let secondRun = await stylelint.lint({ code: once, fix: true, ...options })
	let twice = secondRun.code ?? once

	let onceRead = await stylelint.lint({ code: once, ...options })
	let twiceRead = await stylelint.lint({ code: twice, ...options })

	return {
		once,
		onceWarnings: pick(onceRead.results).warnings.length,
		twice,
		twiceWarnings: pick(twiceRead.results).warnings.length,
	}
}

/**
 * Asserts that the two orders of the pair leave one file, and that the run after it settles with nothing left to say.
 * @param code - The snippet.
 * @param expected - What the runs are to leave.
 * @param expected.once - The file both orders leave.
 * @param expected.onceWarnings - How many warnings the pair has about that file, one wherever the neighbour's own write has left an empty line where the semicolon stood.
 * @param expected.twice - The file the run after that leaves, which the pair has nothing to say about.
 * @param customSyntax - The syntax to parse the snippet with, where it is not a plain stylesheet.
 * @returns Nothing.
 */
async function expectBothOrders (code: string, expected: {
	once: string,
	onceWarnings: number,
	twice: string,
}, customSyntax?: string): Promise<void> {
	let settled = { ...expected, twiceWarnings: 0 }
	let thisRuleFirst = await fixTwice(code, { "@stylistic/no-empty-first-line": true, "@stylistic/no-extra-semicolons": true }, customSyntax)
	let partnerFirst = await fixTwice(code, { "@stylistic/no-extra-semicolons": true, "@stylistic/no-empty-first-line": true }, customSyntax)

	expect(thisRuleFirst).toEqual(settled)
	expect(partnerFirst).toEqual(settled)
}

// See #632
describe(`the output of no-empty-first-line beside a rule that writes into the head of the file`, () => {
	it(`opens a file whose first line stands in front of a free semicolon the same way in both orders of no-extra-semicolons`, async () => {
		await expectBothOrders(`\n;\na {}`, { once: `\na {}`, onceWarnings: 1, twice: `a {}` })
	})

	it(`does the same where the file opens with two empty lines`, async () => {
		await expectBothOrders(`\n\n;\na {}`, { once: `\na {}`, onceWarnings: 1, twice: `a {}` })
	})

	it(`does the same where spaces stand in the empty line and around the semicolon`, async () => {
		await expectBothOrders(`  \n  ;  \na {}`, { once: `    \na {}`, onceWarnings: 1, twice: `a {}` })
	})

	it(`does the same with a carriage-return line break`, async () => {
		await expectBothOrders(`\r\n;\r\na {}`, { once: `\r\na {}`, onceWarnings: 1, twice: `a {}` })
	})

	it(`does the same where a comment is what the semicolon stands in front of`, async () => {
		await expectBothOrders(`\n;\n/* c */`, { once: `\n/* c */`, onceWarnings: 1, twice: `/* c */` })
	})

	it(`does the same where the file holds nothing but the semicolon, which leaves the root no node and the runs a stylesheet of whitespace alone`, async () => {
		await expectBothOrders(`\n;\n`, { once: `\n`, onceWarnings: 0, twice: `\n` })
	})

	it(`does the same inside a style element, whose own opening break the page keeps`, async () => {
		await expectBothOrders(`<style>\n\n;\na {}</style>`, { once: `<style>\n\na {}</style>`, onceWarnings: 1, twice: `<style>\na {}</style>` }, `postcss-html`)
	})
})
