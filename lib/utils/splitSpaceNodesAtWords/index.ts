import type { Node as ValueNode } from "postcss-value-parser"

import { LEADING_CSS_WHITESPACE, LEADING_CSS_WORD, TRAILING_CSS_WHITESPACE } from "../../regexps.ts"

/**
 * Cuts a stretch `postcss-value-parser` called whitespace into the runs and the words PostCSS's tokenizer reads in it.
 * @param text - The stretch, spelled as the file spells it.
 * @param sourceIndex - Where the stretch begins, counted in the value the file spells.
 * @returns One node per run and per word, each at the position the file spells it at.
 */
function splitSpaceValue (text: string, sourceIndex: number): ValueNode[] {
	let pieces: ValueNode[] = []
	let index = 0

	while (index < text.length) {
		let rest = text.slice(index)
		let run = (rest.match(LEADING_CSS_WHITESPACE) as RegExpMatchArray)[0]
		let start = sourceIndex + index

		if (run === ``) {
			let word = (rest.match(LEADING_CSS_WORD) as RegExpMatchArray)[0]

			pieces.push({ type: `word`, value: word, sourceIndex: start, sourceEndIndex: start + word.length })
			index += word.length
			continue
		}

		pieces.push({ type: `space`, value: run, sourceIndex: start, sourceEndIndex: start + run.length })
		index += run.length
	}

	return pieces
}

/**
 * Splits every whitespace node of a function at the characters PostCSS's tokenizer reads as words.
 *
 * `postcss-value-parser` counts a vertical tab as whitespace where the tokenizer counts only a space, a tab, a line feed, a carriage return and a form feed, so a stretch holding one came back as a single space node, and every walk of this rule read the character as part of the run beside a parenthesis — the `never-multi-line` fixes then emptied it out of the file in silence (#496). Such a character is a word of the value: a space node holding one is cut into the runs and the words the tokenizer reads, and a function's own `before` and `after` keep only the run touching their parenthesis, the rest joining the nodes. Every walk of the rule then ends where the tokenizer's run does, with nothing asked of the walks themselves, and the printed text is the same characters at the same positions throughout.
 * @param nodes - The nodes of a parsed value; every function among them is rewritten in place, however deep.
 */
export function splitSpaceNodesAtWords (nodes: ValueNode[]): void {
	for (let node of nodes) {
		if (node.type !== `function`) continue

		let pieces = node.nodes.flatMap((child) => (child.type === `space` ? splitSpaceValue(child.value, child.sourceIndex) : [child]))
		let beforeRun = (node.before.match(LEADING_CSS_WHITESPACE) as RegExpMatchArray)[0]

		if (beforeRun !== node.before) {
			let beforeIndex = node.sourceIndex + node.value.length + 1

			pieces.unshift(...splitSpaceValue(node.before.slice(beforeRun.length), beforeIndex + beforeRun.length))
			node.before = beforeRun
		}

		let afterRun = (node.after.match(TRAILING_CSS_WHITESPACE) as RegExpMatchArray)[0]

		if (afterRun !== node.after) {
			let afterStart = node.sourceEndIndex - 1 - node.after.length

			pieces.push(...splitSpaceValue(node.after.slice(0, node.after.length - afterRun.length), afterStart))
			node.after = afterRun
		}

		node.nodes = pieces
		splitSpaceNodesAtWords(node.nodes)
	}
}
