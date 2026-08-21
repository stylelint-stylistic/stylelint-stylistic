import { expect, it } from "vitest"

import { isSingleLineString } from "./index.js"

const MULTI_LINE_TEMPLATE = `foo
bar`

it(`isSingleLineString`, () => {
	expect(isSingleLineString(`foo`)).toBe(true)
	expect(isSingleLineString(`foo bar`)).toBe(true)
	expect(isSingleLineString(`foo\nbar`)).toBe(false)
	expect(isSingleLineString(`foo\rbar`)).toBe(false)
	expect(isSingleLineString(MULTI_LINE_TEMPLATE)).toBe(false)
})
