import valueParser from "postcss-value-parser"
import { expect, it } from "vitest"

import { css } from "../../syntaxes/css/index.ts"
import type { Syntax } from "../../syntaxes/index.ts"

import { getDimension } from "./index.ts"

it(`getDimension`, () => {
	expect(getDimension(css).number).toBe(null)
	expect(getDimension(css).unit).toBe(null)
	expect(getDimension(css, {}).number).toBe(null)
	expect(getDimension(css, {}).unit).toBe(null)

	// testing Dimension.unit
	expect(getDimension(css, valueParser(`1.1s`).nodes[0]).unit).toBe(`s`)
	expect(getDimension(css, valueParser(`1.1000s`).nodes[0]).unit).toBe(`s`)
	expect(getDimension(css, valueParser(`1.1S`).nodes[0]).unit).toBe(`S`)
	expect(getDimension(css, valueParser(`+1.1s`).nodes[0]).unit).toBe(`s`)
	expect(getDimension(css, valueParser(`+1.1000s`).nodes[0]).unit).toBe(`s`)
	expect(getDimension(css, valueParser(`-1.1s`).nodes[0]).unit).toBe(`s`)
	expect(getDimension(css, valueParser(`-1.1000s`).nodes[0]).unit).toBe(`s`)
	expect(getDimension(css, valueParser(`1.1e10s`).nodes[0]).unit).toBe(`s`)
	expect(getDimension(css, valueParser(`+1.1e10s`).nodes[0]).unit).toBe(`s`)
	expect(getDimension(css, valueParser(`-1.1e10s`).nodes[0]).unit).toBe(`s`)
	expect(getDimension(css, valueParser(`1.1e+10s`).nodes[0]).unit).toBe(`s`)
	expect(getDimension(css, valueParser(`1.1e-10s`).nodes[0]).unit).toBe(`s`)
	expect(getDimension(css, valueParser(`+1.1e+10s`).nodes[0]).unit).toBe(`s`)
	expect(getDimension(css, valueParser(`+1.1e-10s`).nodes[0]).unit).toBe(`s`)
	expect(getDimension(css, valueParser(`-1.1e-10s`).nodes[0]).unit).toBe(`s`)
	expect(getDimension(css, valueParser(`-1.1e+10s`).nodes[0]).unit).toBe(`s`)
	expect(getDimension(css, valueParser(`1px`).nodes[0]).unit).toBe(`px`)
	expect(getDimension(css, valueParser(`1pX`).nodes[0]).unit).toBe(`pX`)
	expect(getDimension(css, valueParser(`1PX`).nodes[0]).unit).toBe(`PX`)
	expect(getDimension(css, valueParser(`+1px`).nodes[0]).unit).toBe(`px`)
	expect(getDimension(css, valueParser(`-1px`).nodes[0]).unit).toBe(`px`)
	expect(getDimension(css, valueParser(`1e1px`).nodes[0]).unit).toBe(`px`)
	expect(getDimension(css, valueParser(`+1e1px`).nodes[0]).unit).toBe(`px`)
	expect(getDimension(css, valueParser(`-1e1px`).nodes[0]).unit).toBe(`px`)
	expect(getDimension(css, valueParser(`1e-1px`).nodes[0]).unit).toBe(`px`)
	expect(getDimension(css, valueParser(`1e+1px`).nodes[0]).unit).toBe(`px`)
	expect(getDimension(css, valueParser(`+1e+1px`).nodes[0]).unit).toBe(`px`)
	expect(getDimension(css, valueParser(`+1e-1px`).nodes[0]).unit).toBe(`px`)
	expect(getDimension(css, valueParser(`-1e-1px`).nodes[0]).unit).toBe(`px`)
	expect(getDimension(css, valueParser(`-1e+1px`).nodes[0]).unit).toBe(`px`)
	expect(getDimension(css, valueParser(`.1s`).nodes[0]).unit).toBe(`s`)
	expect(getDimension(css, valueParser(`+.1s`).nodes[0]).unit).toBe(`s`)
	expect(getDimension(css, valueParser(`-.1s`).nodes[0]).unit).toBe(`s`)
	expect(getDimension(css, valueParser(`+.1000s`).nodes[0]).unit).toBe(`s`)
	expect(getDimension(css, valueParser(`-.1000s`).nodes[0]).unit).toBe(`s`)
	expect(getDimension(css, valueParser(`.1e1s`).nodes[0]).unit).toBe(`s`)
	expect(getDimension(css, valueParser(`+.1e1s`).nodes[0]).unit).toBe(`s`)
	expect(getDimension(css, valueParser(`-.1e1s`).nodes[0]).unit).toBe(`s`)
	expect(getDimension(css, valueParser(`.1e-1s`).nodes[0]).unit).toBe(`s`)
	expect(getDimension(css, valueParser(`.1e+1s`).nodes[0]).unit).toBe(`s`)
	expect(getDimension(css, valueParser(`+.1e+1s`).nodes[0]).unit).toBe(`s`)
	expect(getDimension(css, valueParser(`+.1e-1s`).nodes[0]).unit).toBe(`s`)
	expect(getDimension(css, valueParser(`-.1e-1s`).nodes[0]).unit).toBe(`s`)
	expect(getDimension(css, valueParser(`-.1e+1s`).nodes[0]).unit).toBe(`s`)
	// A percent sign is no code point of an identifier, so the unit ends in front of it: the tokenizer reads `100%` as a percentage and `10PX%` as the dimension `10PX` with a delimiter behind it
	expect(getDimension(css, valueParser(`100%`).nodes[0]).unit).toBe(``)
	expect(getDimension(css, valueParser(`10PX%`).nodes[0]).unit).toBe(`PX`)
	expect(getDimension(css, valueParser(`100`).nodes[0]).unit).toBe(``)
	expect(getDimension(css, valueParser(`0\\0`).nodes[0]).unit).toBe(``)
	expect(getDimension(css, valueParser(`10px\\9`).nodes[0]).unit).toBe(`px`)
	expect(getDimension(css, valueParser(`6e-2px`).nodes[0]).unit).toBe(`px`)
	expect(getDimension(css, valueParser(`.0`).nodes[0]).unit).toBe(``)
	expect(getDimension(css, valueParser(`+.0`).nodes[0]).unit).toBe(``)
	expect(getDimension(css, valueParser(`-.0`).nodes[0]).unit).toBe(``)
	expect(getDimension(css, valueParser(`.0e1`).nodes[0]).unit).toBe(``)
	expect(getDimension(css, valueParser(`+.0e1`).nodes[0]).unit).toBe(``)
	expect(getDimension(css, valueParser(`-.0e1`).nodes[0]).unit).toBe(``)
	// A character an interpolation is spelled with, standing outside any interpolation, ends the unit in front of it (#426)
	expect(getDimension(css, valueParser(`10px#fff`).nodes[0]).unit).toBe(`px`)
	expect(getDimension(css, valueParser(`10PX#FFF`).nodes[0]).unit).toBe(`PX`)
	expect(getDimension(css, valueParser(`10px@a`).nodes[0]).unit).toBe(`px`)
	// A pair of braces is an interpolation to `isStandardValue`, and such a word is turned away before it is read
	expect(getDimension(css, valueParser(`10px{a}`).nodes[0]).unit).toBe(null)
	expect(getDimension(css, valueParser(`1}px}`).nodes[0]).unit).toBe(``)

	// The unit ends at the first character that is no code point of an identifier, whichever character that is: a bang opening a flag, a dollar or a dot opening the name of a variable
	expect(getDimension(css, valueParser(`1px!important`).nodes[0]).unit).toBe(`px`)
	expect(getDimension(css, valueParser(`1PX!default`).nodes[0]).unit).toBe(`PX`)
	expect(getDimension(css, valueParser(`10PX$VAR`).nodes[0]).unit).toBe(`PX`)
	expect(getDimension(css, valueParser(`10PX*2REM`).nodes[0]).unit).toBe(`PX`)

	// An escaped character is a code point of the identifier it stands in, and ends nothing (#414)
	expect(getDimension(css, valueParser(`10px\\#fff`).nodes[0]).unit).toBe(`px\\#fff`)
	expect(getDimension(css, valueParser(`10PX\\*2REM`).nodes[0]).unit).toBe(`PX\\*2REM`)
	expect(getDimension(css, valueParser(`10PX\\*$VAR`).nodes[0]).unit).toBe(`PX\\*`)
	// The escape is the backslash and the one character behind it, so the star of `\\\\*` is the file's own and ends the unit
	expect(getDimension(css, valueParser(`10PX\\\\*2REM`).nodes[0]).unit).toBe(`PX\\\\`)
	expect(getDimension(css, valueParser(`10PX\\\\\\*2REM`).nodes[0]).unit).toBe(`PX\\\\\\*2REM`)
	// A word opening with an escape is an identifier and no dimension at all
	expect(getDimension(css, valueParser(`\\*10PX`).nodes[0]).unit).toBe(null)

	// testing Dimension.number
	expect(getDimension(css, valueParser(`1.1s`).nodes[0]).number).toBe(`1.1`)
	expect(getDimension(css, valueParser(`1.1000s`).nodes[0]).number).toBe(`1.1000`)
	expect(getDimension(css, valueParser(`1.1S`).nodes[0]).number).toBe(`1.1`)
	expect(getDimension(css, valueParser(`+1.1s`).nodes[0]).number).toBe(`+1.1`)
	expect(getDimension(css, valueParser(`+1.1000s`).nodes[0]).number).toBe(`+1.1000`)
	expect(getDimension(css, valueParser(`-1.1s`).nodes[0]).number).toBe(`-1.1`)
	expect(getDimension(css, valueParser(`-1.1000s`).nodes[0]).number).toBe(`-1.1000`)
	expect(getDimension(css, valueParser(`1.1e10s`).nodes[0]).number).toBe(`1.1e10`)
	expect(getDimension(css, valueParser(`+1.1e10s`).nodes[0]).number).toBe(`+1.1e10`)
	expect(getDimension(css, valueParser(`-1.1e10s`).nodes[0]).number).toBe(`-1.1e10`)
	expect(getDimension(css, valueParser(`1.1e+10s`).nodes[0]).number).toBe(`1.1e+10`)
	expect(getDimension(css, valueParser(`1.1e-10s`).nodes[0]).number).toBe(`1.1e-10`)
	expect(getDimension(css, valueParser(`+1.1e+10s`).nodes[0]).number).toBe(`+1.1e+10`)
	expect(getDimension(css, valueParser(`+1.1e-10s`).nodes[0]).number).toBe(`+1.1e-10`)
	expect(getDimension(css, valueParser(`-1.1e-10s`).nodes[0]).number).toBe(`-1.1e-10`)
	expect(getDimension(css, valueParser(`-1.1e+10s`).nodes[0]).number).toBe(`-1.1e+10`)
	expect(getDimension(css, valueParser(`1px`).nodes[0]).number).toBe(`1`)
	expect(getDimension(css, valueParser(`1pX`).nodes[0]).number).toBe(`1`)
	expect(getDimension(css, valueParser(`1PX`).nodes[0]).number).toBe(`1`)
	expect(getDimension(css, valueParser(`+1px`).nodes[0]).number).toBe(`+1`)
	expect(getDimension(css, valueParser(`-1px`).nodes[0]).number).toBe(`-1`)
	expect(getDimension(css, valueParser(`1e1px`).nodes[0]).number).toBe(`1e1`)
	expect(getDimension(css, valueParser(`+1e1px`).nodes[0]).number).toBe(`+1e1`)
	expect(getDimension(css, valueParser(`-1e1px`).nodes[0]).number).toBe(`-1e1`)
	expect(getDimension(css, valueParser(`1e-1px`).nodes[0]).number).toBe(`1e-1`)
	expect(getDimension(css, valueParser(`1e+1px`).nodes[0]).number).toBe(`1e+1`)
	expect(getDimension(css, valueParser(`+1e+1px`).nodes[0]).number).toBe(`+1e+1`)
	expect(getDimension(css, valueParser(`+1e-1px`).nodes[0]).number).toBe(`+1e-1`)
	expect(getDimension(css, valueParser(`-1e-1px`).nodes[0]).number).toBe(`-1e-1`)
	expect(getDimension(css, valueParser(`-1e+1px`).nodes[0]).number).toBe(`-1e+1`)
	expect(getDimension(css, valueParser(`.1s`).nodes[0]).number).toBe(`.1`)
	expect(getDimension(css, valueParser(`+.1s`).nodes[0]).number).toBe(`+.1`)
	expect(getDimension(css, valueParser(`-.1s`).nodes[0]).number).toBe(`-.1`)
	expect(getDimension(css, valueParser(`+.1000s`).nodes[0]).number).toBe(`+.1000`)
	expect(getDimension(css, valueParser(`-.1000s`).nodes[0]).number).toBe(`-.1000`)
	expect(getDimension(css, valueParser(`.1e1s`).nodes[0]).number).toBe(`.1e1`)
	expect(getDimension(css, valueParser(`+.1e1s`).nodes[0]).number).toBe(`+.1e1`)
	expect(getDimension(css, valueParser(`-.1e1s`).nodes[0]).number).toBe(`-.1e1`)
	expect(getDimension(css, valueParser(`.1e-1s`).nodes[0]).number).toBe(`.1e-1`)
	expect(getDimension(css, valueParser(`.1e+1s`).nodes[0]).number).toBe(`.1e+1`)
	expect(getDimension(css, valueParser(`+.1e+1s`).nodes[0]).number).toBe(`+.1e+1`)
	expect(getDimension(css, valueParser(`+.1e-1s`).nodes[0]).number).toBe(`+.1e-1`)
	expect(getDimension(css, valueParser(`-.1e-1s`).nodes[0]).number).toBe(`-.1e-1`)
	expect(getDimension(css, valueParser(`-.1e+1s`).nodes[0]).number).toBe(`-.1e+1`)
	expect(getDimension(css, valueParser(`100%`).nodes[0]).number).toBe(`100`)
	expect(getDimension(css, valueParser(`100`).nodes[0]).number).toBe(`100`)
	expect(getDimension(css, valueParser(`0\\0`).nodes[0]).number).toBe(`0`)
	expect(getDimension(css, valueParser(`10px\\9`).nodes[0]).number).toBe(`10`)
	expect(getDimension(css, valueParser(`6e-2px`).nodes[0]).number).toBe(`6e-2`)
	expect(getDimension(css, valueParser(`.0`).nodes[0]).number).toBe(`.0`)
	expect(getDimension(css, valueParser(`+.0`).nodes[0]).number).toBe(`+.0`)
	expect(getDimension(css, valueParser(`-.0`).nodes[0]).number).toBe(`-.0`)
	expect(getDimension(css, valueParser(`.0e1`).nodes[0]).number).toBe(`.0e1`)
	expect(getDimension(css, valueParser(`+.0e1`).nodes[0]).number).toBe(`+.0e1`)
	expect(getDimension(css, valueParser(`-.0e1`).nodes[0]).number).toBe(`-.0e1`)
	expect(getDimension(css, valueParser(`10px#fff`).nodes[0]).number).toBe(`10`)
	expect(getDimension(css, valueParser(`1}px}`).nodes[0]).number).toBe(`1`)

	// testing invalid inputs
	expect(getDimension(css, valueParser(`#fff`).nodes[0]).unit).toBe(null)
	expect(getDimension(css, valueParser(`#000`).nodes[0]).unit).toBe(null)
	expect(getDimension(css, valueParser(`#zzzzzz`).nodes[0]).unit).toBe(null)
	expect(getDimension(css, valueParser(`#F`).nodes[0]).unit).toBe(null)
	expect(getDimension(css, valueParser(`#PX`).nodes[0]).unit).toBe(null)
	expect(getDimension(css, valueParser(`"100"`).nodes[0]).unit).toBe(null)
	expect(getDimension(css, valueParser(`"100px"`).nodes[0]).unit).toBe(null)
	expect(getDimension(css, valueParser(` `).nodes[0]).unit).toBe(null)
	expect(getDimension(css, valueParser(`/`).nodes[0]).unit).toBe(null)
	expect(getDimension(css, valueParser(`+`).nodes[0]).unit).toBe(null)
	expect(getDimension(css, valueParser(`word`).nodes[0]).unit).toBe(null)
	expect(getDimension(css, valueParser(`px`).nodes[0]).unit).toBe(null)
	expect(getDimension(css, valueParser(`url()`).nodes[0]).unit).toBe(null)
	expect(getDimension(css, valueParser(`url()px`).nodes[0]).unit).toBe(null)
	expect(getDimension(css, valueParser(`$variable`).nodes[0]).unit).toBe(null)
	expect(getDimension(css, valueParser(`\${$variable}`).nodes[0]).unit).toBe(null)
	expect(getDimension(css, valueParser(`\${$variable}px`).nodes[0]).unit).toBe(null)
	expect(getDimension(css, valueParser(`\${$variable}px`).nodes[0]).unit).toBe(null)
	expect(getDimension(css, valueParser(`@variable`).nodes[0]).unit).toBe(null)
	expect(getDimension(css, valueParser(`e1`).nodes[0]).unit).toBe(null)
	expect(getDimension(css, valueParser(`wordPX`).nodes[0]).unit).toBe(null)
	expect(getDimension(css, valueParser(`..0`).nodes[0]).unit).toBe(null)

	expect(getDimension(css, valueParser(`#fff`).nodes[0]).number).toBe(null)
	expect(getDimension(css, valueParser(`#000`).nodes[0]).number).toBe(null)
	expect(getDimension(css, valueParser(`#zzzzzz`).nodes[0]).number).toBe(null)
	expect(getDimension(css, valueParser(`#F`).nodes[0]).number).toBe(null)
	expect(getDimension(css, valueParser(`#PX`).nodes[0]).number).toBe(null)
	expect(getDimension(css, valueParser(`"100"`).nodes[0]).number).toBe(null)
	expect(getDimension(css, valueParser(`"100px"`).nodes[0]).number).toBe(null)
	expect(getDimension(css, valueParser(` `).nodes[0]).number).toBe(null)
	expect(getDimension(css, valueParser(`/`).nodes[0]).number).toBe(null)
	expect(getDimension(css, valueParser(`+`).nodes[0]).number).toBe(null)
	expect(getDimension(css, valueParser(`word`).nodes[0]).number).toBe(null)
	expect(getDimension(css, valueParser(`px`).nodes[0]).number).toBe(null)
	expect(getDimension(css, valueParser(`url()`).nodes[0]).number).toBe(null)
	expect(getDimension(css, valueParser(`url()px`).nodes[0]).number).toBe(null)
	expect(getDimension(css, valueParser(`$variable`).nodes[0]).number).toBe(null)
	expect(getDimension(css, valueParser(`\${$variable}`).nodes[0]).number).toBe(null)
	expect(getDimension(css, valueParser(`\${$variable}px`).nodes[0]).number).toBe(null)
	expect(getDimension(css, valueParser(`\${$variable}px`).nodes[0]).number).toBe(null)
	expect(getDimension(css, valueParser(`@variable`).nodes[0]).number).toBe(null)
	expect(getDimension(css, valueParser(`e1`).nodes[0]).number).toBe(null)
	expect(getDimension(css, valueParser(`wordPX`).nodes[0]).number).toBe(null)
	expect(getDimension(css, valueParser(`..0`).nodes[0]).number).toBe(null)
})

