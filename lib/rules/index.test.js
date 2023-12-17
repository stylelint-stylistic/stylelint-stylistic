import { describe, it } from "node:test"
import { equal, ok, match } from "node:assert/strict"
import { readFile } from 'node:fs/promises'

import rules from "./index.js"
import { addNamespace } from "../utils/addNamespace.js"
import { getRuleDocUrl } from "../utils/getRuleDocUrl.js"

const ruleEntries = Object.entries(rules)

describe(`all rules`, () => {
	it(`not empty`, () => {
		ok(ruleEntries.length > 0)
	})

	ruleEntries.forEach(async ([ruleName, rule]) => {
		rule = await rule

		it(`"${ruleName}" is a function`, () => {
			ok(rule instanceof Function)
		})

		it(`"${ruleName}" is a function`, () => {
			ok(rule instanceof Function)
		})

		it(`"${ruleName}" has the "ruleName" property`, () => {
			equal(rule.ruleName, addNamespace(ruleName))
		})

		it(`"${ruleName}" has the "messages" property`, () => {
			equal(typeof rule.messages, `object`)
		})

		it(`"${ruleName}" has the "meta" property`, () => {
			equal(typeof rule.meta, `object`)
			ok(rule.meta.url.includes(ruleName))
		})
	})
})

const ruleNames = Object.keys(rules)
const rulesListDoc = await getRulesListDoc()

/**
 * Retrieves the documentation for the rules list.
 *
 * @return {Promise<string>} The content of the rules list documentation in UTF-8 format.
 */
async function getRulesListDoc () {
	return await readFile(new URL(`../../docs/user-guide/rules.md`, import.meta.url), `utf8`)
}

describe(`all rules`, () => {
	ruleNames.forEach((name) => {
		it(`"${name}" should have metadata`, async () => {
			const rule = await rules[name]

			equal(rule.meta.url, getRuleDocUrl(name))
			ok([true, undefined].includes(rule.meta.fixable))
		})
	})

	ruleNames.forEach((name) => {
		it(`"${name}" should have a link to a rule doc in the rules page`, () => {
			ok(rulesListDoc.includes(`[\`${name}\`](../../lib/`))
		})
	})
})

describe(`fixable rules`, () => {
	ruleNames.forEach((name) => {
		it(`"${name}" should describe fixable in the documents`, async () => {
			const rule = await rules[name]

			if (!rule.meta.fixable) {return}

			const ruleDoc = await readFile(new URL(`./${name}/README.md`, import.meta.url), `utf8`)

			ok(ruleDoc.includes(`\`fix\` option`))
			match(rulesListDoc, new RegExp(`-\\s\\[\`${name}\`.+\\s+\\(Autofixable\\)\\.$`, `m`))
		})
	})
})

describe(`deprecated rules`, () => {
	ruleNames.forEach((name) => {
		it(`"${name}" should describe deprecation in the document`, async () => {
			const rule = await rules[name]

			if (!rule.meta.deprecated) {return}

			const ruleDoc = await readFile(new URL(`./${name}/README.md`, import.meta.url), `utf8`)

			ok(ruleDoc.includes(`> **Warning**`))
		})
	})
})

describe(`custom message option`, () => {
	ruleNames.forEach((name) => {
		it(`"${name}" should describe a custom message option in the document`, async () => {
			const jsCode = await readFile(new URL(`./${name}/index.js`, import.meta.url), `utf8`)

			// NOTE: If all rules support a custom message option, we should remove this `if` statement.
			if (!jsCode.includes(`\tmessageArgs: [`)) {return}

			const doc = await readFile(new URL(`./${name}/README.md`, import.meta.url), `utf8`)

			ok(doc.includes(`\`message\` secondary option`))
		},
		)
	})
})
