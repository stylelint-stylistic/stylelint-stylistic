import type { Container, Node, Root } from "postcss"
import type { PostcssResult } from "stylelint"

import { CLOSES_NOTHING_IN_FRONT, EVERY_SEMICOLON, SPACE_OR_TAB, TRAILING_CSS_WHITESPACE, TRAILING_SEMICOLON } from "../../regexps.ts"
import { closingOffset } from "../closingOffset/index.ts"
import { fixDisabledRanges } from "../fixDisabledOnLine/index.ts"
import { neighborCopies, type NeighborRuleSetting } from "../neighborSettings/index.ts"
import { nodeString } from "../nodeString/index.ts"
import { isComment } from "../typeGuards/index.ts"

/** The rule taking every extra semicolon out, whose decision over the file the check by count reads; its own copy of the setting `noExtraSemicolonsTaken` holds, which imports this module. */
const NO_EXTRA_SEMICOLONS: NeighborRuleSetting = {
	name: `no-extra-semicolons`,
	options: [true],
}

/**
 * Finds the semicolons of a raw's text in the file that a rule listed earlier has already taken out of the raw: walking back from the raw's end, a semicolon the file spells and the raw no longer holds, and past the raw's start the semicolons up to what stands in front of it, which the raw held at its head. A space or tab the raw no longer holds is walked past too, since a writer such as `no-eol-whitespace` trims the end of the line such a semicolon stood on. The walk stops where the two part otherwise, since another write changed the raw there.
 * @param text - The root's text.
 * @param raw - The raw as it stands.
 * @param end - Where the raw ends in the text.
 * @param start - Where what stands in front of the raw ends in the text.
 * @param into - Takes the semicolons' offsets.
 */
function takenAlready (text: string, raw: string, end: number, start: number, into: Set<number>): void {
	let index = end - 1
	let rawIndex = raw.length - 1

	for (; index >= start && rawIndex >= 0; index -= 1) {
		if (text.charAt(index) === raw.charAt(rawIndex)) rawIndex -= 1
		else if (text.charAt(index) === `;`) into.add(index)
		else if (!SPACE_OR_TAB.test(text.charAt(index))) return
	}

	let head: number[] = []

	for (; index >= start && (text.charAt(index) === `;` || SPACE_OR_TAB.test(text.charAt(index))); index -= 1) if (text.charAt(index) === `;`) head.push(index)

	// A semicolon against the code in front closes that code rather than standing in the raw
	let first = head.at(-1)

	if (first !== undefined && first > 0 && !CLOSES_NOTHING_IN_FRONT.test(text.charAt(first - 1))) head.pop()

	for (let semicolon of head) into.add(semicolon)
}

/**
 * Finds where a node ends in its root's text, behind the stray semicolon PostCSS files behind a rule: the farther of the parser's end and the end of the node's print, 0 for no node.
 * @param node - The node.
 * @param rootStart - The root's offset.
 * @param result - The Stylelint result, which holds the file's syntax.
 * @returns The offset.
 */
function endIn (node: Node | undefined, rootStart: number, result: PostcssResult): number {
	if (!node) return 0

	let end = `nodes` in node ? closingOffset(node) : node.source?.end?.offset
	let start = node.source?.start?.offset
	// `postcss-less` ends an inline comment one character short, and the print reaches its end
	let printed = start === undefined ? 0 : start + nodeString(node, result).length

	return Math.max(end ?? 0, printed) - rootStart
}

/**
 * Finds the text a rule listed earlier moved into the node closing a block from behind it: `declaration-block-trailing-semicolon: never` writes the comments behind a custom property or a bodiless at-rule, with the runs around them, into the node, where it takes the semicolon PostCSS writes behind such a node. Where the print spells the node as the file does, less that semicolon and the run in front of it, and goes on past it, what it holds past the part both spell is that text, standing in front of the block's tail.
 * @param node - The block's last node.
 * @param text - The root's text.
 * @param rootStart - The root's offset.
 * @param result - The Stylelint result, which holds the file's syntax.
 * @returns The moved text and where it opens in the root's text, or nothing where nothing was moved.
 */
