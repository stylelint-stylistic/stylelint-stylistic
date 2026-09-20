import type { Root } from "postcss"

import { EVERY_LINE_BREAK } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { getBlockAfter } from "../getBlockAfter/index.ts"
import { hasBlock } from "../hasBlock/index.ts"
import { lastLineIndentation, lastLineStart } from "../lineIndentation/index.ts"
import { isAtRule, isRule } from "../typeGuards/index.ts"

/**
 * Reads the indentation of the lines at the root's own level: where each child opens and where its block closes. Continuation and nested lines are left out, or a level read off one would rise with every run of the fix.
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

		if (lastLineStart(before) >= 0) own.push(lastLineIndentation(before))
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

	return { own, tagLine }
}
