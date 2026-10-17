import type { AnyNode, AtRule, Container, Root } from "postcss"
import Stringifier from "postcss/lib/stringifier"

import { forgetPinnedRaws, notePin, noteRaws, readByRules, writesByRules } from "../readsPinnedRaws/index.ts"
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

/** A raw pinned: the node, which of its raws, what PostCSS printed there, whether the node held nothing then, which is what the run in front of its closing brace is printed from, and how many raws the rules of the plugin had written by then. */
type Pin = { node: AnyNode, key: string, value: unknown, empty: boolean, writes: number }

/** The raws pinned, by the root pinned. */
let pinsOf = new WeakMap<Root, Pin[]>()

/**
 * Asks whether a node holds nothing.
 * @param node - The node.
 * @returns True where it holds no node.
 */
function holdsNothing (node: AnyNode): boolean {
	return ((node as Container).nodes?.length ?? 0) === 0
}

/**
 * Asks PostCSS what it prints for a raw a node carries none of, reading the neighbors as they stand: the run in front of a closing brace is read as an empty block's where the block holds no node, and the run behind an at-rule's name is a space where parameters follow.
 * @param node - The node.
 * @param key - The raw.
 * @returns What PostCSS prints.
 */
function invent (node: AnyNode, key: string): unknown {
	if (key === `afterName`) return (node as AtRule).params ? ` ` : ``
	if (key === `between`) return stringifier.raw(node, `between`, isDeclaration(node) ? `colon` : `beforeOpen`)
	if (key === `after`) return stringifier.raw(node, `after`, holdsNothing(node) ? `emptyBody` : undefined)

	return stringifier.raw(node, key)
}

/**
 * Takes the pin off the run in front of a closing brace of a block a rule of another plugin has filled or emptied since the pin wrote it, so that the rules after that one read the run as PostCSS prints it now. A pin a rule of the plugin wrote over is left alone, and a pin whose block stands as it did is left alone too: the rules before the change read the block as it was then, and the run behind a closing brace behind nodes is another run than the one behind the brace of an empty block, which nobody has read.
 * @param root - The root pinned.
 */
function askAfresh (root: Root): void {
	let pins = pinsOf.get(root)

	if (!pins) return

	let standing: Pin[] = []

	for (let pin of pins) {
		if (pin.key !== `after` || holdsNothing(pin.node) === pin.empty) {
			standing.push(pin)

			continue
		}

		if ((pin.node.raws as Record<string, unknown>)[pin.key] === pin.value) Reflect.deleteProperty(pin.node.raws, pin.key)
	}

	pinsOf.set(root, standing)
}

/**
 * Pins the raws PostCSS invents in print for the nodes that carry none: those a rule of another plugin built and put into the tree, which carry no `source` and none of the raws a parsed node carries, the nodes of a copy whose raws such a rule cleaned, and any raw such a rule took off a parsed node — the run in front of each, the run behind an at-rule's name, the run behind a declaration's colon or in front of a block's opening brace, the run in front of its closing brace and whether the last node of a block holding any is closed by a semicolon — each as PostCSS prints it now, out of what the neighbors carry. A parser files all of them but the semicolon of an empty block, which nothing prints and which is left, since a node put into the block later would find it stale.
 *
 * Every raw is asked first and pinned after, since PostCSS invents a raw out of the first node carrying one of its kind, and a raw pinned on the way would stand in for the file's own when the next is invented; the cache PostCSS keeps on the root is dropped before any of them is asked, since a rule of another plugin may have built nodes since it was filled. So the print stays what it was, but a raw is then a string the rules read and write: a fix writing a raw such a node lacks finds it, rather than passing the node over, and a write into one node's raw no longer changes what PostCSS invents for the next. The run behind a bodiless at-rule is left, which PostCSS prints as nothing and would take for the style of a block's opening.
 *
 * A block filled or emptied since its run was pinned is asked afresh before anything is pinned, and the raws of every node are watched, so that a rule reading a pinned one is known while the run lasts and a rule writing one is counted.
 * @param root - The root.
 */
export function pinInventedRaws (root: Root): void {
	askAfresh(root)

	let asked: Pin[] = []

	/**
	 * Asks one raw where the node carries none.
	 * @param node - The node.
	 * @param key - The raw.
	 */
	function ask (node: AnyNode, key: string): void {
		if ((node.raws as Record<string, unknown>)[key] !== undefined) return

		asked.push({ node, key, value: invent(node, key), empty: key === `after` && holdsNothing(node), writes: writesByRules(root, key) })
	}

	delete (root as Root & { rawCache?: unknown }).rawCache

	root.walk((node) => {
		// A stylesheet a document holds is parsed, and carries its own raws
		if ((node as { type: string }).type === `root`) return

		noteRaws(root, node)

		ask(node, `before`)

		if (isDeclaration(node)) ask(node, `between`)
		else if (isAtRule(node)) ask(node, `afterName`)

		if (!(`nodes` in node) || !(node as Container).nodes) return

		if (!isDeclaration(node)) ask(node, `between`)

		ask(node, `after`)

		if (!holdsNothing(node)) ask(node, `semicolon`)
	})

	for (let { node, key, value } of asked) (node.raws as Record<string, unknown>)[key] = value
	for (let { node, key } of asked) notePin(root, node, key)

	pinsOf.set(root, [...pinsOf.get(root) ?? [], ...asked])
}

/**
 * Takes the pins no rule stands by off, once every rule of the plugin has read the root, so that what a rule of another plugin listed behind the plugin's changes is printed as PostCSS invents it then, as it is where no rule of the plugin is configured: a node put into an empty block, or a block filled that PostCSS invents another block's runs out of.
 *
 * A pin goes where a rule of the plugin read it or wrote over it, since the rule judged the tree as the pin stands and the plugin's own answer is then the one that stands; where a rule of the plugin has written a raw of that kind since the pin was taken, since PostCSS invents a run of one kind out of the runs of that kind around it and the plugin has moved them; and a pin on the run in front of a closing brace goes as well where the block was filled or emptied since, whichever of them reads it: the run behind the brace of an empty block and the run behind the brace behind nodes are two runs, and a rule that read one of them has not read the other.
 * @param root - The root pinned.
 */
export function unpinUnwritten (root: Root): void {
	let pins = pinsOf.get(root)

	if (!pins) return

	pinsOf.delete(root)

	let taken = pins.filter(({ node, key, value, empty, writes: written }) => (node.raws as Record<string, unknown>)[key] === value && node.root() === root && writesByRules(root, key) === written && ((key === `after` && holdsNothing(node) !== empty) || !readByRules(root, node, key)))

	for (let { node, key } of taken) Reflect.deleteProperty(node.raws, key)

	delete (root as Root & { rawCache?: unknown }).rawCache

	forgetPinnedRaws(root)
}
