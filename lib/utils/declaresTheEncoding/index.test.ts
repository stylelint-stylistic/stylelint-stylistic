import { type AtRule, type Document, parse, type Root } from "postcss"
import html from "postcss-html"
import { parse as parseScss } from "postcss-scss"
import { describe, expect, it } from "vitest"

import { declaresTheEncoding } from "./index.ts"

let parseHtml = (html as unknown as { parse: (code: string) => Document | Root }).parse

describe(`declaresTheEncoding`, () => {
	it(`the declaration the fallback-encoding step reads`, () => {
		expect(answer(`@charset "UTF-8";`)).toBe(true)
		expect(answer(`@charset "UTF-8";\na { color: pink; }`)).toBe(true)
		expect(answer(`@charset "iso-8859-1";`)).toBe(true)
		expect(answer(`@charset "";`)).toBe(true)
	})

	it(`a head the step does not match, which declares no encoding for a fix to lose`, () => {
		expect(answer(`@charset  "UTF-8";`)).toBe(false)
		expect(answer(`@charset\n"UTF-8";`)).toBe(false)
		expect(answer(`@charset"UTF-8";`)).toBe(false)
		expect(answer(`@charset 'UTF-8';`)).toBe(false)
		expect(answer(`@charset "UTF-8" ;`)).toBe(false)
		expect(answer(`@charset "UTF-8"`)).toBe(false)
		expect(answer(`@CHARSET "UTF-8";`)).toBe(false)
	})

	it(`an at-rule of another name, whose head opens the file all the same`, () => {
		expect(answer(`@media (min-width: 1px) { }`)).toBe(false)
	})

	it(`an at-rule standing behind something, which the step reads past nothing to find`, () => {
		expect(answer(`\n@charset "UTF-8";`)).toBe(false)
		expect(answer(`/* c */@charset "UTF-8";`, 1)).toBe(false)
		expect(answer(`a { }\n@charset "UTF-8";`, 1)).toBe(false)
	})

	it(`a second one behind the declaration, which is the at-rule it looks like`, () => {
		expect(answer(`@charset "UTF-8";\n@charset "UTF-8";`, 1)).toBe(false)
	})

	it(`an at-rule nested in a rule, which opens nothing`, () => {
		expect(answer(`a { @charset "UTF-8"; }`, 0, 0)).toBe(false)
	})

	it(`the same head under another parser`, () => {
		let root = parseScss(`@charset "UTF-8";\n// c\na { color: pink; }`)

		expect(declaresTheEncoding(root.first as AtRule)).toBe(true)
	})

	it(`the head of a file opening with a byte-order mark, which PostCSS takes off the text and leaves the offsets alone`, () => {
		expect(answer(`﻿@charset "UTF-8";\na { color: pink; }`)).toBe(true)
	})

	it(`the head of an embedded block, which no decoder reads`, () => {
		expect(firstAtRuleOf(parseHtml(`<style>@charset "UTF-8";\na { color: pink; }</style>`))).toBe(false)
		expect(firstAtRuleOf(parseHtml(`<style>\n@charset "UTF-8";\na { color: pink; }\n</style>\n`))).toBe(false)
	})
})

/**
 * Asks the util about the first at-rule of a parsed document.
 * @param parsed - What a syntax's parser returned.
 * @returns What the util answers, or false where the document holds no at-rule.
 */
function firstAtRuleOf (parsed: Document | Root): boolean {
	let found: AtRule | undefined

	parsed.walkAtRules((atRule) => {
		found ??= atRule
	})

	return found !== undefined && declaresTheEncoding(found)
}

/**
 * Asks the util about one at-rule of a stylesheet.
 * @param code - The stylesheet.
 * @param index - Which node of the root, the first by default.
 * @param nested - Which node of that node, where the at-rule stands inside it.
 * @returns What the util answers.
 */
function answer (code: string, index: number = 0, nested?: number): boolean {
	let root = parse(code)
	let node = root.nodes[index]

	if (nested !== undefined) node = (node as unknown as { nodes: AtRule[] }).nodes[nested]

	return declaresTheEncoding(node as AtRule)
}