function movedIn (node: Node | undefined, text: string, rootStart: number, result: PostcssResult): { tail: string, start: number } | undefined {
	let start = node?.source?.start?.offset

	if (!node || start === undefined || isComment(node) || `nodes` in node) return undefined

	let printed = nodeString(node, result)
	let from = start - rootStart
	let common = 0

	while (common < printed.length && printed[common] === text[from + common]) common += 1

	// The node itself as the file spells it, less the flag's semicolon and the run in front of it, which that rule takes; a print parting from the file inside it was changed otherwise, as PostCSS's escape of `<!--` changes it, and nothing was moved
	let end = node.source?.end?.offset
	let spelled = end === undefined ? `` : text.slice(from, end - rootStart).replace(TRAILING_SEMICOLON, ``).replace(TRAILING_CSS_WHITESPACE, ``)

	if (common === printed.length || common < spelled.length) return undefined

	return { tail: printed.slice(common), start: from + common }
}

/** The answers of {@link takenAlreadyChecked} in a run, by the result, the node and the raw as asked. */
let answers = new WeakMap<object, WeakMap<Node, Map<string, Set<number>>>>()

/**
 * Finds the semicolons of a raw's span in the file that a rule listed earlier has taken out, checked by count: the walk ({@link takenAlready}) stops where another write parted the raw from the file, as `max-empty-lines` taking a break out does. Where it finds fewer than the raw lacks against its span — the stray semicolons from the node in front of the raw to the raw's end, those against the code in front, which close it, left out — the missing ones are the ones `no-extra-semicolons` took: every stray semicolon of the span on a line no disable comment keeps from a live copy of it, where there are exactly as many. The span is bounded by a node in front of the raw, a root's start, or the opening brace of a block; a semicolon against a comment's end, or opening the text, is stray too.
 * @param node - The node whose raw it is, whose root holds the file.
 * @param text - The root's text.
 * @param raw - The raw as it stands.
 * @param end - Where the raw ends in the text.
 * @param start - Where what stands in front of the raw ends in the text.
 * @param bounded - Whether the span is bounded.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns The offsets.
 */
function takenAlreadyChecked (node: Node, text: string, raw: string, end: number, start: number, bounded: boolean, result: PostcssResult): Set<number> {
	// A pass holds its file, configuration and disable comments, and the answer reads the raw as it stands and its span, which the question names; a pass sharing the PostCSS result with another has a result record of its own
	let pass = result.stylelint ?? result
	let byNode = answers.get(pass) ?? new WeakMap<Node, Map<string, Set<number>>>()
	let byRaw = byNode.get(node) ?? new Map<string, Set<number>>()
	let question = `${end}:${start}:${bounded}:${raw}`
	let known = byRaw.get(question)

	answers.set(pass, byNode)
	byNode.set(node, byRaw)

	if (known) return new Set(known)

	let answer = answerByCount(node, text, raw, end, start, bounded, result)

	byRaw.set(question, answer)

	return new Set(answer)
}

/**
 * Answers {@link takenAlreadyChecked} afresh.
 * @param node - The node whose raw it is, whose root holds the file.
 * @param text - The root's text.
 * @param raw - The raw as it stands.
 * @param end - Where the raw ends in the text.
 * @param start - Where what stands in front of the raw ends in the text.
 * @param bounded - Whether the span is bounded.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns The offsets.
 */
function answerByCount (node: Node, text: string, raw: string, end: number, start: number, bounded: boolean, result: PostcssResult): Set<number> {
	let offsets: Set<number> = new Set()

	takenAlready(text, raw, end, start, offsets)

	if (!bounded) return offsets

	let strays = [...text.slice(start, end).matchAll(EVERY_SEMICOLON)].map(({ index }) => start + index).filter((offset) => offset === 0 || CLOSES_NOTHING_IN_FRONT.test(text.charAt(offset - 1)) || text.slice(offset - 2, offset) === `*/`)
	let missing = strays.length - (raw.match(EVERY_SEMICOLON) ?? []).length

	if (missing <= 0 || offsets.size >= missing) return offsets

	let rangesOfCopies = neighborCopies(node, result, NO_EXTRA_SEMICOLONS).filter(({ fixDisabled }) => !fixDisabled).map(({ name }) => fixDisabledRanges(result, name))
	let root = node.root()
	let input = root.source?.input
	let startLine = root.source?.start?.line ?? 1

	if (rangesOfCopies.length === 0 || !input) return offsets

	let free = strays.filter((offset) => {
		let line = (input.fromOffset(offset)?.line ?? 1) + startLine - 1

		return rangesOfCopies.some((ranges) => !ranges.some((range) => range.start <= line && (range.end === undefined || range.end >= line)))
	})

	return free.length === missing ? new Set(free) : offsets
}

