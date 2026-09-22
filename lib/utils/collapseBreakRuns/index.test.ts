import { describe, expect, it } from "vitest"

import { collapseBreakRuns, holdsLongerBreakRun } from "./index.ts"

describe(`holdsLongerBreakRun`, () => {
	it(`no run`, () => {
		expect(holdsLongerBreakRun(`1px 2px`, 1)).toBe(false)
	})

	it(`a run of as many breaks as allowed`, () => {
		expect(holdsLongerBreakRun(`1px\n\n2px`, 2)).toBe(false)
	})

	it(`a run of one break more`, () => {
		expect(holdsLongerBreakRun(`1px\n\n\n2px`, 2)).toBe(true)
	})

	it(`a run spelled with Windows pairs`, () => {
		expect(holdsLongerBreakRun(`1px\r\n\r\n\r\n2px`, 2)).toBe(true)
	})

	it(`a run spelling a line feed and then a Windows pair, which is two breaks to PostCSS (#732)`, () => {
		expect(holdsLongerBreakRun(`1px\n\r\n2px`, 1)).toBe(true)
	})

	it(`a bare carriage return, which is whitespace and no break, parting two runs of one`, () => {
		expect(holdsLongerBreakRun(`1px\n\r\r\n2px`, 1)).toBe(false)
	})

	it(`a run inside the blanked span, which the copy no longer spells`, () => {
		expect(holdsLongerBreakRun(`1px            2px`, 1)).toBe(false)
	})
})

describe(`collapseBreakRuns`, () => {
	it(`no run`, () => {
		expect(collapseBreakRuns(`1px /*c*/ 2px`, `1px       2px`, 1)).toBe(`1px /*c*/ 2px`)
	})

	it(`a run outside the blanked span`, () => {
		expect(collapseBreakRuns(`1px /*c*/\n\n\n2px`, `1px      \n\n\n2px`, 1)).toBe(`1px /*c*/\n2px`)
	})

	it(`a run inside the blanked span, which the copy no longer spells`, () => {
		expect(collapseBreakRuns(`1px /*a\n\n\nb*/ 2px`, `1px            2px`, 1)).toBe(`1px /*a\n\n\nb*/ 2px`)
	})

	it(`two runs, the text keeping what the copy blanked between them`, () => {
		expect(collapseBreakRuns(`a\n\n\n/*c*/\n\n\nb`, `a\n\n\n     \n\n\nb`, 1)).toBe(`a\n/*c*/\nb`)
	})

	it(`a run of Windows pairs, kept as spelled`, () => {
		expect(collapseBreakRuns(`a\r\n\r\n\r\nb`, `a\r\n\r\n\r\nb`, 2)).toBe(`a\r\n\r\nb`)
	})

	it(`a run spelling its breaks both ways, cut to its first breaks as they are spelled (#732)`, () => {
		expect(collapseBreakRuns(`a\n\r\n\r\n\r\nb`, `a\n\r\n\r\n\r\nb`, 2)).toBe(`a\n\r\nb`)
	})

	it(`a run no longer than allowed, left alone`, () => {
		expect(collapseBreakRuns(`a\n\r\nb`, `a\n\r\nb`, 2)).toBe(`a\n\r\nb`)
	})
})
