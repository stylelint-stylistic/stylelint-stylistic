import { Declaration, type Root } from "postcss"
import stylelint, { type Rule } from "stylelint"
import { describe, expect, it } from "vitest"

import plugins from "../../index.ts"

/**
 * A foreign rule that puts two declarations built with no `raws.before` into every empty block `a`, whose runs PostCSS prints from their neighbors.
 * @returns The check.
 */
function build (): (root: Root) => void {
	return (root) => {
		root.walkRules(`a`, (rule) => {
			if (rule.nodes.length > 0) return

			rule.append(new Declaration({ prop: `color`, value: `pink`, raws: { between: `: ` } }))
			rule.append(new Declaration({ prop: `top`, value: `0`, raws: { between: `: ` } }))
		})
	}
}

let builder = stylelint.createPlugin(`probe/builder`, Object.assign(build, { ruleName: `probe/builder`, messages: {} }) as unknown as Rule)

/**
 * Lints a stylesheet and names where the rule warned.
 * @param code - The stylesheet.
 * @param rules - The rules, in the order they run.
 * @param fix - Whether to fix.
 * @returns The positions of the rule's warnings and the code written.
 */
async function lint (code: string, rules: Record<string, unknown>, fix: boolean): Promise<{ warnings: string[], code: string | undefined }> {
	let { results, code: written } = await stylelint.lint({ code, config: { plugins: [...plugins, builder], rules }, fix })

	return { warnings: (results[0]?.warnings ?? []).filter(({ rule }) => rule === `@stylistic/max-line-length`).map(({ line, column }) => `${line}:${column}`), code: written }
}

describe(`max-line-length`, () => {
	it(`a line a fix of the run lengthened past the limit, the fixing rule listed first`, async () => {
		expect(await lint(`a { color:red; }\n`, { "@stylistic/declaration-colon-space-after": `always`, "@stylistic/max-line-length": 16 }, true)).toEqual({ warnings: [`1:17`], code: `a { color: red; }\n` })
	})

	it(`the same line, the fixing rule listed behind`, async () => {
		expect(await lint(`a { color:red; }\n`, { "@stylistic/max-line-length": 16, "@stylistic/declaration-colon-space-after": `always` }, true)).toEqual({ warnings: [`1:17`], code: `a { color: red; }\n` })
	})

	it(`a first line exactly at the limit behind a byte order mark, which the print carries and the file's text does not`, async () => {
		expect((await lint(`\uFEFFa { color: red; }\n`, { "@stylistic/max-line-length": 17 }, false)).warnings).toEqual([])
	})

	it(`a styled template whose host line is over the limit, which the template's root prints around itself and holds no line of`, async () => {
		let { results } = await stylelint.lint({ code: `const Aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa = styled.div\`\n  color: red;\n\``, customSyntax: `postcss-styled-syntax`, config: { plugins, rules: { "@stylistic/styled/max-line-length": 30 } } })

		expect(results[0]?.warnings ?? []).toEqual([])
	})

	it(`a line only the print holds, of declarations another rule built with no raw in front, reported on the block they stand in`, async () => {
		expect((await lint(`b { color: red;top: 0 }\na {\n}\n`, { "probe/builder": true, "@stylistic/max-line-length": 20 }, false)).warnings).toEqual([`1:23`, `2:1`])
	})
})
