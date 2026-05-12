import { expect, it } from "vitest"

import { isOnlyWhitespace } from "./index.js"

it(`isOnlyWhitespace`, () => {
	expect(isOnlyWhitespace(`\r\n \t \n   `)).toBe(true)
	expect(isOnlyWhitespace(`   s`)).toBe(false)
	expect(isOnlyWhitespace(`s\t`)).toBe(false)
	expect(isOnlyWhitespace(`\n  .\t`)).toBe(false)
})
