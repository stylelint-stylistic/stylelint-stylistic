import type { AnyNode, Container, Root } from "postcss"
import Stringifier from "postcss/lib/stringifier"

import { isAtRule, isDeclaration } from "../typeGuards/index.ts"

/**
 * Stands where the stringifier's builder goes, and is never called: `raw` reads the tree and the cache PostCSS keeps on its root, printing nothing.
 * @throws {Error} Where PostCSS reaches it after all.
 */
function unreachableBuilder (): never {
	throw new Error(`The invented raws are read without printing the node`)
}

/** The stringifier the raws are asked of, which holds no state between questions. */
let stringifier = new Stringifier(unreachableBuilder)

/** A raw to pin: the node's raws, the key, and what PostCSS prints there. */
type Pin = [raws: Record<string, unknown>, key: string, value: unknown]

/**
 * Pins the raws PostCSS invents in print for the nodes a rule of another plugin built and put into the tree, which carry no `source` and none of the raws a parsed node carries, and the run in front of a parsed node such a rule took off it: the run in front of each, the run behind an at-rule's name, the run behind a declaration's colon or in front of a block's opening brace, the run in front of its closing brace and whether its last node is closed by a semicolon — each as PostCSS prints it now, out of what the neighbors carry.
 *
 * Every raw is asked first and pinned after, since PostCSS invents a raw out of the first node carrying one of its kind, and a raw pinned on the way would stand in for the file's own when the next is invented; the cache PostCSS keeps on the root is dropped first, since a rule of another plugin may have built nodes since it was filled. So the print stays what it was, but a raw is then a string the rules read and write: a fix writing a raw such a node lacks finds it, rather than passing the node over, and a write into one node's raw no longer changes what PostCSS invents for the next. The run behind a bodiless at-rule is left, which PostCSS prints as nothing and would take for the style of a block's opening.
 * @param root - The root.
 */
export function pinInventedRaws (root: Root): void {
	let pins: Pin[] = []

	/**
	 * Asks one raw where the node carries none.
	 * @param node - The node.
	 * @param key - The raw.
	 * @param invent - Asks PostCSS what it prints.
	 */
	function ask (node: AnyNode, key: string, invent: () => unknown): void {
		let raws = node.raws as Record<string, unknown>

		if (raws[key] === undefined) pins.push([raws, key, invent()])
	}

	delete (root as Root & { rawCache?: unknown }).rawCache

	root.walk((node) => {
		// A stylesheet a document holds is parsed, and carries its own raws
		if ((node as { type: string }).type === `root`) return

		// A parsed node loses its run too where another plugin's rule puts a node in front of it, as `prepend` does
		ask(node, `before`, () => stringifier.raw(node, `before`))

		if (node.source) return

		if (isDeclaration(node)) ask(node, `between`, () => stringifier.raw(node, `between`, `colon`))
		else if (isAtRule(node)) ask(node, `afterName`, () => (node.params ? ` ` : ``))

		if (!(`nodes` in node) || !(node as Container).nodes) return

		let container = node as Container

		if (!isDeclaration(node)) ask(node, `between`, () => stringifier.raw(node, `between`, `beforeOpen`))

		ask(node, `after`, () => stringifier.raw(node, `after`, (container.nodes?.length ?? 0) > 0 ? undefined : `emptyBody`))
		ask(node, `semicolon`, () => stringifier.raw(node, `semicolon`))
	})

	for (let [raws, key, value] of pins) raws[key] = value
}
