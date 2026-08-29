import { expect, it } from "vitest"

import { isSingleLineString } from "./index.ts"

const MULTI_LINE_TEMPLATE = `foo
bar`

it(`isSingleLineString`, () => {
	expect(isSingleLineString(`foo`)).toBe(true)
	expect(isSingleLineString(`foo bar`)).toBe(true)
	expect(isSingleLineString(`foo\nbar`)).toBe(false)
	expect(isSingleLineString(`foo\r\nbar`)).toBe(false)
	// A bare carriage return or a form feed is whitespace and no break
	expect(isSingleLineString(`foo\rbar`)).toBe(true)
	expect(isSingleLineString(`foo\fbar`)).toBe(true)
	expect(isSingleLineString(MULTI_LINE_TEMPLATE)).toBe(false)
})
