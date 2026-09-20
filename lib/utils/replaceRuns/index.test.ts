import { describe, expect, it } from "vitest"

import { replaceRuns } from "./index.ts"

describe(`replaceRuns`, () => {
	it(`no run`, () => {
		expect(replaceRuns(`1px       2px`, `1px /*c*/ 2px`, /\n{2,}/u, `\n`)).toEqual([`1px       2px`, `1px /*c*/ 2px`])
	})

	it(`a run outside the blanked span`, () => {
		expect(replaceRuns(`1px      \n\n\n2px`, `1px /*c*/\n\n\n2px`, /\n{2,}/u, `\n`)).toEqual([`1px      \n2px`, `1px /*c*/\n2px`])
	})

	it(`a run inside the blanked span, which the copy no longer spells`, () => {
		expect(replaceRuns(`1px            2px`, `1px /*a\n\n\nb*/ 2px`, /\n{2,}/u, `\n`)).toEqual([`1px            2px`, `1px /*a\n\n\nb*/ 2px`])
	})

	it(`two runs, the text keeping what the copy blanked between them`, () => {
		expect(replaceRuns(`a\n\n\n     \n\n\nb`, `a\n\n\n/*c*/\n\n\nb`, /\n{2,}/u, `\n`)).toEqual([`a\n     \nb`, `a\n/*c*/\nb`])
	})

	it(`the copy and the text stay the same length`, () => {
		let [blanked, text] = replaceRuns(`a\r\n\r\n\r\n     b`, `a\r\n\r\n\r\n/*c*/b`, /(?:\r\n){2,}/u, `\r\n`)

		expect(blanked).toHaveLength(text.length)
	})
})
