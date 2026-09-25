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
