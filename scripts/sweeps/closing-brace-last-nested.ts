/**
 * Where a block stands and what it holds, under `block-closing-brace-empty-line-before` and every `except` it takes.
 *
 * `except: ["last-nested"]` turns the primary option over at a block standing in another one and holding no block of its own, so the two things it reads are a block's place and what it holds; the oracle corpora carry neither a chain of nesting three deep nor a declaration carrying a block, and this sweep's axes are those two things. The base refuses the value, so every row under a configuration naming it is new by construction, and what the three controls have to show is that the configurations naming nothing have not moved.
 */

import { keysOf, multiply, place } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** What the block holds; the first three hold no block of their own and so end their chain, and the rest do not. */
const HOLDS: Record<string, string> = {
	declaration: `color: red;`,
	commentOnly: `/* c */`,
	empty: ``,
	nestedRule: `b {\ncolor: red;\n}`,
	atRuleWithBlock: `@media print {\ncolor: red;\n}`,
	nestedProperty: `font: 12px {\ncolor: red;\n}`,
}

const name: Sweep[`name`] = `closing-brace-last-nested`

const corpus: Sweep[`corpus`] = place(
	multiply({ holds: keysOf(HOLDS) }, ({ holds }) => HOLDS[holds ?? ``] ?? ``),
	{
		top: (body) => inShape(`a {\n%s\n}\n`, `\t\t`, body),
		nested: (body) => inShape(`x {\n\ta {\n\t\t%s\n\t}\n}\n`, `\t\t\t`, body),
		twoDeep: (body) => inShape(`x {\n\ta {\n\t\tb {\n\t\t\t%s\n\t\t}\n\t}\n}\n`, `\t\t\t\t`, body),
		inAtRule: (body) => inShape(`@media print {\n\ta {\n\t\t%s\n\t}\n}\n`, `\t\t\t`, body),
		inKeyframes: (body) => inShape(`@keyframes x {\n\t100% {\n\t\t%s\n\t}\n}\n`, `\t\t\t`, body),
		inNestedProperty: (body) => inShape(`a {\n\tfont: 12px {\n\t\t%s\n\t}\n}\n`, `\t\t\t`, body),
	},
)

const configs: Sweep[`configs`] = [
	{ rule: `block-closing-brace-empty-line-before`, primary: `never` },
	{ rule: `block-closing-brace-empty-line-before`, primary: `always-multi-line` },
	{ rule: `block-closing-brace-empty-line-before`, primary: `never`, secondary: { except: [`after-closing-brace`] } },
	{ rule: `block-closing-brace-empty-line-before`, primary: `never`, secondary: { except: [`last-nested`] } },
	{ rule: `block-closing-brace-empty-line-before`, primary: `always-multi-line`, secondary: { except: [`last-nested`] } },
	{ rule: `block-closing-brace-empty-line-before`, primary: `never`, secondary: { except: [`after-closing-brace`, `last-nested`] } },
]

/**
 * Stands a block's content where a shape marks it, every line of it at the depth the shape opens the block at.
 * @param shape - The shape, whose `%s` stands for the content.
 * @param depth - The depth the content stands at.
 * @param body - What the block holds.
 * @returns The stylesheet.
 */
function inShape (shape: string, depth: string, body: string): string {
	return shape.replace(`%s`, () => body === `` ? `` : body.split(`\n`).map((line) => depth + line).join(`\n`))
}

export { configs, corpus, name }
