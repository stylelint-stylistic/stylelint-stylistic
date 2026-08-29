import { describe, expect, it } from "vitest"

import { namesAnAddress } from "./index.ts"

describe(`namesAnAddress`, () => {
	it(`the three letters as a file usually writes them`, () => {
		expect(namesAnAddress(`url`)).toBe(true)
		expect(namesAnAddress(`URL`)).toBe(true)
		expect(namesAnAddress(`Url`)).toBe(true)
	})

	it(`each of the three letters spelled by an escape of either kind`, () => {
		expect(namesAnAddress(`u\\rl`)).toBe(true)
		expect(namesAnAddress(`\\url`)).toBe(true)
		expect(namesAnAddress(`ur\\l`)).toBe(true)
		expect(namesAnAddress(`\\75 rl`)).toBe(true)
		expect(namesAnAddress(`\\55 RL`)).toBe(true)
		expect(namesAnAddress(`\\75\\72\\6c`)).toBe(true)
	})

	it(`a name holding those three letters and something besides, which names a call of its own`, () => {
		expect(namesAnAddress(`image-url`)).toBe(false)
		expect(namesAnAddress(`a\\url`)).toBe(false)
		expect(namesAnAddress(`urls`)).toBe(false)
		expect(namesAnAddress(`ur`)).toBe(false)
	})

	it(`a name of no letters at all`, () => {
		expect(namesAnAddress(``)).toBe(false)
		expect(namesAnAddress(`%`)).toBe(false)
	})

	it(`an escape no code point answers to, which spells the replacement character and no letter`, () => {
		expect(namesAnAddress(`\\0 rl`)).toBe(false)
	})
})
