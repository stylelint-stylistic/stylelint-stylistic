import type { Node } from "postcss"
import type { PostcssResult } from "stylelint"

import { TRAILING_CSS_WHITESPACE } from "../../regexps.ts"
import { runInFrontOf } from "../runInFrontOf/index.ts"
import { edgeRunAsked } from "../textEdge/index.ts"
import { isAtRule, isDeclaration } from "../typeGuards/index.ts"

/**
 * What the file holds in front of the text a rule reads off a node, which the parser filed away from that text.
 *
 * A delimiter opening the text has its run there and nowhere else, so a check reading only the text takes the head of it for the start of the file. The raw is returned whole rather than trimmed to its whitespace: a comment or the colon ending it is what stands in front of the delimiter, and a reader walking back through it must meet that character rather than run past it.
 *
 * An at-rule keeps it in `raws.afterName`, a declaration in `raws.between`; anything else is asked of `runInFrontOf`. In front of a root's first statement `postcss-html` and `postcss-styled-syntax` put the host code up to the embedded stylesheet in the root's `raws.codeBefore`, and the whole of a `<style>` element's opening break lives there, so that raw comes first.
 * @param node - The node whose text is read.
 * @returns What stands in front of the text, empty where nothing does.
 */
export function rawInFrontOfText (node: Node): string {
	if (isAtRule(node)) return node.raws.afterName ?? ``

	if (isDeclaration(node)) return node.raws.between ?? ``

	let { parent } = node
	let codeBefore = parent?.type === `root` && parent.first === node ? (parent.raws.codeBefore ?? ``) : ``

	return codeBefore + runInFrontOf(node)
}

/**
 * Reads the text whose lineness a list asks, where a delimiter opens it: the list's first item is empty, and the run in front of that delimiter, which the parser files in the raw in front of the text, stands inside the list, as the run in front of any later delimiter does. Behind an at-rule's name the whole raw stands there, comments and all; in front of a rule its trailing run does, a comment in front of it being a node of its own. Where an item opens the text, the run in front of it stands in front of the list.
 *
 * Where a live neighbor writes that raw (`edgeRunAsked`) the run is read as that neighbor leaves it, so that the list reads alike in front of the write and behind it, whichever side of the neighbor the asking rule is listed.
 * @param node - The node whose text it is.
 * @param text - The text.
 * @param opensWithDelimiter - Whether a delimiter opens the text.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns The text to ask lineness of.
 */
export function listLines (node: Node, text: string, opensWithDelimiter: boolean, result: PostcssResult): string {
	if (!opensWithDelimiter) return text

	let raw = rawInFrontOfText(node)
	let run = isAtRule(node) ? raw : (TRAILING_CSS_WHITESPACE.exec(raw)?.[0] ?? ``)
	let asked = edgeRunAsked(node, result)

	// The run is read as the neighbors writing it leave it: a break where every one asks one, none where they ask a space or nothing, as it stands where only the indentation is theirs
	if (asked.every((spelling) => spelling === `noIndentation`)) return `${run}${text}`

	if (asked.every((spelling) => spelling === `newline`)) return `\n${text}`

	return text
}
