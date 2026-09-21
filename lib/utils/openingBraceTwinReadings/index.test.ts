import { describe, expect, it } from "vitest"

import { openingBraceTwinReadings } from "./index.ts"

let { newline, space } = openingBraceTwinReadings(() => `\n`)

describe(`openingBraceTwinReadings`, () => {
	it(`the break rule reads the run's first character`, () => {
		expect(newline.accepts(`always`, `\n;`)).toBe(true)
		expect(newline.accepts(`always-multi-line`, `\r\n\t; `)).toBe(true)
		expect(newline.accepts(`always`, ` ;\n`)).toBe(false)
		expect(newline.accepts(`always`, `;\n`)).toBe(false)
		expect(newline.accepts(`never-multi-line`, `;\n`)).toBe(true)
		expect(newline.accepts(`never-multi-line`, ``)).toBe(true)
		expect(newline.accepts(`never-multi-line`, ` ;`)).toBe(false)
	})

	it(`the break rule spells the whitespace the run opens with and keeps what stands behind it`, () => {
		expect(newline.writes(`always`, ` ;\n`)).toBe(`\n ;\n`)
		expect(newline.writes(`always`, `;`)).toBe(`\n;`)
		expect(newline.writes(`always-multi-line`, ` \r\n\t;\n`)).toBe(`\r\n\t;\n`)
		expect(newline.writes(`always`, ` \n `)).toBe(`\n `)
		expect(newline.writes(`never-multi-line`, `\n\t;\n`)).toBe(`;\n`)
		expect(newline.writes(`never-multi-line`, ` \n`)).toBe(``)
	})

	it(`the space rule reads the run's first two characters`, () => {
		expect(space.accepts(`always`, ` ;\n`)).toBe(true)
		expect(space.accepts(`always-single-line`, ` `)).toBe(true)
		expect(space.accepts(`always`, `  ;`)).toBe(false)
		expect(space.accepts(`always`, `;`)).toBe(false)
		expect(space.accepts(`always`, `\n;`)).toBe(false)
		expect(space.accepts(`never`, `;\n`)).toBe(true)
		expect(space.accepts(`never-multi-line`, ``)).toBe(true)
		expect(space.accepts(`never`, `\t;`)).toBe(false)
	})

	it(`the space rule writes a space or nothing over the whitespace the run opens with, and keeps what stands behind it`, () => {
		expect(space.writes(`always`, `;\n`)).toBe(` ;\n`)
		expect(space.writes(`always-multi-line`, `\n\t; `)).toBe(` ; `)
		expect(space.writes(`never`, ` ; `)).toBe(`; `)
		expect(space.writes(`never-single-line`, `\n`)).toBe(``)
	})
})
