import type { AnyNode, Node } from "postcss"
import Stringifier from "postcss/lib/stringifier"

/**
 * Stands where the stringifier's builder goes, and is never called: `raw` reads the tree and the cache PostCSS keeps on its root, printing nothing.
 * @throws {Error} Where PostCSS reaches it after all.
 */
function unreachableBuilder (): never {
	throw new Error(`The run in front of a node is read without printing the node`)
}

/** The stringifier the run is asked of, which holds no state between questions. */
let stringifier = new Stringifier(unreachableBuilder)

/**
 * The whitespace run standing in front of a node in the file the print gives.
 *
 * `raws.before` where the parser filed one. Where it did not — a node a rule of another plugin built and put into the tree, which is the only way to reach one, since every child of a parsed block carries a run of its own — PostCSS invents a run out of what the node's neighbours carry, a line break with the default indent where they carry nothing, and prints it in front of the node; so a reader taking a missing raw for the empty run says nothing about whitespace the file will hold ([#680](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/680)).
 *
 * The invented run is asked of PostCSS's own stringifier rather than worked out again. None of the syntaxes the plugin reads overrides that computation, and an invented run is whitespace alone, which is the one thing `postcss-styled-syntax` reshapes a printed run for. Reading it off a print of the whole parent instead would cost that print once per node.
 * @param node - The node whose leading run is read.
 * @returns The run.
 */
export function runInFrontOf (node: Node): string {
	let { before } = node.raws

	if (typeof before === `string`) return before

	let invented = stringifier.raw(node as AnyNode, `before`)

	return typeof invented === `string` ? invented : ``
}
