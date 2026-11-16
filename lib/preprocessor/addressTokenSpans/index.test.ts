import { describe, expect, it } from "vitest"

import { addressTokenSpans } from "./index.ts"

describe(`addressTokenSpans`, () => {
	it(`a text holding no quotation mark, which no span of this is asked about`, () => {
		expect(addressTokenSpans(``, `url (a,b)`)).toEqual([])
	})
})
