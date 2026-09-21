import { describe, expect, it } from "vitest"

import { closingBraceRunWrites } from "./index.ts"

let { newline, space } = closingBraceRunWrites(() => `\n`)

describe(`closingBraceRunWrites`, () => {
	it(`the break rule writes in front of the run's first break, or puts one in front of its first whitespace, and keeps every semicolon`, () => {
		expect(newline(`always`, ` ;\n`)).toBe(`;\n`)
		expect(newline(`always`, ` ; ;\r\n\t`)).toBe(`;;\r\n\t`)
		expect(newline(`always`, ` ; `)).toBe(`\n ; `)
		expect(newline(`always`, `; `)).toBe(`;\n `)
		expect(newline(`always-multi-line`, `;`)).toBe(`;\n`)
		expect(newline(`never-multi-line`, ` ;\n; `)).toBe(`;;`)
	})

	it(`the space rule writes over the whitespace closing the run alone`, () => {
		expect(space(`always`, ` ;\n`)).toBe(` ; `)
		expect(space(`always-multi-line`, `\n;`)).toBe(`\n; `)
		expect(space(`never`, ` ; \n\t`)).toBe(` ;`)
	})
})
