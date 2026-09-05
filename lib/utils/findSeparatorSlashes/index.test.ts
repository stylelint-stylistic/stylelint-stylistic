import { type Declaration, parse, type Rule } from "postcss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { css } from "../../syntaxes/css/index.ts"

import { findSeparatorSlashes, type SlashOptions } from "./index.ts"

/** The least of a Stylelint result, which names no syntax: every text below is plain CSS. */
const RESULT = {} as unknown as PostcssResult

/** A declaration of plain CSS, asked about the syntax of every text below; the text itself is handed over beside it, so a text PostCSS would refuse in a stylesheet is read all the same. */
const DECL = (parse(`a { b: c }`).first as Rule).first as Declaration

/**
 * Finds the separator solidi of a value written in plain CSS.
 * @param value - The value.
 * @param options - What the walk is told, a declaration's reading unless said otherwise.
 * @returns The indices, counted in the value.
 */
function slashesOf (value: string, options: Partial<SlashOptions> = {}): number[] {
	return findSeparatorSlashes(value, css, DECL, RESULT, { readsGroups: false, ...options })
}

describe(`findSeparatorSlashes`, () => {
	it(`finds the solidus between two parts of a value, wherever it stands and however it is spaced`, () => {
		expect(slashesOf(`1/2`)).toEqual([1])
		expect(slashesOf(`1 / 2 3/4`)).toEqual([2, 7])
		expect(slashesOf(`1\v/ 2`)).toEqual([2])
		expect(slashesOf(`/2`)).toEqual([0])
		expect(slashesOf(`1/`)).toEqual([1])
	})

	it(`passes over two solidi in a row, which separate nothing, and reads a solidus standing apart from such a pair`, () => {
		expect(slashesOf(`1//2`)).toEqual([])
		expect(slashesOf(`1px!important//`)).toEqual([])
		expect(slashesOf(`1 / //c`)).toEqual([2])
		expect(slashesOf(`1/*c*// 2`)).toEqual([6])
	})

	it(`finds the solidus inside a call that is no address and no math function`, () => {
		expect(slashesOf(`rgb(0 0 0/50%)`)).toEqual([9])
		expect(slashesOf(`fn(g(1/2))`)).toEqual([6])
		expect(slashesOf(`var(--a)/2`)).toEqual([8])
	})

	it(`passes over an address, whatever spelling its name is written in`, () => {
		expect(slashesOf(`url(a/b.png)`)).toEqual([])
		expect(slashesOf(`url("a/b.png")`)).toEqual([])
		expect(slashesOf(`URL(a/b.png)`)).toEqual([])
		expect(slashesOf(`u\\rl(a/b.png)`)).toEqual([])
	})

	it(`passes over the tail of a bare address the parser closed on the first parenthesis, which the tokenizer closes on the matching one`, () => {
		expect(slashesOf(`url(var(--a) c/2)`)).toEqual([])
		expect(slashesOf(`url(var(--a) c/2) 3/4`)).toEqual([19])
		expect(slashesOf(`url(a\\)/b) 3/4`)).toEqual([12])
		expect(slashesOf(`url("a)b" /2) 3/4`)).toEqual([15])
	})

	it(`passes over the arguments of a math function, in whatever case and behind whatever vendor prefix it is named`, () => {
		expect(slashesOf(`calc(1/2)`)).toEqual([])
		expect(slashesOf(`CALC(1 / 2)`)).toEqual([])
		expect(slashesOf(`-webkit-calc(1/2)`)).toEqual([])
		expect(slashesOf(`min(1/2)`)).toEqual([])
		expect(slashesOf(`clamp(1px, 2/3, 4px)`)).toEqual([])
		expect(slashesOf(`calc(var(--a, 1/2) / 2)`)).toEqual([])
	})

	it(`passes over a string and a comment, and places the solidus standing beside a comment in the text the file spells`, () => {
		expect(slashesOf(`"1/2"`)).toEqual([])
		expect(slashesOf(`1 /* a/b */ / 2`)).toEqual([12])
		expect(slashesOf(`1/*c*// 2`)).toEqual([6])
		expect(slashesOf(`1 /*/ a/b */ / 2`)).toEqual([13])
	})

	it(`passes over a call the options name, everything inside it included`, () => {
		expect(slashesOf(`fn(1/2)`, { ignoreFunctions: [`fn`] })).toEqual([])
		expect(slashesOf(`fn(g(1/2))`, { ignoreFunctions: [`fn`] })).toEqual([])
		expect(slashesOf(`fn(1/2)`, { ignoreFunctions: [`/^f/`] })).toEqual([])
		expect(slashesOf(`fn(1/2)`, { ignoreFunctions: [`g`] })).toEqual([4])
	})

	it(`passes over a call the syntax does not read as one`, () => {
		expect(slashesOf(`#{$a}(1/2)`)).toEqual([])
	})

	it(`reads into a parenthesised group only where told to, as the media rules are`, () => {
		expect(slashesOf(`(1/2)`)).toEqual([])
		expect(slashesOf(`(1/2)`, { readsGroups: true })).toEqual([2])
		expect(slashesOf(`((aspect-ratio: 16/9))`, { readsGroups: true })).toEqual([18])
		expect(slashesOf(`(url(a/b))`, { readsGroups: true })).toEqual([])
	})
})
