import { equal } from "node:assert/strict"
import { it } from "node:test"

import { isSingleLineString } from "./isSingleLineString.js"

let multiLineTemplate = `foo
bar`

it(`isSingleLineString`, () => {
	equal(isSingleLineString(`foo`), true)
	equal(isSingleLineString(`foo bar`), true)
	equal(isSingleLineString(`foo\nbar`), false)
	equal(isSingleLineString(`foo\rbar`), false)
	equal(isSingleLineString(multiLineTemplate), false)
})
