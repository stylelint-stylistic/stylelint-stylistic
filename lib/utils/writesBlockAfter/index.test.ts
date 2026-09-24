import { parse } from "postcss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { writesBlockAfter } from "./index.ts"

const OPENING_NEWLINE = `@stylistic/block-opening-brace-newline-after`
const CLOSING_NEWLINE = `@stylistic/block-closing-brace-newline-before`
const CLOSING_SPACE = `@stylistic/block-closing-brace-space-before`
const CLOSING_EMPTY_LINE = `@stylistic/block-closing-brace-empty-line-before`

describe(`writesBlockAfter`, () => {
	it(`a configuration listing the asking rule alone, or a neighbor refusing its option`, () => {
		expect(ask(`always`, {})).toBe(true)
		expect(ask(`never-multi-line`, {})).toBe(true)
		expect(ask(`always`, { [CLOSING_NEWLINE]: `sometimes` })).toBe(true)
		expect(ask(`always`, { "@stylistic/color-hex-case": `lower` })).toBe(true)
	})

	it(`a neighbor asking for the break the always options write`, () => {
		expect(ask(`always`, { [CLOSING_NEWLINE]: `always` })).toBe(true)
		expect(ask(`always`, { [CLOSING_NEWLINE]: `always-multi-line` })).toBe(true)
		expect(ask(`always-multi-line`, { [CLOSING_NEWLINE]: `always` })).toBe(true)
	})

	it(`the neighbor whose never-multi-line takes that break straight back out`, () => {
		expect(ask(`always`, { [CLOSING_NEWLINE]: `never-multi-line` })).toBe(false)
		expect(ask(`always-multi-line`, { [CLOSING_NEWLINE]: `never-multi-line` })).toBe(false)
		expect(ask(`never-multi-line`, { [CLOSING_NEWLINE]: `never-multi-line` }, true)).toBe(true)
	})

	it(`a neighbor asking for a space, which neither option of the asking rule accepts`, () => {
		expect(ask(`always`, { [CLOSING_SPACE]: `always` })).toBe(false)
		expect(ask(`always`, { [CLOSING_SPACE]: `never` })).toBe(false)
		expect(ask(`never-multi-line`, { [CLOSING_SPACE]: `never` }, true)).toBe(true)
		expect(ask(`never-multi-line`, { [CLOSING_SPACE]: `always` }, true)).toBe(false)
	})

	it(`a neighbor whose option says nothing of the block the write leaves`, () => {
		expect(ask(`always`, { [CLOSING_SPACE]: `always-single-line` })).toBe(true)
		expect(ask(`always`, { [CLOSING_NEWLINE]: `never-multi-line` }, true)).toBe(true)
		expect(ask(`never-multi-line`, { [CLOSING_SPACE]: `always-multi-line` }, true)).toBe(true)
		expect(ask(`never-multi-line`, { [CLOSING_SPACE]: `always-multi-line` }, false)).toBe(false)
	})

	it(`the empty line a neighbor writes over the break, which the always options accept`, () => {
		expect(ask(`always`, { [CLOSING_EMPTY_LINE]: `always-multi-line` })).toBe(true)
		expect(ask(`always`, { [CLOSING_EMPTY_LINE]: `never` })).toBe(true)
		expect(ask(`never-multi-line`, { [CLOSING_EMPTY_LINE]: `never` }, true)).toBe(true)
		expect(ask(`never-multi-line`, { [CLOSING_EMPTY_LINE]: `always-multi-line` }, false)).toBe(false)
		expect(ask(`never-multi-line`, { [CLOSING_EMPTY_LINE]: `always-multi-line` }, true)).toBe(true)
	})

	it(`that neighbor's except, which reverses its option over a block holding no declaration`, () => {
		expect(ask(`always`, { [CLOSING_EMPTY_LINE]: [`never`, { except: [`after-closing-brace`] }] })).toBe(true)
		expect(ask(`never-multi-line`, { [CLOSING_EMPTY_LINE]: [`never`, { except: [`after-closing-brace`] }] }, true)).toBe(false)
		expect(ask(`never-multi-line`, { [CLOSING_EMPTY_LINE]: [`always-multi-line`, { except: `after-closing-brace` }] }, false)).toBe(true)
	})

	it(`a neighbor whose fix is turned off, which rewrites nothing and so gates nothing`, () => {
		expect(ask(`always`, { [CLOSING_NEWLINE]: [`never-multi-line`, { disableFix: true }] })).toBe(true)
		expect(ask(`always`, { [CLOSING_SPACE]: [`always`, { disableFix: true }] })).toBe(true)
		expect(ask(`never-multi-line`, { [CLOSING_EMPTY_LINE]: [`always-multi-line`, { disableFix: true }] }, false)).toBe(true)
	})

	it(`every neighbor at once, where one of the three refuses`, () => {
		let rules = { [OPENING_NEWLINE]: `always`, [CLOSING_NEWLINE]: `always`, [CLOSING_EMPTY_LINE]: `always-multi-line` }

		expect(ask(`always`, rules)).toBe(true)
		expect(ask(`always`, { ...rules, [CLOSING_SPACE]: `never` })).toBe(false)
	})

	it(`a neighbor listed under the namespace of another syntax, which reads the same plain CSS file`, () => {
		expect(ask(`always`, { [`@stylistic/scss/block-closing-brace-newline-before`]: `never-multi-line` })).toBe(false)
		expect(ask(`always`, { [`@stylistic/less/block-closing-brace-space-before`]: `always` })).toBe(false)
		expect(ask(`never-multi-line`, { [`@stylistic/scss/block-closing-brace-empty-line-before`]: `always-multi-line` }, false)).toBe(false)
	})

	it(`a neighbor listed under two namespaces, where the copy reading the plain CSS root alone gates the write: the core's, or the first listed without it`, () => {
		expect(ask(`always`, { [CLOSING_NEWLINE]: `always`, [`@stylistic/scss/block-closing-brace-newline-before`]: `never-multi-line` })).toBe(true)
		expect(ask(`always`, { [`@stylistic/scss/block-closing-brace-newline-before`]: `always`, [CLOSING_NEWLINE]: `never-multi-line` })).toBe(false)
		expect(ask(`never-multi-line`, { [`@stylistic/scss/block-closing-brace-empty-line-before`]: `always-multi-line`, [CLOSING_EMPTY_LINE]: [`never`, { except: [`after-closing-brace`] }] }, true)).toBe(false)
		expect(ask(`never-multi-line`, { [`@stylistic/scss/block-closing-brace-empty-line-before`]: [`never`, { except: [`after-closing-brace`] }], [CLOSING_EMPTY_LINE]: `always-multi-line` }, false)).toBe(false)
		expect(ask(`never-multi-line`, { [`@stylistic/scss/block-closing-brace-empty-line-before`]: [`never`, { except: [`after-closing-brace`] }], [`@stylistic/less/block-closing-brace-empty-line-before`]: `always-multi-line` }, true)).toBe(false)
	})
})

/**
 * Asks whether the rule about the opening brace writes the run in front of the closing brace.
 * @param primary - The asking rule's primary option.
 * @param rules - The rules the configuration lists.
 * @param isSingleLine - Whether the block is one line as the write leaves it.
 * @returns What the utility answers.
 */
function ask (primary: string, rules: Record<string, unknown>, isSingleLine: boolean = false): boolean {
	let result = { stylelint: { config: { rules } } } as unknown as PostcssResult

	return writesBlockAfter(parse(`a {}`), result, primary, isSingleLine)
}
