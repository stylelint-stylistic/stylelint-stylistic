import { equal } from "node:assert/strict"
import { it } from "node:test"

import { isOnlyWhitespace } from "./isOnlyWhitespace.js"

it(`isOnlyWhitespace`, () => {
	equal(isOnlyWhitespace(`\r\n \t \n   `), true)
	equal(isOnlyWhitespace(`   s`), false)
	equal(isOnlyWhitespace(`s\t`), false)
	equal(isOnlyWhitespace(`\n  .\t`), false)
})
