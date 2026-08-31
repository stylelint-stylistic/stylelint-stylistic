import { type Comment, parse as parseCss } from "postcss"
import { parse as parseScss } from "postcss-scss"
import { describe, expect, it } from "vitest"

import { isStandardSyntaxComment } from "./index.ts"

describe(`isStandardSyntaxComment`, () => {
	it(`standard single-line comment`, () => {
		expect(isStandardSyntaxComment(css(`/* foo */`))).toBe(true)
	})

	it(`standard multi-line comment`, () => {
		expect(isStandardSyntaxComment(css(`/*\n foo \n*/`))).toBe(true)
	})

	it(`SCSS inline comment`, () => {
		expect(isStandardSyntaxComment(scss(`// foo`))).toBe(false)
	})
})

/**
 * Reads the first node of a stylesheet, which the cases spell as a comment.
 * @param code - The stylesheet.
 * @returns That comment.
 */
function css (code: string): Comment {
	return parseCss(code).first as Comment
}

/**
 * Reads the first node of a stylesheet written in SCSS, which the cases spell as a comment.
 * @param code - The stylesheet.
 * @returns That comment.
 */
function scss (code: string): Comment {
	return parseScss(code).first as Comment
}
