import { describe, expect, it } from "vitest"

import { cover, keysOf, multiply } from "./matrix.ts"

/** Three axes shaped like the ones `address-in-a-text` grew to: eight places, 33 names, 39 addresses. */
const WIDE = {
	place: Object.fromEntries(Array.from({ length: 8 }, (_, index) => [`p${index}`, `P${index}`])),
	name: Object.fromEntries(Array.from({ length: 33 }, (_, index) => [`n${index}`, `N${index}`])),
	address: Object.fromEntries(Array.from({ length: 39 }, (_, index) => [`a${index}`, `A${index}`])),
}

/**
 * Spells every value it is handed, so a row's text says what it was built from.
 * @param values - One value per axis.
 * @returns The values, each under its axis.
 */
function spell (values: Record<string, string>): string {
	return Object.entries(values).map(([axis, value]) => `${axis}=${value}`).join(` `)
}

/**
 * Names every pair of values two axes make that no row holds.
 * @param axes - The axes.
 * @param rows - The rows, keyed as `cover` keys them.
 * @returns The pairs missing, as `axis=value axis=value`.
 */
function uncoveredPairs (axes: Record<string, Record<string, string>>, rows: [string, string][]): string[] {
	let names = Object.keys(axes)
	let held = new Set(rows.flatMap(([key]) => {
		let values = key.split(`|`)

		return names.flatMap((a, i) => names.slice(i + 1).map((b, j) => `${a}=${values[i]} ${b}=${values[i + 1 + j]}`))
	}))

	return names.flatMap((a, i) => names.slice(i + 1).flatMap((b) => Object.keys(axes[a] ?? {}).flatMap((va) => Object.keys(axes[b] ?? {}).map((vb) => `${a}=${va} ${b}=${vb}`)))).filter((pair) => !held.has(pair))
}

describe(`cover`, () => {
	it(`holds every pair of values two axes make, in as many rows as the two widest axes multiply to`, () => {
		let rows = cover(WIDE, spell)

		expect(uncoveredPairs(WIDE, rows)).toStrictEqual([])
		expect(rows).toHaveLength(33 * 39)
	})

	it(`keys a row by the axes in the order given, whatever order it built them in, and hands the template every axis`, () => {
		let rows = cover(WIDE, spell)
		let [key, text] = rows[0] ?? [``, ``]

		expect(key).toMatch(/^p\d+\|n\d+\|a\d+$/u)
		expect(text).toMatch(/^place=P\d+ name=N\d+ address=A\d+$/u)
		expect(new Set(rows.map(([rowKey]) => rowKey)).size).toBe(rows.length)
	})

	it(`is the product over two axes, one axis and none`, () => {
		let two = { a: keysOf({ x: 1, y: 1 }), b: keysOf({ u: 1, v: 1, w: 1 }) }

		expect(cover(two, spell).toSorted()).toStrictEqual(multiply(two, spell).toSorted())
		expect(cover({ a: keysOf({ x: 1, y: 1 }) }, spell)).toStrictEqual(multiply({ a: keysOf({ x: 1, y: 1 }) }, spell))
		expect(cover({}, spell)).toStrictEqual(multiply({}, spell))
	})

	it(`adds rows where the widest two axes cannot seat every pair of a narrower one`, () => {
		// Two values by two make four rows, and a third axis of five values needs at least five
		let axes = { a: keysOf({ x: 1, y: 1 }), b: keysOf({ u: 1, v: 1 }), c: keysOf({ 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 }) }
		let rows = cover(axes, spell)

		expect(uncoveredPairs(axes, rows)).toStrictEqual([])
		expect(rows.length).toBeGreaterThanOrEqual(10)
		expect(rows.length).toBeLessThan(multiply(axes, spell).length)
	})
})
