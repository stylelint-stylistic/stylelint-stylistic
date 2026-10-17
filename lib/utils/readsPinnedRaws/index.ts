import type { AnyNode, Root } from "postcss"

/** What a wrapped node's raws are watched for: the keys a pin wrote, which are the ones a rule's reading of settles, the keys a rule of the plugin read or wrote, and the wrapper itself, which is the node's raws as long as nothing else has put its own there. */
type Watched = { pinned: Set<string>, read: Set<string>, wrapper: Record<string, unknown> }

/** The raws each node of a root carried as they stood before they were wrapped, by the root, then by the node. */
let plainByRoot = new WeakMap<Root, Map<AnyNode, Record<string, unknown>>>()

/** What each node of a root is watched for, by the root, then by the node. */
let watchedByRoot = new WeakMap<Root, Map<AnyNode, Watched>>()

/** How many raws of each kind the rules of the plugin wrote in each root, by the root: PostCSS invents a run of one kind out of the runs of that kind around it, so a rule that wrote one of that kind has moved what a pin of it stands for. */
let writesByRoot = new WeakMap<Root, Map<string, number>>()

/** The root whose rule runs now, whose reading of the raws is noted, or nothing where no rule of the plugin reads the tree: the pass that pins, a print, a rule of another plugin. */
let reading: Root | undefined

/**
 * Notes what a rule reads and writes of the raws, for as long as the rule runs. A rule that reads a raw a pin wrote, or writes over it, has judged the tree as the pin stands and stands by what it read, so the pin is no longer the plugin's to take off: only a pin no rule touched belongs to the print alone.
 *
 * A read is asked of the raws of a node as a whole and not of the raw that answers, so a rule that asks PostCSS what it would print for one node reads the pinned raws of its neighbors as it is told, and those count as read by it: the pin is kept, which is the side a wrong answer errs on.
 * @param root - The root the rule reads.
 * @param run - The rule's check.
 * @returns What the check returns.
 */
export function notePinReads<T> (root: Root, run: () => T): T {
	let was = reading

	reading = root

	try {
		return run()
	}
	finally {
		reading = was
	}
}

/**
 * Wraps the raws of a node of a root, so that a rule's reading and writing of each of them is told from another's. Every node of the root is wrapped and not only the ones a pin wrote, since a rule writes raws of a parsed node as readily, and what PostCSS invents for a node beside it is read out of those.
 * @param root - The root pinned.
 * @param node - The node whose raws to watch.
 */
export function noteRaws (root: Root, node: AnyNode): void {
	let watched = watchedByRoot.get(root) ?? new Map<AnyNode, Watched>()
	let plain = plainByRoot.get(root) ?? new Map<AnyNode, Record<string, unknown>>()

	if (watched.has(node)) return

	let plainRaws = node.raws as Record<string, unknown>
	let what: Watched = { pinned: new Set(), read: new Set(), wrapper: plainRaws }

	watchedByRoot.set(root, watched)
	plainByRoot.set(root, plain)
	watched.set(node, what)
	plain.set(node, plainRaws)

	/**
	 * Notes a raw a rule of the plugin takes of a node, reading it or writing over it: a deletion moves what PostCSS invents around the node as much as an assignment does, and counts as one.
	 * @param key - The raw.
	 */
	function moved (key: string | symbol): void {
		if (reading !== root || typeof key === `symbol`) return

		if (what.pinned.has(key)) what.read.add(key)

		let writes = writesByRoot.get(root) ?? new Map<string, number>()

		writesByRoot.set(root, writes)
		writes.set(key, (writes.get(key) ?? 0) + 1)
	}

	what.wrapper = new Proxy(plainRaws, {
		get: (raws, key): unknown => {
			if (reading === root && typeof key !== `symbol` && what.pinned.has(key)) what.read.add(key)

			return Reflect.get(raws, key)
		},
		set: (raws, key, value): boolean => {
			moved(key)

			return Reflect.set(raws, key, value)
		},
		deleteProperty: (raws, key): boolean => {
			moved(key)

			return Reflect.deleteProperty(raws, key)
		},
	})

	node.raws = what.wrapper
}

/**
 * Remembers that a pin wrote a raw of a node, which is the raw whose reading by a rule of the plugin is a decision of the plugin's own.
 * @param root - The root pinned.
 * @param node - The node the pin wrote into.
 * @param key - The raw.
 */
export function notePin (root: Root, node: AnyNode, key: string): void {
	watchedByRoot.get(root)?.get(node)?.pinned.add(key)
}

/**
 * Asks whether a rule of the plugin read the raw a pin wrote, or wrote over it, which are the same answer to the question the pin is asked: whether any rule stands by what stands there.
 * @param root - The root pinned.
 * @param node - The node the pin wrote into.
 * @param key - The raw.
 * @returns True where a rule of the plugin read or wrote it.
 */
export function readByRules (root: Root, node: AnyNode, key: string): boolean {
	return watchedByRoot.get(root)?.get(node)?.read.has(key) ?? false
}

/**
 * Asks how many raws of a kind the rules of the plugin have written in the root, which tells a pin taken before the last write of that kind from one taken after it.
 * @param root - The root pinned.
 * @param key - The raw.
 * @returns How many writes of that kind stand.
 */
export function writesByRules (root: Root, key: string): number {
	return writesByRoot.get(root)?.get(key) ?? 0
}

/**
 * Gives a root's nodes the plain raws they stood with before the pins wrapped them, once every rule of the plugin has read the root: the tree is printed from here on, and a rule of another plugin listed behind the plugin's changes it without asking anything of the plugin.
 * @param root - The root pinned.
 */
export function forgetPinnedRaws (root: Root): void {
	let watched = watchedByRoot.get(root)
	let plain = plainByRoot.get(root)

	watchedByRoot.delete(root)
	plainByRoot.delete(root)
	writesByRoot.delete(root)

	// A rule of another plugin listed behind the plugin's may have put raws of its own on a node where the wrapper stands, and what it wrote is as much the file's as anything a rule of the plugin's wrote
	for (let [node, what] of watched ?? []) if (node.raws === what.wrapper) node.raws = plain?.get(node) ?? node.raws
}
