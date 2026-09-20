import { AtRule, Declaration, parse, Rule } from "postcss"
import html from "postcss-html"
import less from "postcss-less"
import scss from "postcss-scss"
import { describe, expect, it } from "vitest"

import { rawInFrontOfText } from "./index.ts"

/** A parser, as the syntaxes declare theirs over a document as well as a root. */
type Parser = { parse: (source: string) => ReturnType<typeof parse> }

/**
 * Parses a stylesheet and reads the raw in front of the text of its first at-rule, rule or declaration.
 * @param source - The stylesheet.
 * @param kind - Which node to ask about.
 * @param options - Which of the nodes of that kind, and the parser to read the stylesheet with.
 * @param options.syntax - The parser, where the stylesheet is not plain CSS.
 * @param options.nth - The node's place among those of its kind, the first by default.
 * @returns The raw.
 */
function rawOf (source: string, kind: `atrule` | `rule` | `decl`, { syntax, nth = 0 }: { syntax?: Parser, nth?: number } = {}): string {
	let root = syntax ? syntax.parse(source) : parse(source)
	let found: (AtRule | Rule | Declaration)[] = []

	if (kind === `atrule`) root.walkAtRules((node) => { found.push(node) })
	if (kind === `rule`) root.walkRules((node) => { found.push(node) })
	if (kind === `decl`) root.walkDecls((node) => { found.push(node) })

	let node = found[nth]

	if (!node) throw new Error(`The stylesheet holds no such node`)

	return rawInFrontOfText(node)
}

describe(`rawInFrontOfText`, () => {
	it(`hands back an at-rule's raws.afterName, where the parser files the comments too`, () => {
		expect(rawOf(`@media\n,a { b { c: d } }`, `atrule`)).toBe(`\n`)
		expect(rawOf(`@media ,a { b { c: d } }`, `atrule`)).toBe(` `)
		expect(rawOf(`@media /*x*/\n,a { b { c: d } }`, `atrule`)).toBe(` /*x*/\n`)
	})

	it(`hands back a rule's leading run, which a comment in front of it is no part of`, () => {
		expect(rawOf(`x {}\n,a { b: c }`, `rule`, { nth: 1 })).toBe(`\n`)
		expect(rawOf(`x {},a { b: c }`, `rule`, { nth: 1 })).toBe(``)
		expect(rawOf(`\n,a { b: c }`, `rule`)).toBe(`\n`)
		expect(rawOf(`/* c */\n,a { b: c }`, `rule`)).toBe(`\n`)
	})

	it(`hands back a declaration's raws.between, the colon and all`, () => {
		expect(rawOf(`a { b:\n/c }`, `decl`)).toBe(`:\n`)
		expect(rawOf(`a { b: /c }`, `decl`)).toBe(`: `)
		expect(rawOf(`a { b:/c }`, `decl`)).toBe(`:`)
	})

	it(`reads the same raws under the preprocessor parsers`, () => {
		expect(rawOf(`@media\n,a { b { c: d } }`, `atrule`, { syntax: scss as unknown as Parser })).toBe(`\n`)
		expect(rawOf(`@media\n,a { b { c: d } }`, `atrule`, { syntax: less as unknown as Parser })).toBe(`\n`)
		expect(rawOf(`a { b:\n/c }`, `decl`, { syntax: scss as unknown as Parser })).toBe(`:\n`)
		expect(rawOf(`a { b:\n/c }`, `decl`, { syntax: less as unknown as Parser })).toBe(`:\n`)
	})

	it(`opens a root's first statement with the host code the embedded stylesheet stands in`, () => {
		expect(rawOf(`<style>\n,a { b: c }</style>`, `rule`, { syntax: html as unknown as Parser })).toBe(`<style>\n`)
		expect(rawOf(`<style>,a { b: c }</style>`, `rule`, { syntax: html as unknown as Parser })).toBe(`<style>`)
		expect(rawOf(`<style>x {}\n,a { b: c }</style>`, `rule`, { syntax: html as unknown as Parser, nth: 1 })).toBe(`\n`)
	})

	it(`hands back the empty raw where the parser filed none`, () => {
		expect(rawInFrontOfText(new AtRule({ name: `media`, params: `a` }))).toBe(``)
		expect(rawInFrontOfText(new Declaration({ prop: `color`, value: `pink` }))).toBe(``)
	})
})
