import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import plugins from "./index.js"

describe(`the plugin in the wrong field of a config`, () => {
	it(`lints as usual where it is listed in "plugins"`, async () => {
		let { results } = await stylelint.lint({
			code: `a { color: #FFF; }`,
			// The list the package exports is what a configuration naming the package is handed, so it is listed as a user's configuration lists it, which the types of a configuration do not spell
			config: /** @type {import('stylelint').Config} */ (/** @type {unknown} */ ({
				plugins: [plugins],
				rules: { "@stylistic/color-hex-case": `lower` },
			})),
		})

		expect(results[0].warnings).toHaveLength(1)
		expect(results[0].warnings[0].rule).toBe(`@stylistic/color-hex-case`)
	})

	it(`stops the run with a configuration error where it is listed in "extends"`, async () => {
		let lint = stylelint.lint({
			code: `a { color: #FFF; }`,
			// The wrong field, which is the point of the case and which the types of a configuration refuse
			config: /** @type {import('stylelint').Config} */ (/** @type {unknown} */ ({
				"extends": [plugins],
				"rules": { "@stylistic/color-hex-case": `lower` },
			})),
		})

		await expect(lint).rejects.toThrow(/is a plugin, not a shareable config/u)
	})
})