it(`getDimension positions`, () => {
	// Where each character of the copy the reading was taken from stands in the text the node holds; a word no cut touches maps onto itself
	expect(getDimension(css, valueParser(`10px`).nodes[0]).positions).toEqual([0, 1, 2, 3])
	expect(getDimension(css, valueParser(`.5REM`).nodes[0]).positions).toEqual([0, 1, 2, 3, 4])
	expect(getDimension(css, valueParser(`1px!important`).nodes[0]).positions).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])

	// A hack unit closing the word leaves the copy ending where the unit does
	expect(getDimension(css, valueParser(`10px\\0`).nodes[0]).positions).toEqual([0, 1, 2, 3])
	expect(getDimension(css, valueParser(`10px\\9`).nodes[0]).positions).toEqual([0, 1, 2, 3])

	// A hack unit standing anywhere else moves everything written behind it
	expect(getDimension(css, valueParser(`1PX\\9!important`).nodes[0]).positions).toEqual([0, 1, 2, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14])
	expect(getDimension(css, valueParser(`10PX\\9*2rem`).nodes[0]).positions).toEqual([0, 1, 2, 3, 6, 7, 8, 9, 10])

	// Only a hack unit is taken out of the copy; what the unit ends in front of stays on the map unread, since the caller measures the run it underlines from the lengths of the number and the unit and never reaches past them
	expect(getDimension(css, valueParser(`2px}`).nodes[0]).positions).toEqual([0, 1, 2, 3])
	expect(getDimension(css, valueParser(`10px#fff`).nodes[0]).positions).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
	expect(getDimension(css, valueParser(`10px#fff\\9`).nodes[0]).positions).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
	expect(getDimension(css, valueParser(`1}px}`).nodes[0]).positions).toEqual([0, 1, 2, 3, 4])

	// Nothing was read, so there is nowhere to point
	expect(getDimension(css).positions).toBe(null)
	expect(getDimension(css, {}).positions).toBe(null)
	expect(getDimension(css, valueParser(`#fff`).nodes[0]).positions).toBe(null)
	expect(getDimension(css, valueParser(`$variable`).nodes[0]).positions).toBe(null)
	expect(getDimension(css, valueParser(`"100px"`).nodes[0]).positions).toBe(null)
	expect(getDimension(css, valueParser(`word`).nodes[0]).positions).toBe(null)
})

