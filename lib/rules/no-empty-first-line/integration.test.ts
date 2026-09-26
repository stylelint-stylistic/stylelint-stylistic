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
 * @param expected.onceWarnings - How many warnings the pair has about that file.
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

describe(`the output of no-empty-first-line beside a rule that writes into the head of the file`, () => {
	it(`opens a file whose first line stands in front of a free semicolon the same way in both orders of no-extra-semicolons`, async () => {
		await expectBothOrders(`\n;\na {}`, { once: `a {}`, onceWarnings: 0, twice: `a {}` })
	})

	it(`does the same where the file opens with two empty lines`, async () => {
		await expectBothOrders(`\n\n;\na {}`, { once: `a {}`, onceWarnings: 0, twice: `a {}` })
	})

	it(`does the same where spaces stand in the empty line and around the semicolon`, async () => {
		await expectBothOrders(`  \n  ;  \na {}`, { once: `a {}`, onceWarnings: 0, twice: `a {}` })
	})

	it(`does the same with a carriage-return line break`, async () => {
		await expectBothOrders(`\r\n;\r\na {}`, { once: `a {}`, onceWarnings: 0, twice: `a {}` })
	})

	it(`does the same where a comment is what the semicolon stands in front of`, async () => {
		await expectBothOrders(`\n;\n/* c */`, { once: `/* c */`, onceWarnings: 0, twice: `/* c */` })
	})

	it(`does the same where the file holds nothing but the semicolon, which leaves the root no node and the runs a stylesheet of whitespace alone`, async () => {
		await expectBothOrders(`\n;\n`, { once: `\n\n`, onceWarnings: 0, twice: `\n\n` })
	})

	it(`does the same inside a style element, whose own opening break the page keeps`, async () => {
		await expectBothOrders(`<style>\n\n;\na {}</style>`, { once: `<style>\na {}</style>`, onceWarnings: 0, twice: `<style>\na {}</style>` }, `postcss-html`)
	})

	it.each([
		[`;\n\n\na {}`],
		[`\n;\n\na {}`],
		[`;;\n\na {}`],
		[` ; \n\na {}`],
	])(`does the same where the semicolon stands on the first line of %j, which the neighbor leaves empty`, async (code) => {
		await expectBothOrders(code, { once: `a {}`, onceWarnings: 0, twice: `a {}` })
	})

	it(`reads a semicolon a disable comment keeps from the neighbor as a character of its line`, async () => {
		let code = `; /* stylelint-disable-line @stylistic/no-extra-semicolons */\n\na {}`

		await expectBothOrders(code, { once: code, onceWarnings: 0, twice: code })
	})
})

/** The three rules that write the head of the file, by the short names the orders are spelled with. */
const HEAD_WRITERS: Record<string, unknown> = {
	"no-empty-first-line": true,
	"max-empty-lines": 1,
	"no-extra-semicolons": true,
}

/**
 * Every ordering of some rule names.
 * @param names - The names to permute.
 * @returns Every ordering.
 */
function orders (names: string[]): string[][] {
	if (names.length <= 1) return [[...names]]

	let built: string[][] = []

	for (let [index, name] of names.entries()) {
		for (let rest of orders([...names.slice(0, index), ...names.slice(index + 1)])) built.push([name, ...rest])
	}

	return built
}

/**
 * Fixes a snippet under one order of the three until the runs stop moving it, or as many runs as given.
 * @param code - The snippet.
 * @param order - The rules in the order the configuration is to spell them.
 * @param customSyntax - The syntax to parse the snippet with, where it is not a plain stylesheet.
 * @param runs - The most runs.
 * @returns The file the runs left and how many warnings the three have about it.
 */
async function settle (code: string, order: string[], customSyntax?: string, runs = 8): Promise<{ file: string, warnings: number }> {
	let rules: Record<string, unknown> = {}

	for (let name of order) rules[`@stylistic/${name}`] = HEAD_WRITERS[name]

	let options = { config: { plugins, rules }, ...(customSyntax && { customSyntax }) }
	let file = code

	for (let run = 0; run < runs; run += 1) {
		// eslint-disable-next-line no-await-in-loop
		let answer = await stylelint.lint({ code: file, fix: true, ...options })
		let next = answer.code ?? file

		if (next === file) break

		file = next
	}

	let read = await stylelint.lint({ code: file, ...options })

	return { file, warnings: pick(read.results).warnings.length }
}

/**
 * Asserts that every order of the three leaves one file, and that the three have nothing to say about it.
 * @param code - The snippet.
 * @param expected - The file every order is to leave.
 * @param customSyntax - The syntax to parse the snippet with, where it is not a plain stylesheet.
 * @param runs - The most runs each order is given.
 * @returns Nothing.
 */
async function expectEveryOrder (code: string, expected: string, customSyntax?: string, runs?: number): Promise<void> {
	let settled = await Promise.all(orders(Object.keys(HEAD_WRITERS)).map(async (order) => ({ order, settlement: await settle(code, order, customSyntax, runs) })))

	for (let { order, settlement } of settled) expect({ order, ...settlement }).toEqual({ order, file: expected, warnings: 0 })
}

describe(`the output of the three rules that write the head of the file`, () => {
	it(`leaves one file over a free semicolon between two breaks, where the head raw is the whole file`, async () => {
		await expectEveryOrder(`\n;\n`, `\n`)
	})

	it(`does the same where the file opens with two empty lines`, async () => {
		await expectEveryOrder(`\n\n;\n`, `\n`)
	})

	it(`does the same where two breaks stand behind the semicolon`, async () => {
		await expectEveryOrder(`\n;\n\n`, `\n`)
	})

	it(`does the same where the file ends on the semicolon, which leaves a stylesheet of a single break`, async () => {
		await expectEveryOrder(`\n;`, `\n`)
	})

	it(`does the same where the empty second line carries a space`, async () => {
		await expectEveryOrder(`\n \n;\n`, `\n \n`)
	})

	it(`does the same with a carriage-return line break`, async () => {
		await expectEveryOrder(`\r\n;\r\n`, `\r\n`)
	})

	it(`does the same inside a style element, whose root keeps the block in the raw the page's own runs stand outside of`, async () => {
		await expectEveryOrder(`<style>\n\n\n;\n</style>\n`, `<style>\n\n</style>\n`, `postcss-html`)
	})

	it(`does the same in a single run where the semicolon stands on the first line in front of a rule`, async () => {
		await expectEveryOrder(`;\n\n\na {}`, `a {}`, undefined, 1)
	})
})
