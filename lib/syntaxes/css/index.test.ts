import stylelint, { type Config } from "stylelint"
import { describe, expect, it } from "vitest"

import plugins from "../../index.ts"

/**
 * Lints a styled template through Stylelint itself, under the rule names given.
 * @param rules - The configuration's rules.
 * @returns The warnings, by rule and text.
 */
async function lintStyled (rules: Record<string, unknown>): Promise<{ rule: string, text: string }[]> {
	let { results } = await stylelint.lint({
		code: `const A = styled.div\`\n   color: #FFF;\n\`\n`,
		config: { plugins: [plugins], customSyntax: `postcss-styled-syntax`, rules } as unknown as Config,
	})

	return (results[0]?.warnings ?? []).map(({ rule, text }) => ({ rule, text }))
}

describe(`an SCSS stylesheet under the core's rules`, () => {
	it(`is refused with one warning naming the scss namespace, however many rules are configured`, async () => {
		let { results } = await stylelint.lint({
			code: `a { b: red; // c
}
`,
			config: { plugins: [plugins], customSyntax: `postcss-scss`, rules: { "@stylistic/color-hex-case": `lower`, "@stylistic/unit-case": `lower` } } as unknown as Config,
		})

		expect((results[0]?.warnings ?? []).map(({ rule, text }) => ({ rule, text }))).toEqual([{ rule: `@stylistic/color-hex-case`, text: `The "@stylistic/color-hex-case" rule does not read a stylesheet parsed with this syntax; the "@stylistic/scss/" rules do (@stylistic/color-hex-case)` }])
	})
})

describe(`a Less stylesheet under the core's rules`, () => {
	it(`is refused with one warning naming the less namespace, however many rules are configured`, async () => {
		let { results } = await stylelint.lint({
			code: `@x: 1;
a { b: @x; // c
}
`,
			config: { plugins: [plugins], customSyntax: `postcss-less`, rules: { "@stylistic/color-hex-case": `lower`, "@stylistic/unit-case": `lower` } } as unknown as Config,
		})

		expect((results[0]?.warnings ?? []).map(({ rule, text }) => ({ rule, text }))).toEqual([{ rule: `@stylistic/color-hex-case`, text: `The "@stylistic/color-hex-case" rule does not read a stylesheet parsed with this syntax; the "@stylistic/less/" rules do (@stylistic/color-hex-case)` }])
	})
})

describe(`a styled template under the core's rules`, () => {
	it(`is refused with one warning naming the styled namespace, however many rules are configured`, async () => {
		let warnings = await lintStyled({ "@stylistic/indentation": [2], "@stylistic/color-hex-case": `lower` })

		expect(warnings).toEqual([{ rule: `@stylistic/indentation`, text: `The "@stylistic/indentation" rule does not read a stylesheet parsed with this syntax; the "@stylistic/styled/" rules do (@stylistic/indentation)` }])
	})

	it(`is read by the same rules under the namespace the warning names`, async () => {
		let warnings = await lintStyled({ "@stylistic/styled/indentation": [2], "@stylistic/styled/color-hex-case": `lower` })

		expect(warnings).toEqual([
			{ rule: `@stylistic/styled/indentation`, text: `Expected indentation of 2 spaces (@stylistic/styled/indentation)` },
			{ rule: `@stylistic/styled/color-hex-case`, text: `Expected "#FFF" to be "#fff" (@stylistic/styled/color-hex-case)` },
		])
	})
})
