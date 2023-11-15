import { readFile } from 'node:fs/promises'

import rules from "../index.js"

const ruleEntries = Object.entries(rules)

test(`not empty`, () => {
	expect(ruleEntries.length).toBeGreaterThan(0)
})

for (const [ruleName, rule] of ruleEntries) {
	test(`"${ruleName}" is a function`, () => {
		expect(rule).toBeInstanceOf(Function)
	})

	test(`"${ruleName}" has the "ruleName" property`, () => {
		expect(rule).toHaveProperty(`ruleName`, expect.stringMatching(ruleName))
	})

	test(`"${ruleName}" has the "messages" property`, () => {
		expect(rule).toHaveProperty(`messages`, expect.any(Object))
	})

	test(`"${ruleName}" has the "meta" property`, () => {
		expect(rule).toHaveProperty(`meta`, expect.any(Object))
		expect(rule).toHaveProperty(`meta.url`, expect.stringMatching(ruleName))
	})
}

const ruleNames = Object.keys(rules)
let rulesListDoc

beforeAll(async () => {
	rulesListDoc = await readFile(
		new URL(`../../../docs/user-guide/rules.md`, import.meta.url),
		`utf8`,
	)
})

describe(`all rules`, () => {
	test.each(ruleNames)(`"%s" should have metadata`, async (name) => {
		const rule = await rules[name]

		expect(rule).toHaveProperty(`meta.url`, `https://github.com/firefoxic/stylelint-codeguide/blob/main/lib/rules/${name}/README.md`)
		expect([true, undefined]).toContain(rule.meta.fixable)
	})

	test.each(ruleNames)(`"%s" should have a link to a rule doc in the rules page`, (name) => {
		expect(rulesListDoc).toContain(`[\`${name}\`](../../lib/`)
	})
})

describe(`fixable rules`, () => {
	test.each(ruleNames)(`"%s" should describe fixable in the documents`, async (name) => {
		const rule = await rules[name]

		if (!rule.meta.fixable) {return}

		const ruleDoc = await readFile(new URL(`../${name}/README.md`, import.meta.url), `utf8`)

		expect(ruleDoc).toMatch(`\`fix\` option`)
		expect(rulesListDoc).toMatch(new RegExp(`-\\s\\[\`${name}\`.+\\s+\\(Autofixable\\)\\.$`, `m`))
	})
})

describe(`deprecated rules`, () => {
	test.each(ruleNames)(`"%s" should describe deprecation in the document`, async (name) => {
		const rule = await rules[name]

		if (!rule.meta.deprecated) {return}

		const ruleDoc = await readFile(new URL(`../${name}/README.md`, import.meta.url), `utf8`)

		expect(ruleDoc).toMatch(`> **Warning**`)
	})
})

describe(`custom message option`, () => {
	test.each(ruleNames)(
		`"%s" should describe a custom message option in the document`,
		async (name) => {
			const jsCode = await readFile(new URL(`../${name}/index.js`, import.meta.url), `utf8`)

			// NOTE: If all rules support a custom message option, we should remove this `if` statement.
			if (!jsCode.includes(`\tmessageArgs: [`)) {return}

			const doc = await readFile(new URL(`../${name}/README.md`, import.meta.url), `utf8`)

			expect(doc).toContain(`\`message\` secondary option`)
		},
	)
})