/**
 * Finds the semicolons one raw of a node held that a rule listed earlier has taken out, which the file still spells: the run in front of a node, `raws.ownSemicolon`, or a container's tail — a root's own ends its text, an embedded root's too, and a block's text moved into its last node by `declaration-block-trailing-semicolon: never` is read with it.
 * @param node - The node whose raw it is.
 * @param key - Which of its raws.
 * @param text - The root's text.
 * @param result - The Stylelint result, which holds the file's syntax.
 * @returns The offsets.
 */
export function semicolonsTakenAlreadyIn (node: Node, key: `before` | `after` | `ownSemicolon`, text: string, result: PostcssResult): Set<number> {
	let offsets: Set<number> = new Set()
	let rootStart = node.root().source?.start?.offset ?? 0
	let raw = node.raws[key]

	if (typeof raw !== `string`) return offsets

	if (key === `before`) {
		let start = node.source?.start?.offset

		if (start === undefined) return offsets

		let prev = node.prev()
		// The first node's run opens behind its container's brace, or at the root's start
		let front = prev ? endIn(prev, rootStart, result) : (node.parent?.type === `root` ? 0 : text.lastIndexOf(`{`, start - rootStart - 1) + 1)

		return takenAlreadyChecked(node, text, raw, start - rootStart, front, true, result)
	}

	if (node.type === `root`) {
		let root = node as Root
		let moved = movedIn(root.last, text, rootStart, result)

		return moved ? takenAlreadyChecked(node, text, moved.tail + raw, text.length, moved.start, true, result) : takenAlreadyChecked(node, text, raw, text.length, endIn(root.last, rootStart, result), true, result)
	}

	let end = `nodes` in node ? closingOffset(node) : undefined

	if (end === undefined) return offsets

	let own = String(node.raws.ownSemicolon ?? ``)
	let brace = end - rootStart - own.length

	if (key === `ownSemicolon`) return takenAlreadyChecked(node, text, raw, end - rootStart, brace, true, result)

	let moved = movedIn((node as Container).last, text, rootStart, result)

	return moved ? takenAlreadyChecked(node, text, moved.tail + raw, brace - 1, moved.start, true, result) : takenAlreadyChecked(node, text, raw, brace - 1, (node as Container).last ? endIn((node as Container).last, rootStart, result) : text.lastIndexOf(`{`, brace - 2) + 1, true, result)
}

/**
 * Finds the offsets of the stray semicolons rules listed earlier have taken out of the raws `no-extra-semicolons` reads, which the file still spells.
 * @param root - The stylesheet.
 * @param text - Its text.
 * @param result - The Stylelint result, which holds the file's syntax.
 * @returns The offsets.
 */
export function semicolonsTakenAlready (root: Root, text: string, result: PostcssResult): Set<number> {
	let offsets: Set<number> = new Set()

	/**
	 * Files the offsets of one raw.
	 * @param node - The node whose raw it is.
	 * @param key - Which of its raws.
	 */
	function file (node: Node, key: `before` | `after` | `ownSemicolon`): void {
		for (let offset of semicolonsTakenAlreadyIn(node, key, text, result)) offsets.add(offset)
	}

	root.walk((node) => {
		file(node, `before`)

		if (!(`nodes` in node)) return

		if (node.raws.ownSemicolon) file(node, `ownSemicolon`)

		file(node, `after`)
	})
	// An embedded root's tail is left to the per-raw question: the readers asking what the neighbor takes place no semicolon there, and a mask read on one side of the neighbor alone would make the order decide
	if (!root.parent) file(root, `after`)

	return offsets
}
