import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import plugins from "../../index.ts"

/**
 * Fixes one snippet under the rules given, in both orders, and reads each output back.
 * @param code - The snippet.
 * @param rules - The rules and their settings.
 * @param customSyntax - The syntax the snippet is parsed with.
 * @returns The file each order left and how many warnings a lint of it has.
 */
async function fixInBothOrders (code: string, rules: [string, unknown][], customSyntax?: string): Promise<{ code: string, warnings: number }[]> {
	let outputs: { code: string, warnings: number }[] = []

	for (let order of [rules, rules.toReversed()]) {
		let config = { plugins, rules: Object.fromEntries(order) }
		// eslint-disable-next-line no-await-in-loop -- the orders are read one after another
		let fixed = await stylelint.lint({ code, config, fix: true, ...(customSyntax && { customSyntax }) })
		// eslint-disable-next-line no-await-in-loop -- the fixed text is read back in turn
		let read = await stylelint.lint({ code: fixed.code ?? code, config, ...(customSyntax && { customSyntax }) })

		outputs.push({ code: fixed.code ?? code, warnings: read.results[0]?.warnings.length ?? 0 })
	}

	return outputs
}

describe(`the run in front of a delimiter opening a node's text`, () => {
	// No neighbor writes that raw at the stylesheet's head, so the break asked for is written there, opening the file with an empty line
	it(`is written in front of a comma opening the file's first selector`, async () => {
		expect(await fixInBothOrders(`,a {}`, [[`@stylistic/selector-list-comma-newline-before`, `always`]])).toEqual([{ code: `\n,a {}`, warnings: 0 }, { code: `\n,a {}`, warnings: 0 }])
	})

	// A neighbor asking the same run, passing the node over by its lineness, as the write leaves it, or by a secondary option, standing behind the other kind of semicolon, or writing the run a comment in the raw parts from the one in front of the text, leaves the write to the delimiter's rule
	it.each([
		[`a{b:/c}`, [`@stylistic/value-slash-newline-before`, `always`], [`@stylistic/declaration-colon-newline-after`, `always`], `a{b:\n/c}`],
		[`a{b:/c}`, [`@stylistic/value-slash-newline-before`, `always`], [`@stylistic/declaration-colon-newline-after`, `always-multi-line`], `a{b:\n/c}`],
		[`,a{}`, [`@stylistic/selector-list-comma-space-before`, `always`], [`@stylistic/no-empty-first-line`, true], ` ,a{}`],
		[`x{ ,a{} }`, [`@stylistic/selector-list-comma-newline-before`, `always`], [`@stylistic/block-opening-brace-newline-after`, [`always`, { ignore: [`rules`] }]], `x{\n ,a{} }`],
		[`@import "q";\n,a{}`, [`@stylistic/selector-list-comma-space-before`, `never`], [`@stylistic/declaration-block-semicolon-newline-after`, `always`], `@import "q";,a{}`],
		[`x{},a{}`, [`@stylistic/selector-list-comma-newline-before`, `always`], [`@stylistic/block-closing-brace-newline-after`, `never-multi-line`], `x{}\n,a{}`],
		[`@media  ,a{\n}`, [`@stylistic/media-query-list-comma-space-before`, `always`], [`@stylistic/at-rule-name-newline-after`, `always-multi-line`], `@media ,a{\n}`],
		[`a{b:/*c*/ /c}`, [`@stylistic/value-slash-newline-before`, `always`], [`@stylistic/declaration-colon-space-after`, `always`], `a{b: /*c*/\n /c}`],
		[`@media/*c*/ ,a{}`, [`@stylistic/media-query-list-comma-newline-before`, `always`], [`@stylistic/at-rule-name-space-after`, `always`], `@media /*c*/\n ,a{}`],
	] as [string, [string, unknown], [string, unknown], string][])(`is written in %j beside a neighbor that does not ask otherwise`, async (code, delimiterRule, neighbor, output) => {
		expect(await fixInBothOrders(code, [delimiterRule, neighbor])).toEqual([{ code: output, warnings: 0 }, { code: output, warnings: 0 }])
	})

	// A live neighbor asking another run writes it, whichever side of it the delimiter's rule is listed, and the delimiter's warning stands: no file satisfies both
	it.each([
		[`x {},a {}`, [`@stylistic/selector-list-comma-space-before`, `never`], [`@stylistic/block-closing-brace-newline-after`, `always`], `x {}\n,a {}`],
		[`,a{}`, [`@stylistic/selector-list-comma-newline-before`, `always`], [`@stylistic/max-empty-lines`, 0], `,a{}`],
		[`,a{}`, [`@stylistic/selector-list-comma-space-before`, `always`], [`@stylistic/indentation`, 2], `,a{}`],
	] as [string, [string, unknown], [string, unknown], string][])(`is left to the neighbor in %j`, async (code, delimiterRule, neighbor, output) => {
		expect(await fixInBothOrders(code, [delimiterRule, neighbor])).toEqual([{ code: output, warnings: 1 }, { code: output, warnings: 1 }])
	})

	// One space behind an at-rule's name leaves the list on one line only where no break stands elsewhere in it, and the warning stands otherwise
	it(`is left behind an at-rule's name where a break stands behind a later comma`, async () => {
		expect(await fixInBothOrders(`@media ,a,\nb{}`, [[`@stylistic/media-query-list-comma-newline-before`, `never-multi-line`]])).toEqual([{ code: `@media ,a,\nb{}`, warnings: 1 }, { code: `@media ,a,\nb{}`, warnings: 1 }])
	})

	// Taking the break closing an inline comment would move the text into it, and a run in the host's code is no rule's to write
	it.each([
		[`// c\n,a{}`, `@stylistic/scss/selector-list-comma-space-before`, `always`, `postcss-scss`],
		[`// c\n,a{}`, `@stylistic/less/selector-list-comma-space-before`, `never`, `postcss-less`],
		[`a{b: // c\n/d}`, `@stylistic/scss/value-slash-space-before`, `never`, `postcss-scss`],
		[`@media // c\n,a{}`, `@stylistic/scss/media-query-list-comma-space-before`, `always`, `postcss-scss`],
		[`<style>\n,a{}</style>`, `@stylistic/selector-list-comma-space-before`, `always`, `postcss-html`],
	])(`is left in %j under %s %s`, async (code, rule, option, customSyntax) => {
		expect(await fixInBothOrders(code, [[rule, option]], customSyntax)).toEqual([{ code, warnings: 1 }, { code, warnings: 1 }])
	})
})