it(`getDimension under a syntax that reads a unit shorter than the identifier`, () => {
	// The contract's answer is what the reading turns on, so the core's syntax is asked with that one answer changed (#527, #633)
	let partingSyntax: Syntax = { ...css, readsUnitAsIdentifier: () => false }

	// The unit ends in front of the first escape whatever it spells, and the escaped text is left in the copy and off the unit
	expect(getDimension(partingSyntax, valueParser(`10px\\#fff`).nodes[0]).unit).toBe(`px`)
	expect(getDimension(css, valueParser(`10px\\#fff`).nodes[0]).unit).toBe(`px\\#fff`)
	expect(getDimension(partingSyntax, valueParser(`10PX\\@VAR`).nodes[0]).unit).toBe(`PX`)
	expect(getDimension(partingSyntax, valueParser(`10PX\\!important`).nodes[0]).unit).toBe(`PX`)
	expect(getDimension(partingSyntax, valueParser(`10PX\\*2REM`).nodes[0]).unit).toBe(`PX`)
	expect(getDimension(css, valueParser(`10PX\\*2REM`).nodes[0]).unit).toBe(`PX\\*2REM`)

	// A hexadecimal escape between the letters of a unit ends it as any escape does, where the core reads the letter it spells as the unit's. The value parser parts such a word at the escape's whitespace and the rule welds it back before asking, so the node is built whole here
	let weldedLetter = { type: `word`, value: `10P\\61 X`, sourceIndex: 0, sourceEndIndex: 8 } as const

	expect(getDimension(partingSyntax, weldedLetter).unit).toBe(`P`)
	expect(getDimension(css, weldedLetter).unit).toBe(`P\\61 X`)

	// A hack unit is an escape too: nothing is taken out of the copy, and the unit ends in front of it wherever it stands, so the map is the identity
	let weldedHack = { type: `word`, value: `10PX\\9 2PX`, sourceIndex: 0, sourceEndIndex: 10 } as const

	expect(getDimension(partingSyntax, valueParser(`10P\\9X`).nodes[0]).unit).toBe(`P`)
	expect(getDimension(css, valueParser(`10P\\9X`).nodes[0]).unit).toBe(`PX`)
	expect(getDimension(partingSyntax, valueParser(`10PX\\9`).nodes[0]).unit).toBe(`PX`)
	expect(getDimension(partingSyntax, weldedHack).unit).toBe(`PX`)
	expect(getDimension(css, weldedHack).unit).toBe(`PX`)
	expect(getDimension(partingSyntax, valueParser(`1PX\\9!important`).nodes[0]).positions).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14])

	// An escape standing right behind the number leaves no unit at all
	expect(getDimension(partingSyntax, valueParser(`10\\#fff`).nodes[0]).unit).toBe(``)
	expect(getDimension(css, valueParser(`10\\#fff`).nodes[0]).unit).toBe(`\\#fff`)

	// A character that is no code point of an identifier ends the unit under either answer
	expect(getDimension(partingSyntax, valueParser(`10px#fff`).nodes[0]).unit).toBe(`px`)
	expect(getDimension(partingSyntax, valueParser(`1px!important`).nodes[0]).unit).toBe(`px`)

	// A hyphen ends the unit as an escape does, since Less reads it as the sign of the operand behind it (#633)
	expect(getDimension(partingSyntax, valueParser(`10PX-A`).nodes[0]).unit).toBe(`PX`)
	expect(getDimension(css, valueParser(`10PX-A`).nodes[0]).unit).toBe(`PX-A`)
	expect(getDimension(partingSyntax, valueParser(`10PX-2REM`).nodes[0]).unit).toBe(`PX`)
	expect(getDimension(css, valueParser(`10PX-2REM`).nodes[0]).unit).toBe(`PX-2REM`)
	expect(getDimension(partingSyntax, valueParser(`10PX-`).nodes[0]).unit).toBe(`PX`)
	expect(getDimension(partingSyntax, valueParser(`-2REM`).nodes[0]).unit).toBe(`REM`)

	// An escaped hyphen ends it as an escape, which is the same place
	expect(getDimension(partingSyntax, valueParser(`10PX\\-A`).nodes[0]).unit).toBe(`PX`)
	expect(getDimension(css, valueParser(`10PX\\-A`).nodes[0]).unit).toBe(`PX\\-A`)

	// A hyphen standing right behind the number leaves no unit at all, and Less reads a keyword there: `10-PX-2REM` is `10` and `PX-2REM`
	expect(getDimension(partingSyntax, valueParser(`10-PX`).nodes[0]).unit).toBe(``)
	expect(getDimension(css, valueParser(`10-PX`).nodes[0]).unit).toBe(`-PX`)
})
