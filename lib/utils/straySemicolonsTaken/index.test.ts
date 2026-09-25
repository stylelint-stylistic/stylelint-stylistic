import { parse, type Rule } from "postcss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { releasesAKeptSemicolon, straySemicolonsReleased, straySemicolonsTaken, straySemicolonsTakenBefore, withoutTaken } from "./index.ts"

describe(`straySemicolonsTaken`, () => {
	it(`nothing where no rule taking a stray semicolon out is listed`, () => {
		expect(ask(`a {\n\tb: c;\n;\n}`)).toEqual([])
		expect(ask(`a {\n\tb: c;\n;\n}`, { "@stylistic/declaration-block-trailing-semicolon": `always` })).toEqual([])
	})

	it(`every stray semicolon a live no-extra-semicolons takes out`, () => {
		expect(ask(`a {\n\tb: c;\n;\n;\n}`, { "@stylistic/no-extra-semicolons": true })).toEqual([1, 3])
		expect(ask(`a {\n\t/* c */\n;\n}`, { "@stylistic/no-extra-semicolons": true })).toEqual([1])
	})

	it(`nothing where the fix of no-extra-semicolons is off, or a disable comment keeps it off the semicolon's line`, () => {
		expect(ask(`a {\n\tb: c;\n;\n}`, { "@stylistic/no-extra-semicolons": [true, { disableFix: true }] })).toEqual([])
		expect(ask(`a {\n\tb: c;\n;\n;\n}`, { "@stylistic/no-extra-semicolons": true }, [{ start: 3, end: 3 }])).toEqual([3])
	})

	it(`every stray semicolon behind the node where declaration-block-trailing-semicolon: never leaves none, a declaration or a bodiless at-rule`, () => {
		expect(ask(`a {\n\tb: c;\n;\n}`, { "@stylistic/declaration-block-trailing-semicolon": `never` })).toEqual([1])
		expect(ask(`a {\n\t@import "b";\n;\n}`, { "@stylistic/declaration-block-trailing-semicolon": `never` })).toEqual([1])
	})

	it(`the disable comments of declaration-block-trailing-semicolon read on the line of the last semicolon, where it reports`, () => {
		expect(ask(`a {\n\tb: c;\n;\n}`, { "@stylistic/declaration-block-trailing-semicolon": `never` }, [{ start: 2, end: 2 }])).toEqual([1])
		expect(ask(`a {\n\tb: c;\n;\n}`, { "@stylistic/declaration-block-trailing-semicolon": `never` }, [{ start: 3, end: 3 }])).toEqual([])
	})

	it(`nothing from declaration-block-trailing-semicolon behind a block of comments alone, whose semicolon it leaves`, () => {
		expect(ask(`a {\n\t/* c */\n;\n}`, { "@stylistic/declaration-block-trailing-semicolon": `never` })).toEqual([])
	})
})

describe(`straySemicolonsTakenBefore`, () => {
	it(`every semicolon in front of a node a live no-extra-semicolons takes out, but one a disable comment keeps its fix off`, () => {
		let declaration = (parse(`a {\n/* c */ ;\n;b: c; }`).first as Rule).last

		expect(declaration && [...straySemicolonsTakenBefore(declaration, extraRuleResult([]))]).toEqual([1, 3])
		expect(declaration && [...straySemicolonsTakenBefore(declaration, extraRuleResult([{ start: 2, end: 2 }]))]).toEqual([3])
	})

	it(`nothing where no-extra-semicolons is not listed`, () => {
		let declaration = (parse(`a {\n/* c */ ;\nb: c; }`).first as Rule).last

		expect(declaration && [...straySemicolonsTakenBefore(declaration, { stylelint: { config: { rules: {} } } } as unknown as PostcssResult)]).toEqual([])
	})
})

