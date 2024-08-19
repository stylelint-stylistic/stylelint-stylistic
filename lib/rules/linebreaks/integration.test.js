import { equal } from "node:assert/strict"
import { describe, it } from "node:test"

import plugins from "../../index.js"
import stylelint from "stylelint"

describe(`integration tests for linebrakes`, () => {
	it(`should not be an error (issues/3635).`, async () => {
		let { code } = await stylelint.lint({
			code: `a{color:red;}`,
			config: {
				plugins,
				rules: {
					"linebreaks": `unix`,
					'@stylistic/block-closing-brace-newline-before': `always`,
				},
			},
			fix: true,
		})

		equal(code, `a{color:red;\n}`)
	})
})
