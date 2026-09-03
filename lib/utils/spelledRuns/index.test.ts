import { expect, it } from "vitest"

import { IDENTIFIER_CODE_POINT } from "../../regexps.ts"

import { spelledRuns } from "./index.ts"

/**
 * The text of every run, which is what each caller asks its question of.
 * @param text - The text to read.
 * @returns The runs, as their texts.
 */
function textsOf (text: string): string[] {
	return spelledRuns(text).map((run) => run.text)
}

/**
 * Where the stars the file spells stand, as the rule that parts a multiplication asks.
 * @param text - The text to read.
 * @returns Their indexes.
 */
function starsOf (text: string): number[] {
	return spelledRuns(text).filter((run) => run.text === `*`).map((run) => run.index)
}

/**
 * Where the identifier ends, as the dimension reading asks.
 * @param text - The text to read.
 * @returns The index, or `undefined` where the whole text is one.
 */
function identifierEndOf (text: string): number | undefined {
	return spelledRuns(text).find((run) => !run.escape && !IDENTIFIER_CODE_POINT.test(run.text))?.index
}

it(`spelledRuns`, () => {
	expect(spelledRuns(``)).toEqual([])
	expect(spelledRuns(`px`)).toEqual([{ index: 0, text: `p`, escape: false }, { index: 1, text: `x`, escape: false }])
	expect(textsOf(`10PX\\*2REM`)).toEqual([`1`, `0`, `P`, `X`, `\\*`, `2`, `R`, `E`, `M`])

	// An escape is a backslash and the one character behind it, so a run of backslashes pairs off from the left
	expect(textsOf(`\\\\*`)).toEqual([`\\\\`, `*`])
	expect(textsOf(`\\\\\\*`)).toEqual([`\\\\`, `\\*`])
	expect(textsOf(`\\\\\\\\*`)).toEqual([`\\\\`, `\\\\`, `*`])

	// A backslash closing the text is a run of its own, the escape it opens reaching nothing
	expect(textsOf(`px\\`)).toEqual([`p`, `x`, `\\`])
	expect(textsOf(`\\`)).toEqual([`\\`])
	expect(spelledRuns(`px\\`).at(-1)?.escape).toBe(true)

	// A backslash a line break stands behind opens no escape: the grammar reads it as a delimiter of its own, and all three breaks count
	expect(textsOf(`px\\\n2rem`)).toEqual([`p`, `x`, `\\`, `\n`, `2`, `r`, `e`, `m`])
	expect(spelledRuns(`px\\\n`)[2]?.escape).toBe(false)
	expect(spelledRuns(`px\\\r`)[2]?.escape).toBe(false)
	expect(spelledRuns(`px\\\f`)[2]?.escape).toBe(false)
	expect(spelledRuns(`px\\ `)[2]?.escape).toBe(true)
})

it(`spelledRuns over the stars a word spells`, () => {
	expect(starsOf(`10PX2REM`)).toEqual([])
	expect(starsOf(`10PX*2REM`)).toEqual([4])
	expect(starsOf(`10PX*2REM*3EM`)).toEqual([4, 9])
	expect(starsOf(`**`)).toEqual([0, 1])

	// The parity of the run in front of the star decides which of the two it is
	expect(starsOf(`10PX\\*2REM`)).toEqual([])
	expect(starsOf(`10PX\\\\*2REM`)).toEqual([6])
	expect(starsOf(`10PX\\\\\\*2REM`)).toEqual([])
	expect(starsOf(`10PX\\\\\\\\*2REM`)).toEqual([8])

	// A hexadecimal escape reaches over its digits, and every one of them is a character no caller asks about
	expect(starsOf(`10PX\\9*2REM`)).toEqual([6])
	expect(starsOf(`10PX\\2a*2REM`)).toEqual([7])
})

it(`spelledRuns over the code points of an identifier`, () => {
	expect(identifierEndOf(`px`)).toBe(undefined)
	expect(identifierEndOf(`px-a_1`)).toBe(undefined)
	expect(identifierEndOf(`px!important`)).toBe(2)
	expect(identifierEndOf(`px$var`)).toBe(2)
	expect(identifierEndOf(`px.a`)).toBe(2)
	expect(identifierEndOf(`px%`)).toBe(2)
	expect(identifierEndOf(`px#fff`)).toBe(2)

	// An escaped character is a code point of the identifier it stands in, and a backslash closing the text is one too
	expect(identifierEndOf(`px\\#fff`)).toBe(undefined)
	expect(identifierEndOf(`px\\*2rem`)).toBe(undefined)
	expect(identifierEndOf(`px\\`)).toBe(undefined)
	expect(identifierEndOf(`px\\\n2rem`)).toBe(2)
	expect(identifierEndOf(`px\\*$var`)).toBe(4)
	expect(identifierEndOf(`px\\\\0#fff`)).toBe(5)
})
