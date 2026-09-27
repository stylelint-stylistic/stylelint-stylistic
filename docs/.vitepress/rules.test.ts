import { describe, expect, it } from "vitest"

import factories from "../../lib/rules/index.ts"
import { css } from "../../lib/syntaxes/css/index.ts"

import { readRules } from "./readRules.ts"
import { filterRules } from "./rules.ts"

let rules = readRules()

describe(`readRules`, () => {
	it(`reads every rule of the registry out of the list, and nothing else`, () => {
		expect(rules.map(({ name }) => name).toSorted()).toEqual(Object.keys(factories).toSorted())
	})

	it(`reads the fix mark of an entry as the rule's own`, () => {
		let marked = rules.filter(({ fixable }) => fixable).map(({ name }) => name).toSorted()
		let fixable = Object.entries(factories).filter(([, createRule]) => createRule(css).meta?.fixable).map(([name]) => name).toSorted()

		expect(marked).toEqual(fixable)
	})

	it(`reads the description and the group of an entry`, () => {
		expect(rules.find(({ name }) => name === `color-hex-case`)).toEqual({
			name: `color-hex-case`,
			group: `Color`,
			description: `Specify lowercase or uppercase for hex colors`,
			fixable: true,
		})
	})
})

describe(`filterRules`, () => {
	it(`admits every rule where nothing is typed`, () => {
		expect(filterRules(rules, { query: ``, group: ``, fixableOnly: false })).toHaveLength(rules.length)
	})

	it(`admits a rule by its name, by its description and by its group, in whatever case`, () => {
		expect(filterRules(rules, { query: `HEX-CASE`, group: ``, fixableOnly: false }).map(({ name }) => name)).toEqual([`color-hex-case`])
		expect(filterRules(rules, { query: `unicode bom`, group: ``, fixableOnly: false }).map(({ name }) => name)).toEqual([`unicode-bom`])
		expect(filterRules(rules, { query: `Selector list`, group: ``, fixableOnly: false }).every(({ group }) => group === `Selector list`)).toBe(true)
	})

	it(`matches the bound prose of a description at a plain space`, () => {
		let hexCase = rules.find(({ name }) => name === `color-hex-case`)

		expect(hexCase?.description).toContain(`\u00A0`)
		expect(filterRules(rules, { query: `lowercase or uppercase`, group: ``, fixableOnly: false }).map(({ name }) => name)).toContain(`color-hex-case`)
	})

	it(`leaves out a rule that fixes nothing where the mark is asked for`, () => {
		expect(filterRules(rules, { query: ``, group: ``, fixableOnly: true }).every(({ fixable }) => fixable)).toBe(true)
		expect(filterRules(rules, { query: `max-line-length`, group: ``, fixableOnly: true })).toEqual([])
	})

	it(`admits a rule from the group asked for alone, and every other filter still applies`, () => {
		let selectorList = rules.filter(({ group }) => group === `Selector list`)

		expect(selectorList).not.toHaveLength(0)
		expect(filterRules(rules, { query: ``, group: `Selector list`, fixableOnly: false })).toEqual(selectorList)
		expect(filterRules(rules, { query: `comma-newline-after`, group: `Selector list`, fixableOnly: false }).map(({ name }) => name)).toEqual([`selector-list-comma-newline-after`])
		expect(filterRules(rules, { query: `hex-case`, group: `Selector list`, fixableOnly: false })).toEqual([])
	})
})
