import { parse, type Root, type Rule } from "postcss"
import { describe, expect, it } from "vitest"

import { isRule } from "../typeGuards/index.ts"

import { forgetPinnedRaws, notePin, notePinReads, noteRaws, readByRules, writesByRules } from "./index.ts"

/**
 * Parses a stylesheet and pins the run in front of the brace of the rule it holds, as the pass in front of a check does.
 * @returns The root, the rule, and the raws as they stood before the pins wrapped them.
 */
function pinned (): { root: Root, rule: Rule, plain: Record<string, unknown> } {
	let root = parse(`a {\n  color: red;\n}`)
	let first = root.first

	if (first === undefined || !isRule(first)) throw new Error(`The fixture must hold a rule`)

	let plain = first.raws as Record<string, unknown>

	noteRaws(root, first)
	notePin(root, first, `after`)

	return { root, rule: first, plain }
}

describe(`the raws a pin wrote`, () => {
	it(`are read by no rule until one runs`, () => {
		let { root, rule } = pinned()

		expect(readByRules(root, rule, `after`)).toBe(false)
	})

	it(`are read by a rule that takes the raw`, () => {
		let { root, rule } = pinned()

		notePinReads(root, () => {
			expect(rule.raws.after).toBe(rule.raws.after)
		})

		expect(readByRules(root, rule, `after`)).toBe(true)
	})

	it(`are read by a rule that writes over one`, () => {
		let { root, rule } = pinned()

		notePinReads(root, () => {
			rule.raws.after = `\n`
		})

		expect(readByRules(root, rule, `after`)).toBe(true)
	})

	// A raw of a node no pin wrote is read by rules as often, and its reading settles nothing about a pin
	it(`are read apart from a raw no pin wrote, though a rule reads it`, () => {
		let { root, rule } = pinned()

		notePinReads(root, () => {
			expect(rule.raws.semicolon).toBe(rule.raws.semicolon)
		})

		expect(readByRules(root, rule, `semicolon`)).toBe(false)
		expect(readByRules(root, rule, `after`)).toBe(false)
	})

	// The pin pass itself and the print both read the raws, and neither is a rule of the plugin's answer
	it(`are read by no rule where no rule runs`, () => {
		let { root, rule } = pinned()

		expect(rule.raws.after).toBe(rule.raws.after)

		expect(readByRules(root, rule, `after`)).toBe(false)
	})

	it(`are counted as written only where a rule of the plugin writes them`, () => {
		let { root, rule } = pinned()

		expect(writesByRules(root, `after`)).toBe(0)

		rule.raws.after = `\n`

		expect(writesByRules(root, `after`)).toBe(0)

		notePinReads(root, () => {
			rule.raws.after = `\n`
			rule.raws.before = `\n`
		})

		expect(writesByRules(root, `after`)).toBe(1)
		expect(writesByRules(root, `before`)).toBe(1)
	})

	// A rule that takes a raw off moves what PostCSS invents around the node as much as one that writes another value there
	it(`are counted as written where a rule of the plugin takes one off`, () => {
		let { root, rule } = pinned()

		notePinReads(root, () => {
			delete rule.raws.after
		})

		expect(writesByRules(root, `after`)).toBe(1)
		expect(readByRules(root, rule, `after`)).toBe(true)
	})

	it(`are read by a rule of one root and of no rule of another`, () => {
		let { root, rule } = pinned()
		let other = parse(`b {}`)
		let first = other.first

		if (first === undefined || !isRule(first)) throw new Error(`The fixture must hold a rule`)

		noteRaws(other, first)
		notePin(other, first, `after`)

		notePinReads(other, () => {
			expect(first.raws.after).toBe(first.raws.after)
		})

		expect(readByRules(other, first, `after`)).toBe(true)
		expect(readByRules(root, rule, `after`)).toBe(false)
	})

	it(`stand behind the raws they held once the root is forgotten`, () => {
		let { root, rule, plain } = pinned()

		notePinReads(root, () => {
			expect(rule.raws.after).toBe(rule.raws.after)
		})

		forgetPinnedRaws(root)

		expect(rule.raws).toBe(plain)
		expect(readByRules(root, rule, `after`)).toBe(false)
		expect(writesByRules(root, `after`)).toBe(0)
	})

	// Raws put on a node in place of the wrapper are the writer's own, and stand where its owner left them
	it(`leave raws another writer put in place of the wrapper`, () => {
		let { root, rule } = pinned()
		let own = { ...(rule.raws as Record<string, unknown>), before: `\n` }

		rule.raws = own

		forgetPinnedRaws(root)

		expect(rule.raws).toBe(own)
	})
})
