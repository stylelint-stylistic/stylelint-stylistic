import type { Root } from "postcss"

import { EVERY_LINE_BREAK, LEADING_WHITESPACE_WITHOUT_BREAK } from "../../regexps.ts"
import { getBlockAfter } from "../getBlockAfter/index.ts"
import { hasBlock } from "../hasBlock/index.ts"
import { isAtRule, isRule } from "../typeGuards/index.ts"

/**
 * Reads the indentation of the lines at the root's own level: where each child opens and where its block closes. Continuation and nested lines are left out, or a level read off one would rise with every run of the fix.
 *
 * The first child may open on the tag's line, `<style>a {`, returned apart under `tagLine`. Whitespace alone in front of the child is its indentation whole, form feed or bare carriage return included, since the rule writes over the same run ([#452](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/452)).
 * @param root - The stylesheet whose top-level lines are read.
 * @param closingBraceIndented - Whether a closing brace stands a level deeper; its line is then none of the root's.
 * @returns The root's own lines, and the tag's line apart.
 */
export function rootLevelIndents (root: Root, closingBraceIndented: boolean): { own: string[], tagLine: string[] } {
	let own: string[] = []
	let tagLine: string[] = []

	for (let child of root.nodes) {
		let beforeLines = (child.raws.before ?? ``).split(EVERY_LINE_BREAK)
		let lastBeforeLine = beforeLines.at(-1) ?? ``

		if (beforeLines.length > 1) own.push(lastBeforeLine)
		else if (child === root.first) {
			// The tail of `codeBefore` and the run behind it
			let lineBefore = `${(root.raws.codeBefore ?? ``).split(EVERY_LINE_BREAK).at(-1) ?? ``}${lastBeforeLine}`
			let pastWhitespace = lineBefore.replace(LEADING_WHITESPACE_WITHOUT_BREAK, ``)

			if (pastWhitespace === ``) own.push(lineBefore)
			else tagLine.push(lineBefore.slice(0, lineBefore.length - pastWhitespace.length))
		}

		if (closingBraceIndented || !(isRule(child) || isAtRule(child)) || !hasBlock(child)) continue

		let afterLines = (getBlockAfter(child) ?? ``).split(EVERY_LINE_BREAK)

		if (afterLines.length > 1) own.push(afterLines.at(-1) ?? ``)
	}

	return { own, tagLine }
}
