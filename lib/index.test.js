import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import plugins from "./index.js"

describe(`the plugin in the wrong field of a config`, () => {
	it(`lints as usual where it is listed in "plugins"`, async () => {
		let { results } = await stylelint.lint({
			code: `a { color: #FFF; }`,
			config: {
				plugins: [plugins],
				rules: { "@stylistic/color-hex-case": `lower` },
			},
		})

		expect(results[0].warnings).toHaveLength(1)
		expect(results[0].warnings[0].rule).toBe(`@stylistic/color-hex-case`)
	})

	it(`stops the run with a configuration error where it is listed in "extends"`, async () => {
		let lint = stylelint.lint({
			code: `a { color: #FFF; }`,
			config: {
				"extends": [plugins],
				"rules": { "@stylistic/color-hex-case": `lower` },
			},
		})

		await expect(lint).rejects.toThrow(/is a plugin, not a shareable config/u)
	})
})
