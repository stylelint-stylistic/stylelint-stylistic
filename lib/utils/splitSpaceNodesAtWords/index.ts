import type { Node as ValueNode } from "postcss-value-parser"

import { LEADING_CSS_WHITESPACE, LEADING_CSS_WORD, TRAILING_CSS_WHITESPACE } from "../../regexps.ts"

/**
 * Cuts a value-parser whitespace stretch into the tokenizer's runs and words.
 * @param text - The stretch.
 * @param sourceIndex - Its start in the value.
 * @returns One node per run and per word.
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
 * Splits a function's whitespace nodes at the characters the tokenizer reads as words.
 *
 * `postcss-value-parser` counts a vertical tab as whitespace and the tokenizer does not, so the `never-multi-line` fixes emptied a stretch holding one ([#496](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/496)). Such a node is cut into the tokenizer's runs and words; `before` and `after` keep only the run touching the parenthesis.
 * @param nodes - A parsed value; every function is rewritten in place.
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
