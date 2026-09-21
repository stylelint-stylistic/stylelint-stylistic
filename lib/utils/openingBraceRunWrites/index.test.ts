import { describe, expect, it } from "vitest"

import { openingBraceRunWrites } from "./index.ts"

let { newline, space } = openingBraceRunWrites(() => `\n`)

describe(`openingBraceRunWrites`, () => {
	it(`the break rule spells the whitespace the run opens with and keeps what stands behind it`, () => {
		expect(newline(`always`, ` ;\n`)).toBe(`\n ;\n`)
		expect(newline(`always`, `;`)).toBe(`\n;`)
		expect(newline(`always-multi-line`, ` \r\n\t;\n`)).toBe(`\r\n\t;\n`)
		expect(newline(`always`, ` \n `)).toBe(`\n `)
		expect(newline(`never-multi-line`, `\n\t;\n`)).toBe(`;\n`)
		expect(newline(`never-multi-line`, ` \n`)).toBe(``)
	})

	it(`the space rule writes a space or nothing over the whitespace the run opens with, and keeps what stands behind it`, () => {
		expect(space(`always`, `;\n`)).toBe(` ;\n`)
		expect(space(`always-multi-line`, `\n\t; `)).toBe(` ; `)
		expect(space(`never`, ` ; `)).toBe(`; `)
		expect(space(`never-single-line`, `\n`)).toBe(``)
	})
})