describe(`straySemicolonsReleased`, () => {
	// `a {/* c */ ;⏎}`: the run in front of the brace starts at offset 10 on line 1
	let insertion = [{ offset: 10, line: 1, delta: 1 }]

	it(`a semicolon a disable comment keeps on its line, which a break written in front of it moves out of the comment's reach`, () => {
		let block = parse(`a {/* c */ ;\n}`).first as Rule

		expect([...straySemicolonsReleased(block, `after`, extraRuleResult([{ start: 1, end: 1 }]), insertion)]).toEqual([1])
		expect([...straySemicolonsReleased(block, `after`, extraRuleResult([{ start: 1, end: 1 }]), [])]).toEqual([])
	})

	it(`none where the range reaches the line the move lands on`, () => {
		let block = parse(`a {/* c */ ;\n}`).first as Rule

		expect([...straySemicolonsReleased(block, `after`, extraRuleResult([{ start: 1, end: 5 }]), insertion)]).toEqual([])
	})

	it(`none where the comment opening a one-line range moves with the semicolon, or the edits stand on lines in front of a range whose comment is not known`, () => {
		let block = parse(`a {\n/* c */ ;\n}`).first as Rule
		let comment = block.first

		// The break in front of the comment taken out, as never-multi-line takes it
		expect([...straySemicolonsReleased(block, `after`, extraRuleResult([{ node: comment, start: 2, end: 2 }]), [{ offset: 3, line: 1, delta: -1 }])]).toEqual([])
		expect([...straySemicolonsReleased(block, `after`, extraRuleResult([{ start: 2, end: 2 }]), [{ offset: 3, line: 1, delta: -1 }])]).toEqual([])
	})

	it(`the run in front of a node the same way`, () => {
		let declaration = (parse(`a {/* c */ ;\nb: c; }`).first as Rule).last

		expect(declaration && [...straySemicolonsReleased(declaration, `before`, extraRuleResult([{ start: 1, end: 1 }]), insertion)]).toEqual([1])
		expect(declaration && [...straySemicolonsReleased(declaration, `before`, extraRuleResult([]), insertion)]).toEqual([])
	})
})

describe(`releasesAKeptSemicolon`, () => {
	// `a {/* c */ b: c;; }` behind a comment line: the declaration's run starts at offset 18 on line 2
	let code = `/* x */\na {/* c */ b: c;; }`
	let insertion = [{ offset: 18, line: 2, delta: 1 }]

	it(`a semicolon anywhere behind the edit that a covering range no longer reaches`, () => {
		expect(releasesAKeptSemicolon(parse(code), extraRuleResult([{ start: 2, end: 2 }]), insertion)).toBe(true)
	})

	it(`none without a range, without an edit, or where the range reaches the moved line`, () => {
		expect(releasesAKeptSemicolon(parse(code), extraRuleResult([]), insertion)).toBe(false)
		expect(releasesAKeptSemicolon(parse(code), extraRuleResult([{ start: 2, end: 2 }]), [])).toBe(false)
		expect(releasesAKeptSemicolon(parse(code), extraRuleResult([{ start: 2, end: 3 }]), insertion)).toBe(false)
	})
})

describe(`withoutTaken`, () => {
	it(`takes the characters at the indices out`, () => {
		expect(withoutTaken(`\n;\n;\n`, new Set([1, 3]))).toBe(`\n\n\n`)
		expect(withoutTaken(`\n;\n`, new Set())).toBe(`\n;\n`)
	})
})

/**
 * Asks the question of the first rule of a plain CSS stylesheet.
 * @param code - The stylesheet.
 * @param rules - The rules the configuration lists.
 * @param disabled - The lines a disable comment for every rule keeps a fix off.
 * @returns The indices taken, in order.
 */
function ask (code: string, rules: Record<string, unknown> = {}, disabled: { start: number, end: number }[] = []): number[] {
	let result = { stylelint: { config: { rules }, disabledRanges: { all: disabled } } } as unknown as PostcssResult

	return [...straySemicolonsTaken(parse(code).first as Rule, result)].toSorted((a, b) => a - b)
}

/**
 * A result listing no-extra-semicolons alone.
 * @param disabled - The lines a disable comment for every rule keeps a fix off.
 * @returns The result.
 */
function extraRuleResult (disabled: { node?: unknown, start: number, end: number }[]): PostcssResult {
	return { stylelint: { config: { rules: { "@stylistic/no-extra-semicolons": true } }, disabledRanges: { all: disabled } } } as unknown as PostcssResult
}
