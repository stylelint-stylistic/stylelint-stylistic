import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import plugins from "../../index.ts"

/** The rule under the namespace that reads a styled template. */
const STYLED_RULE = `@stylistic/styled/no-extra-semicolons`

describe(`the extra semicolons of a styled template below the first line of its file`, () => {
	// A template's root counts its nodes' offsets from the file's start, and the warning is placed in the template's text
	it(`places each warning on its semicolon`, async () => {
		let code = `let x = 1\nconst a = styled.div\`\n  color: red;;\n  b {c: d;;}\n  ;\n\`\n`
		let { results } = await stylelint.lint({ code, customSyntax: `postcss-styled-syntax`, config: { plugins, rules: { [STYLED_RULE]: true } } })

		expect(results[0]?.warnings.map(({ line, column }) => `${line}:${column}`)).toEqual([`3:14`, `4:11`, `5:3`])
	})

	it(`keeps a semicolon a disable comment in the template covers`, async () => {
		let code = `let x = 1\nconst a = styled.div\`\n  /* stylelint-disable-next-line ${STYLED_RULE} */\n  color: red;;\n\`\n`
		let { code: fixed } = await stylelint.lint({ code, fix: true, customSyntax: `postcss-styled-syntax`, config: { plugins, rules: { [STYLED_RULE]: true } } })

		expect(fixed).toBe(code)
	})
})

/**
 * Every ordering of some rule names.
 * @param names - The names to permute.
 * @returns Every ordering.
 */
function orders (names: string[]): string[][] {
	if (names.length <= 1) return [[...names]]

	let built: string[][] = []

	for (let [index, name] of names.entries()) {
		for (let rest of orders([...names.slice(0, index), ...names.slice(index + 1)])) built.push([name, ...rest])
	}

	return built
}

describe(`a semicolon a disable comment keeps from this rule, in a run a rule listed earlier rewrites`, () => {
	// The readers asking what this rule takes out read each semicolon's line where the file spells it, as this rule places its warning, so the one kept stays kept whichever rule writes the run first
	it.each([
		[`/* stylelint-disable-next-line @stylistic/no-extra-semicolons */\na { ;\n\n\n ; b: c }\n`, `/* stylelint-disable-next-line @stylistic/no-extra-semicolons */\na { ;\n\n  b: c\n }\n`],
		[`a {\n  b: c; ;\n/* stylelint-disable-next-line @stylistic/no-extra-semicolons */\n ;\n\n\n}\n`, `a {\n  b: c;\n/* stylelint-disable-next-line @stylistic/no-extra-semicolons */\n ;\n\n}\n`],
	])(`leaves one file in %j in every order`, async (code, output) => {
		let settings: Record<string, unknown> = { "max-empty-lines": 1, "block-opening-brace-newline-after": `always`, "no-extra-semicolons": true, "no-eol-whitespace": true, "block-closing-brace-newline-before": `always` }
		let files = await Promise.all(orders(Object.keys(settings)).map(async (order) => {
			let rules = Object.fromEntries(order.map((name) => [`@stylistic/${name}`, settings[name]]))

			return (await stylelint.lint({ code, fix: true, config: { plugins, rules } })).code
		}))

		expect(new Set(files)).toEqual(new Set([output]))
	})
})
