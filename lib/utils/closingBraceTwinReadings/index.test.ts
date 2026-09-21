import { describe, expect, it } from "vitest"

import { closingBraceTwinReadings } from "./index.ts"

let { newline, space } = closingBraceTwinReadings(() => `\n`)

describe(`closingBraceTwinReadings`, () => {
	it(`the break rule measures the run with its first run of semicolons cut out`, () => {
		expect(newline.accepts(`always`, `;\n`)).toBe(true)
		expect(newline.accepts(`always-multi-line`, `;;\n\t`)).toBe(true)
		expect(newline.accepts(`always`, `\n ; `)).toBe(true)
		expect(newline.accepts(`always`, ` ;\n`)).toBe(false)
		expect(newline.accepts(`always`, `; `)).toBe(false)
		expect(newline.accepts(`never-multi-line`, `;`)).toBe(true)
		expect(newline.accepts(`never-multi-line`, `; `)).toBe(false)
		// Only the first run is cut, so a second one is what the option refuses
		expect(newline.accepts(`never-multi-line`, `;\n;`)).toBe(false)
	})

	it(`the break rule writes in front of the run's first break, or puts one in front of its first whitespace, and keeps every semicolon`, () => {
		expect(newline.writes(`always`, ` ;\n`)).toBe(`;\n`)
		expect(newline.writes(`always`, ` ; ;\r\n\t`)).toBe(`;;\r\n\t`)
		expect(newline.writes(`always`, ` ; `)).toBe(`\n ; `)
		expect(newline.writes(`always`, `; `)).toBe(`;\n `)
		expect(newline.writes(`always-multi-line`, `;`)).toBe(`;\n`)
		expect(newline.writes(`never-multi-line`, ` ;\n; `)).toBe(`;;`)
	})

	it(`the space rule reads the two characters in front of the brace`, () => {
		expect(space.accepts(`always`, `\n; `)).toBe(true)
		expect(space.accepts(`always-single-line`, ` `)).toBe(true)
		expect(space.accepts(`always`, `;  `)).toBe(false)
		expect(space.accepts(`always`, `;\n `)).toBe(false)
		expect(space.accepts(`always`, `;`)).toBe(false)
		expect(space.accepts(`never`, ` ;`)).toBe(true)
		expect(space.accepts(`never-multi-line`, ``)).toBe(true)
		expect(space.accepts(`never`, `;\n`)).toBe(false)
	})

	it(`the space rule writes over the whitespace closing the run alone`, () => {
		expect(space.writes(`always`, ` ;\n`)).toBe(` ; `)
		expect(space.writes(`always-multi-line`, `\n;`)).toBe(`\n; `)
		expect(space.writes(`never`, ` ; \n\t`)).toBe(` ;`)
	})
})
