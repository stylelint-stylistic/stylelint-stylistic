import type { Root } from "postcss"

import { EVERY_LINE_BREAK, WHITESPACE_OR_NOTHING } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { getBlockAfter } from "../getBlockAfter/index.ts"
import { hasBlock } from "../hasBlock/index.ts"
import { lastLineIndentation, lastLineStart } from "../lineIndentation/index.ts"
import { isAtRule, isComment, isRule } from "../typeGuards/index.ts"

/**
 * Reads the indentation of the lines at the root's own level: where each child opens, where its block closes, and where a comment the parser filed in the root's `raws.after` opens. Continuation and nested lines are left out, or a level read off one would rise with every run of the fix.
 *
 * The first child may open on the tag's line, `<style>a {`, returned apart under `tagLine`. A line's indentation is the tokenizer whitespace opening it, a form feed or a bare carriage return as much as a space; what stands behind that run, a stray semicolon or a hack, is on the line rather than in front of it.
 * @param syntax - The syntax the rule is built over, which the closing run is read through.
 * @param root - The stylesheet whose top-level lines are read.
 * @param closingBraceIndented - Whether a closing brace stands a level deeper; its line is then none of the root's.
 * @returns The root's own lines, and the tag's line apart.
 */
export function rootLevelIndents (syntax: Syntax, root: Root, closingBraceIndented: boolean): { own: string[], tagLine: string[] } {
	let own: string[] = []
	let tagLine: string[] = []

	for (let child of root.nodes) {
		let before = child.raws.before ?? ``

		if (lastLineStart(before) >= 0) {
			let indent = lastLineIndentation(before)

			// A comment's `raws.before` is the line break behind the previous node. An empty indentation there means the comment stands at the left margin and must not drag the root's base level down to it; a comment with an indentation still reads that indentation as its own line. The comment itself is measured by `checkNodeLine`.
			if (isComment(child) && indent === ``) continue

			own.push(indent)
		}
		else if (child === root.first) {
			// The tail of `codeBefore` and the run behind it
			let lineBefore = `${(root.raws.codeBefore ?? ``).split(EVERY_LINE_BREAK).at(-1) ?? ``}${before}`
			let indentation = lastLineIndentation(lineBefore)

			if (indentation === lineBefore) own.push(indentation)
			else tagLine.push(indentation)
		}

		if (closingBraceIndented || !(isRule(child) || isAtRule(child)) || !hasBlock(child)) continue

		let blockAfter = getBlockAfter(syntax, child) ?? ``

		if (lastLineStart(blockAfter) >= 0) own.push(lastLineIndentation(blockAfter))
	}

	readAfterRaw(root, own)

	return { own, tagLine }
}

/**
 * Reads the comments the parser filed in the root's `raws.after` — behind a bodiless at-rule with params that closes the root without a semicolon — and pushes the indentation of each line they open on. The raw's first line is the at-rule's own line and is left out, as is a line of whitespace alone and any line inside a comment opened above.
 * @param root - The root whose `raws.after` holds the comments.
 * @param own - The root's own lines, pushed into.
 */
function readAfterRaw (root: Root, own: string[]): void {
	let [first = ``, ...afterLines] = (root.raws.after ?? ``).split(EVERY_LINE_BREAK)
	let insideComment = opensACommentLeftOpen(first, false)

	for (let line of afterLines) {
		if (!insideComment && !WHITESPACE_OR_NOTHING.test(line)) own.push(lastLineIndentation(line))

		insideComment = opensACommentLeftOpen(line, insideComment)
	}
}

/**
 * Asks whether a line of a root's `raws.after` ends inside a block comment: the raw holds comments and whitespace alone, so a `//` comment reaches the line's end where the syntax reads one, and a block comment runs on past it until its `*\/`.
 * @param line - The line.
 * @param insideComment - Whether the line opens inside a block comment.
 * @returns Whether it ends inside one.
 */
function opensACommentLeftOpen (line: string, insideComment: boolean): boolean {
	let open = insideComment
	let index = 0

	while (index < line.length) {
		if (open) {
			let close = line.indexOf(`*/`, index)

			if (close === -1) return true

			open = false
			index = close + 2

			continue
		}

		let opening = line.indexOf(`/*`, index)
		let inline = line.indexOf(`//`, index)

		if (opening === -1 || (inline !== -1 && inline < opening)) return false

		open = true
		index = opening + 2
	}

	return open
}
