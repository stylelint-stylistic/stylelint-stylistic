import { describe, expect, it } from "vitest"

import { recaseAscii } from "./index.ts"

describe(`recaseAscii`, () => {
	it(`ASCII letters, as the built-in recases them`, () => {
		expect(recaseAscii(`px`, `upper`)).toBe(`PX`)
		expect(recaseAscii(`Px`, `lower`)).toBe(`px`)
		expect(recaseAscii(`px\\9 2rem`, `upper`)).toBe(`PX\\9 2REM`)
	})

	it(`a text already in the case asked for comes back as it is`, () => {
		expect(recaseAscii(`PX`, `upper`)).toBe(`PX`)
		expect(recaseAscii(`10`, `lower`)).toBe(`10`)
	})

	it(`a code point whose upper case is longer stays`, () => {
		expect(recaseAscii(`Aß`, `upper`)).toBe(`Aß`)
		expect(recaseAscii(`pß`, `upper`)).toBe(`Pß`)
		expect(recaseAscii(`pﬁ`, `upper`)).toBe(`Pﬁ`)
	})

	it(`a code point whose lower case is two stays`, () => {
		expect(recaseAscii(`İ`, `lower`)).toBe(`İ`)
		expect(recaseAscii(`Pİ`, `lower`)).toBe(`pİ`)
	})

	it(`a non-ASCII letter with a one-to-one mapping stays too, being part of the name as it stands`, () => {
		expect(recaseAscii(`pé`, `upper`)).toBe(`Pé`)
		expect(recaseAscii(`PÉ`, `lower`)).toBe(`pÉ`)
		expect(recaseAscii(`pſ`, `upper`)).toBe(`Pſ`)
		expect(recaseAscii(`p\u212A`, `lower`)).toBe(`p\u212A`)
	})
})
