import stylelint from "stylelint"
import { expect, it } from "vitest"

import plugins from "../../../../index.ts"

// declaration-block-trailing-semicolon: always will write `;` before `}`, so a `//` comment at the end of the value leaves the trailing break behind it, not before `}` — both orders converge to one file in one pass under less
it(`reports both warnings under less: block-closing-brace-newline-before listed first`, async () => {
	let config = {
		plugins,
		customSyntax: `postcss-less`,
		rules: {
			"@stylistic/less/block-closing-brace-newline-before": `always`,
			"@stylistic/less/declaration-block-trailing-semicolon": `always`,
		},
	}
	let result = await stylelint.lint({ code: `a { --b: red // c\n}`, config })
	let r = result.results[0]
	if (!r) throw new Error(`unreachable`)
	let rules = r.warnings.map(({ rule }) => rule).toSorted()
	expect(rules).toEqual([
		`@stylistic/less/block-closing-brace-newline-before`,
		`@stylistic/less/declaration-block-trailing-semicolon`,
	])
	let texts = r.warnings.map(({ text }) => text)
	expect(texts.some((text) => text.includes(`Expected newline before "}"`))).toBe(true)
	expect(texts.some((text) => text.includes(`Expected a trailing semicolon`))).toBe(true)
})

it(`reports both warnings under less: declaration-block-trailing-semicolon listed first`, async () => {
	let config = {
		plugins,
		customSyntax: `postcss-less`,
		rules: {
			"@stylistic/less/declaration-block-trailing-semicolon": `always`,
			"@stylistic/less/block-closing-brace-newline-before": `always`,
		},
	}
	let result = await stylelint.lint({ code: `a { --b: red // c\n}`, config })
	let r = result.results[0]
	if (!r) throw new Error(`unreachable`)
	let rules = r.warnings.map(({ rule }) => rule).toSorted()
	expect(rules).toEqual([
		`@stylistic/less/block-closing-brace-newline-before`,
		`@stylistic/less/declaration-block-trailing-semicolon`,
	])
	let texts = r.warnings.map(({ text }) => text)
	expect(texts.some((text) => text.includes(`Expected newline before "}"`))).toBe(true)
	expect(texts.some((text) => text.includes(`Expected a trailing semicolon`))).toBe(true)
})
