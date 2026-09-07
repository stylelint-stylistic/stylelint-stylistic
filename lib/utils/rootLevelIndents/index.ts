import type { Root } from "postcss"

import { EVERY_LINE_BREAK, LEADING_WHITESPACE_WITHOUT_BREAK } from "../../regexps.ts"
import { getBlockAfter } from "../getBlockAfter/index.ts"
import { hasBlock } from "../hasBlock/index.ts"
import { isAtRule, isRule } from "../typeGuards/index.ts"

/**
 * Reads the indentation of every line of a root that stands at the root's own level: the line each child of the root opens on, and the line each block of such a child closes on. A line inside a statement — the continuation of a selector, of a value, of an at-rule's parameters — and a line of a nested block are left out: the rule measures every one of them against the level read here, so a level read off such a line would answer for itself, and one the rule writes deeper than the root would rise with every run of the fix.
 *
 * The line the first child opens on may be the line of the tag the stylesheet hangs from, `<style>a {` or a `style` attribute: what stands in front of the child on it is the tail of `raws.codeBefore`, and the child's own indentation is unknown there. Such a line is handed back apart, under `tagLine`, indented by what the tag is. The line is the stylesheet's own where nothing but whitespace short of a break stands in front of the child, and that whole run is its indentation — a form feed or a bare carriage return in it included, since the rule reads and writes over the same run in front of the first node (#452).
 * @param root - The root.
 * @param closingBraceIndented - Whether a closing brace stands a level deeper than its block, as `indentClosingBrace` asks: the line it closes on is then no line of the root's either.
 * @returns The indentation of the root's own lines, and of the tag's line where the first child stands on it.
 */
export function rootLevelIndents (root: Root, closingBraceIndented: boolean): { own: string[], tagLine: string[] } {
	let own: string[] = []
	let tagLine: string[] = []

	for (let child of root.nodes) {
		let beforeLines = (child.raws.before ?? ``).split(EVERY_LINE_BREAK)
		let lastBeforeLine = beforeLines.at(-1) ?? ``

		if (beforeLines.length > 1) own.push(lastBeforeLine)
		else if (child === root.first) {
			// Whatever stands on the line in front of the first child: the tail of the code the stylesheet hangs from, and the run in front of the child behind it. Where that is whitespace alone, the line is the stylesheet's own, opened after a break of `codeBefore`, and the whitespace is its indentation
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
