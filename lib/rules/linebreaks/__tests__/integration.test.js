import plugins from "../../../index.js"
import stylelint from "stylelint"

describe(`integration tests for linebrakes`, () => {
	it(`should not be an error (issues/3635).`, async () => {
		const { code } = await stylelint.lint({
			code: `a{color:red;}`,
			config: {
				plugins,
				rules: {
					linebreaks: `unix`,
					'codeguide/block-closing-brace-newline-before': `always`,
				},
			},
			fix: true,
		})

		expect(code).toBe(`a{color:red;\n}`)
	})
})
