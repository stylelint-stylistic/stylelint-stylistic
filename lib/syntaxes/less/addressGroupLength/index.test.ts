import { describe, expect, it } from "vitest"

import { addressGroupLength } from "./index.ts"

describe(`addressGroupLength`, () => {
	it(`the options of an import, one or several, an empty list, a trailing comma, and comments and whitespace between the tokens, as Less's import options read them`, () => {
		expect(addressGroupLength(` (reference) "a.less"`, `import`)).toBe(12)
		expect(addressGroupLength(` (reference, optional) "a"`, `import`)).toBe(22)
		expect(addressGroupLength(` () "a"`, `import`)).toBe(3)
		expect(addressGroupLength(` (reference,) "a"`, `import`)).toBe(13)
		expect(addressGroupLength(` /*c*/ (/*d*/reference /*e*/) "a"`, `import`)).toBe(29)
		expect(addressGroupLength(` (\n\treference\n) "a"`, `import`)).toBe(15)
	})

	it(`the arguments of a plugin, anything up to the closing parenthesis but a semicolon`, () => {
		expect(addressGroupLength(` (a: 1) "p.js"`, `plugin`)).toBe(7)
		expect(addressGroupLength(` ("x") "p.js"`, `plugin`)).toBe(6)
	})

	it(`no group where Less reads none: no whitespace behind the name, a word Less has no option by, two options with no comma, an option running on into a word, a plugin's empty or semicolon-holding arguments, and no parenthesis at all`, () => {
		expect(addressGroupLength(`(reference) "a"`, `import`)).toBe(0)
		expect(addressGroupLength(` (foo) "a"`, `import`)).toBe(0)
		expect(addressGroupLength(` (reference optional) "a"`, `import`)).toBe(0)
		expect(addressGroupLength(` (referencex) "a"`, `import`)).toBe(0)
		expect(addressGroupLength(` () "p.js"`, `plugin`)).toBe(0)
		expect(addressGroupLength(` (a; b) "p.js"`, `plugin`)).toBe(0)
		expect(addressGroupLength(` "a.less"`, `import`)).toBe(0)
	})
})
