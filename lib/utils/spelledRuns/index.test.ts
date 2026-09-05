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

	// An escape is a backslash and the one character behind it, so a run of backslashes pairs off from the left, and the parity of the run in front of a star decides which of the two it is
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

it(`spelledRuns over a hexadecimal escape`, () => {
	// The escape reaches over its digits, up to six of them, and the one whitespace character closing them belongs to it
	expect(textsOf(`10PX\\9*2REM`)).toEqual([`1`, `0`, `P`, `X`, `\\9`, `*`, `2`, `R`, `E`, `M`])
	expect(textsOf(`10PX\\2a*2REM`)).toEqual([`1`, `0`, `P`, `X`, `\\2a`, `*`, `2`, `R`, `E`, `M`])
	expect(textsOf(`10P\\61 X`)).toEqual([`1`, `0`, `P`, `\\61 `, `X`])
	expect(textsOf(`px\\9\t2PX`)).toEqual([`p`, `x`, `\\9\t`, `2`, `P`, `X`])
	expect(textsOf(`px\\9\n2PX`)).toEqual([`p`, `x`, `\\9\n`, `2`, `P`, `X`])
	expect(textsOf(`px\\9\f2PX`)).toEqual([`p`, `x`, `\\9\f`, `2`, `P`, `X`])
	expect(textsOf(`px\\000061 X`)).toEqual([`p`, `x`, `\\000061 `, `X`])
	expect(spelledRuns(`px\\61 X`)[2]?.escape).toBe(true)

	// A Windows pair closes the escape as the one break it is
	expect(textsOf(`px\\9\r\n2PX`)).toEqual([`p`, `x`, `\\9\r\n`, `2`, `P`, `X`])

	// A seventh digit is a character of its own, and the whitespace behind it belongs to the text
	expect(textsOf(`px\\0000611 X`)).toEqual([`p`, `x`, `\\000061`, `1`, ` `, `X`])

	// The escape closes on one whitespace character, and a second is the text's
	expect(textsOf(`px\\9  2PX`)).toEqual([`p`, `x`, `\\9 `, ` `, `2`, `P`, `X`])

	// An escaped backslash in front of a digit opens no hexadecimal escape, so the digit and the whitespace are the text's
	expect(textsOf(`px\\\\9 2PX`)).toEqual([`p`, `x`, `\\\\`, `9`, ` `, `2`, `P`, `X`])
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

	// The whitespace closing a hexadecimal escape is the escape's, so the identifier goes on behind it; a second whitespace character ends it
	expect(identifierEndOf(`p\\61 x`)).toBe(undefined)
	expect(identifierEndOf(`px\\9  2rem`)).toBe(5)
	expect(identifierEndOf(`px\\0000611 2rem`)).toBe(10)
})
