import { type AtRule, parse, type Rule } from "postcss"
import { describe, expect, it } from "vitest"

import { css } from "../../syntaxes/css/index.ts"

import { restoreRunsFoldedIntoTheText } from "./index.ts"

describe(`restoreRunsFoldedIntoTheText`, () => {
	it(`puts the run behind a seventh digit into the block's final raw, which the tokenizer left the value holding`, () => {
		let root = parse(`a { b: \\0000311 }`)

		restoreRunsFoldedIntoTheText(root, css)

		expect(print(root)).toEqual(`a { b: \\0000311 }`)
		expect(value(root)).toEqual(`\\0000311`)
		expect(after(root)).toEqual(` `)
	})

	it(`puts it in front of the raw the block already holds, the two runs making one`, () => {
		let root = parse(`a { b: \\0000311  }`)

		restoreRunsFoldedIntoTheText(root, css)

		expect(after(root)).toEqual(`  `)
		expect(value(root)).toEqual(`\\0000311`)
	})

	it(`puts the run of a blockless at-rule's params into its own \`raws.between\`, which the rules read before the brace`, () => {
		let root = parse(`a { @include \\0000311 }`)

		restoreRunsFoldedIntoTheText(root, css)

		let atRule = ((root.first as Rule).last as AtRule)

		expect(atRule.params).toEqual(`\\0000311`)
		expect(atRule.raws.between).toEqual(` `)
		expect(print(root)).toEqual(`a { @include \\0000311 }`)
	})

	it(`puts it in front of the between it already holds, the two runs making one`, () => {
		let root = parse(`a { @include \\0000311  }`)

		restoreRunsFoldedIntoTheText(root, css)

		let atRule = ((root.first as Rule).last as AtRule)

		expect(atRule.params).toEqual(`\\0000311`)
		expect(atRule.raws.between).toEqual(`  `)
		expect(print(root)).toEqual(`a { @include \\0000311  }`)
	})

	it(`leaves the run of a blockless at-rule standing behind its own semicolon, which the block's final raw already holds`, () => {
		let root = parse(`a { @include \\0000311; }`)

		restoreRunsFoldedIntoTheText(root, css)

		expect(((root.first as Rule).last as AtRule).params).toEqual(`\\0000311`)
		expect(after(root)).toEqual(` `)
		expect(print(root)).toEqual(`a { @include \\0000311; }`)
	})

	it(`leaves the params of a blockless at-rule that does not close its block, the space standing behind its own node`, () => {
		let root = parse(`a { @include \\0000311 \n\tb: c }`)

		restoreRunsFoldedIntoTheText(root, css)

		expect(((root.first as Rule).first as AtRule).params).toEqual(`\\0000311 \n\tb: c`)
		expect(print(root)).toEqual(`a { @include \\0000311 \n\tb: c }`)
	})

	it(`leaves the space closing an escape of six digits or fewer in the params of a blockless at-rule too`, () => {
		let root = parse(`a { @include \\000031 }`)

		restoreRunsFoldedIntoTheText(root, css)

		expect(((root.first as Rule).last as AtRule).params).toEqual(`\\000031 `)
		expect(print(root)).toEqual(`a { @include \\000031 }`)
	})

	it(`puts the run of a selector into its brace's own raw`, () => {
		let root = parse(`a\\0000311 { b: c }`)

		restoreRunsFoldedIntoTheText(root, css)

		let rule = (root.first as Rule)

		expect(rule.selector).toEqual(`a\\0000311`)
		expect(rule.raws.between).toEqual(` `)
		expect(print(root)).toEqual(`a\\0000311 { b: c }`)
	})

	it(`puts the run of an at-rule's params there as well`, () => {
		let root = parse(`@media x\\0000311 { a: b }`)

		restoreRunsFoldedIntoTheText(root, css)

		let atRule = (root.first as AtRule)

		expect(atRule.params).toEqual(`x\\0000311`)
		expect(atRule.raws.between).toEqual(` `)
	})

	it(`leaves the space closing an escape of six digits or fewer, which is a character of it and no run`, () => {
		for (let stylesheet of [`a { b: \\000031 }`, `a { b: \\31 }`, `a { b: \\31\t}`, `a\\000031 { b: c }`, `@media x\\000031 { a: b }`]) {
			let root = parse(stylesheet)

			restoreRunsFoldedIntoTheText(root, css)

			expect(print(root)).toEqual(stylesheet)
		}
	})

	it(`leaves a value whose own semicolon takes the run in front of it`, () => {
		let root = parse(`a { b: \\0000311 ; }`)

		restoreRunsFoldedIntoTheText(root, css)

		expect(value(root)).toEqual(`\\0000311 `)
		expect(after(root)).toEqual(` `)
		expect(print(root)).toEqual(`a { b: \\0000311 ; }`)
	})

	it(`leaves a value behind a flag, whose run stands in the flag's own raw`, () => {
		let root = parse(`a { b: \\0000311 !important }`)

		restoreRunsFoldedIntoTheText(root, css)

		expect(value(root)).toEqual(`\\0000311 `)
		expect(after(root)).toEqual(` `)
		expect(print(root)).toEqual(`a { b: \\0000311 !important }`)
	})

	it(`leaves a custom property, whose run PostCSS keeps in the value and the rules read there`, () => {
		let root = parse(`a { --b: \\0000311 }`)

		restoreRunsFoldedIntoTheText(root, css)

		expect(value(root)).toEqual(`\\0000311 `)
		expect(after(root)).toEqual(``)
		expect(print(root)).toEqual(`a { --b: \\0000311 }`)
	})

	it(`leaves a tab or a break behind the seventh digit, which the tokenizer never swallows`, () => {
		for (let stylesheet of [`a { b: \\0000311\t}`, `a { b: \\0000311\n}`, `a\\0000311\t{ b: c }`, `a\\0000311\n{ b: c }`]) {
			let root = parse(stylesheet)

			restoreRunsFoldedIntoTheText(root, css)

			expect(print(root)).toEqual(stylesheet)
		}
	})

	it(`leaves a stylesheet whose escape opens no run, the shape the gate over it turns away`, () => {
		let root = parse(`a { b: red }\nc\\31 { d: e }`)
		let before = print(root)

		restoreRunsFoldedIntoTheText(root, css)

		expect(value(root)).toEqual(`red`)
		expect(after(root)).toEqual(` `)
		expect((root.first as Rule).raws.between).toEqual(` `)
		expect(print(root)).toEqual(before)
	})
})

/**
 * Prints a stylesheet as the file spells it.
 * @param root - The stylesheet.
 * @returns The text.
 */
function print (root: { toString: () => string }): string {
	return root.toString()
}

/**
 * Reads the value of the stylesheet's one declaration.
 * @param root - The stylesheet.
 * @returns The value, and nothing where the stylesheet holds no declaration.
 */
function value (root: { first?: unknown }): string | undefined {
	return (root.first as { last?: { type: string, value?: string } } | undefined)?.last?.type === `decl`
		? (root.first as { last: { value: string } }).last.value
		: undefined
}

/**
 * Reads the final raw of the stylesheet's one block.
 * @param root - The stylesheet.
 * @returns The raw.
 */
function after (root: { first?: unknown }): string {
	return (root.first as { raws: { after: string } }).raws.after
}
