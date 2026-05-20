import { readFile } from "node:fs/promises"

import { describe, expect, it } from "vitest"

import { addNamespace } from "../utils/addNamespace/index.js"
import { getRuleDocUrl } from "../utils/getRuleDocUrl/index.js"

import rules from "./index.js"

let ruleEntries = Object.entries(rules)

describe(`all rules`, () => {
	it(`not empty`, () => {
		expect(ruleEntries.length).toBeGreaterThan(0)
	})

	for (const [ruleName, rule] of ruleEntries) {
		describe(`"${ruleName}"`, () => {
			it(`is a function`, () => {
				expect(typeof rule).toBe(`function`)
			})

			it(`has the "ruleName" property`, () => {
				expect(rule.ruleName).toBe(addNamespace(ruleName))
			})

			it(`has the "messages" property`, () => {
				expect(typeof rule.messages).toBe(`object`)
			})

			it(`has the "meta" property`, () => {
				expect(typeof rule.meta).toBe(`object`)
				expect(rule.meta.url).toContain(ruleName)
			})
		})
	}
})

let ruleNames = Object.keys(rules)
let rulesListDoc = await getRulesListDoc()

/**
 * Retrieves the documentation for the rules list.
 *
 * @returns {Promise<string>} The content of the rules list documentation in UTF-8 format.
 */
async function getRulesListDoc () {
	return await readFile(new URL(`../../docs/user-guide/rules.md`, import.meta.url), `utf8`)
}

describe(`all rules`, () => {
	for (let name of ruleNames) {
		it(`"${name}" should have metadata`, async () => {
			let rule = await rules[name]

			expect(rule.meta.url).toBe(getRuleDocUrl(name))
			expect([true, undefined]).toContain(rule.meta.fixable)
		})
	}

	for (let name of ruleNames) {
		it(`"${name}" should have a link to a rule doc in the rules page`, () => {
			expect(rulesListDoc).toContain(`[\`${name}\`](../../lib/`)
		})
	}
})

describe(`fixable rules`, () => {
	for (let name of ruleNames) {
		it(`"${name}" should describe fixable in the documents`, async () => {
			let rule = await rules[name]

			if (!rule.meta.fixable) return

			let ruleDoc = await readFile(new URL(`./${name}/README.md`, import.meta.url), `utf8`)

			expect(ruleDoc).toContain(`\`fix\` option`)
			expect(rulesListDoc).toMatch(new RegExp(`-\\s\\[\`${name}\`.+\\s+\\(Autofixable\\)\\.$`, `mu`))
		})
	}
})

describe(`deprecated rules`, () => {
	for (let name of ruleNames) {
		it(`"${name}" should describe deprecation in the document`, async () => {
			let rule = await rules[name]

			if (!rule.meta.deprecated) return

			let ruleDoc = await readFile(new URL(`./${name}/README.md`, import.meta.url), `utf8`)

			expect(ruleDoc).toContain(`> **Warning**`)
		})
	}
})

describe(`custom message option`, () => {
	for (let name of ruleNames) {
		it(`"${name}" should describe a custom message option in the document`, async () => {
			let jsCode = await readFile(new URL(`./${name}/index.js`, import.meta.url), `utf8`)

			// NOTE: If all rules support a custom message option, we should remove this `if` statement.
			if (!jsCode.includes(`\tmessageArgs: [`)) return

			let doc = await readFile(new URL(`./${name}/README.md`, import.meta.url), `utf8`)

			expect(doc).toContain(`\`message\` secondary option`)
		})
	}
})
