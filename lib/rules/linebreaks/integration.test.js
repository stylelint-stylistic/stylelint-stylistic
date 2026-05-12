import { EOL } from "node:os"

import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import plugins from "../../index.js"

describe(`integration tests for linebrakes`, () => {
	it(`should not be an error (issues/3635).`, async () => {
		let { code } = await stylelint.lint({
			code: `a{color:red;}`,
			config: {
				plugins,
				rules: {
					"linebreaks": `unix`,
					"@stylistic/block-closing-brace-newline-before": `always`,
				},
			},
			fix: true,
		})

		expect(code).toBe(`a{color:red;${EOL}}`)
	})
})
