import type { Document, Node, Root, Source } from "postcss"

import { EVERY_LINE_INDENT_WITH_CONTENT, EVERY_LINE_SPACE_INDENT, EVERY_SPACE, EVERY_TAB, LEADING_SPACES_AND_TABS, OPENS_WITH_TAG, TRAILING_LINE_BREAK } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { rootLevelIndents } from "../../utils/rootLevelIndents/index.ts"
import { assertString, isNumber } from "../../utils/validateTypes/index.ts"

/**
 * The base level of a root, cached on its source.
 * @param syntax - The syntax the rule is built over.
 * @param root - The root whose source caches the level.
 * @param baseIndentLevel - The `baseIndentLevel` option.
 * @param space - The primary option.
 * @param indentClosingBrace - The `indentClosingBrace` option.
 * @returns The base level.
 */
export function getRootBaseIndentLevel (syntax: Syntax, root: Root, baseIndentLevel: number | `auto` | undefined, space: number | `tab`, indentClosingBrace: boolean | undefined): number {
	let document = getDocument(root)

	if (!document) return 0

	if (!root.source) throw new Error(`The root node must have a source`)

	let source: Source & { baseIndentLevel?: number } = root.source

	let indentLevel = source.baseIndentLevel

	if (isNumber(indentLevel) && Number.isSafeInteger(indentLevel)) return indentLevel

	// A spaces option names the width of a level, so a root's own lines are measured in it; a width voted off the page's lines mixed two units, and after a fix the lines the rule had just written outvoted the page and read a level lower on the next run. Under `tab` the width of a space-indented line has to be guessed, and the page is what it is guessed off
	let newIndentLevel = inferRootIndentLevel(syntax, root, baseIndentLevel, () => (isNumber(space) ? space : inferDocIndentSize(document, space)), indentClosingBrace)

	source.baseIndentLevel = newIndentLevel

	return newIndentLevel
}

/**
 * The document a node belongs to.
 * @param node - The node whose root is asked for its document.
 * @returns The document, or undefined.
 */
export function getDocument (node: Node): Document | undefined {
	let holder = `document` in node ? node : node.root()

	if (!(`document` in holder)) return

	return holder.document as Document | undefined
}

/**
 * Infers a document's indent size, cached on its source.
 * @param document - The document whose source is measured.
 * @param space - The primary option.
 * @returns The indent size.
 */
function inferDocIndentSize (document: Document, space: number | `tab`): number {
	if (!document.source) throw new Error(`The document node must have a source`)

	let docSource: Source & { indentSize?: number } = document.source

	let indentSize = docSource.indentSize

	if (isNumber(indentSize) && Number.isSafeInteger(indentSize)) return indentSize

	let source = document.source.input.css
	let indents = source.match(EVERY_LINE_SPACE_INDENT)

	let scores: Map<number, number> = (new Map())
	let lastIndentSize = 0
	let lastLeadingSpacesLength = 0

	/**
	 * Votes for an indent size.
	 * @param leadingSpacesLength - The width of one line's leading spaces.
	 */
	function vote (leadingSpacesLength: number): void {
		if (leadingSpacesLength) {
			lastIndentSize = Math.abs(leadingSpacesLength - lastLeadingSpacesLength) || lastIndentSize

			if (lastIndentSize > 1) {
				let score = scores.get(lastIndentSize)

				if (score) scores.set(lastIndentSize, score + 1)
				else scores.set(lastIndentSize, 1)
			}
		}
		else lastIndentSize = 0

		lastLeadingSpacesLength = leadingSpacesLength
	}

	if (indents) {
		for (let leadingSpaces of indents) vote(leadingSpaces.length)

		let bestScore = 0

		for (let [indentSizeDate, score] of scores.entries()) {
			if (score > bestScore) {
				bestScore = score
				indentSize = indentSizeDate
			}
		}
	}

	// With no vote cast, the first indented line's width stands in
	let firstIndentSize = indents?.[0]?.length ?? 0

	indentSize = Number(indentSize) || firstIndentSize || Number(space) || 2
	docSource.indentSize = indentSize

	return indentSize
}

/**
 * Infers a root's base level.
 * @param syntax - The syntax the rule is built over.
 * @param root - The root whose own lines are read.
 * @param baseIndentLevel - The `baseIndentLevel` option.
 * @param indentSize - Returns the indent size.
 * @param indentClosingBrace - The `indentClosingBrace` option.
 * @returns The level.
 */
function inferRootIndentLevel (syntax: Syntax, root: Root, baseIndentLevel: number | `auto` | undefined, indentSize: () => number, indentClosingBrace: boolean | undefined): number {
	/**
	 * The level of an indentation string.
	 * @param indent - The indentation.
	 * @returns The level.
	 */
	function getIndentLevel (indent: string): number {
		let tabMatch = indent.match(EVERY_TAB)
		let tabCount = tabMatch ? tabMatch.length : 0

		let spaceMatch = indent.match(EVERY_SPACE)
		let spaceCount = spaceMatch ? Math.round(spaceMatch.length / indentSize()) : 0

		return tabCount + spaceCount
	}

	let newBaseIndentLevel

	if (!isNumber(baseIndentLevel) || !Number.isSafeInteger(baseIndentLevel)) {
		let { own, tagLine } = rootLevelIndents(syntax, root, indentClosingBrace ?? false)

		// Read off the root's own lines, the ones statements open and blocks close on; a line inside a statement or nested block is measured against this level and rose a level every `--fix`. A brace under `indentClosingBrace` is left out too; the tag's line stands in only where the sheet has no line of its own
		let indents = own.length > 0 ? own : tagLine

		if (indents.length > 0) return Math.min(...indents.map((indent) => getIndentLevel(indent)))

		newBaseIndentLevel = 1
	}
	else newBaseIndentLevel = baseIndentLevel

	let indents = []
	let foundIndents = root.raws.codeBefore?.match(EVERY_LINE_INDENT_WITH_CONTENT)

	// The indent of the first non-empty line in front of the block
	if (foundIndents) {
		let i = foundIndents.length - 1

		while (i >= 0) {
			let foundIndent = foundIndents[i]

			assertString(foundIndent)

			if (OPENS_WITH_TAG.test(foundIndent)) {
				let current = getIndentLevel(foundIndent)

				indents.push(Array.from({ length: current }).fill(`  `).join(``))
				break
			}
			i -= 1
		}
	}

	let after = root.raws.after

	if (after) {
		let afterEnd

		if (TRAILING_LINE_BREAK.test(after)) {
			let document = (`document` in root ? root.document : undefined) as Document | undefined

			if (document) {
				let nextRoot = document.nodes[document.nodes.indexOf(root) + 1]

				afterEnd = nextRoot ? nextRoot.raws.codeBefore : document.raws.codeAfter
			}
			else {
				// Nested root node in css-in-js lang
				let parent = root.parent

				if (!parent) throw new Error(`The root node must have a parent`)

				let nextRoot = parent.nodes[parent.nodes.indexOf(root) + 1]

				afterEnd = nextRoot ? nextRoot.raws.codeBefore : root.raws.codeAfter
			}
		}
		else afterEnd = after

		if (afterEnd) indents.push(afterEnd.match(LEADING_SPACES_AND_TABS)[0])
	}

	if (indents.length > 0) return Math.max(...indents.map((indent) => getIndentLevel(indent))) + newBaseIndentLevel

	return newBaseIndentLevel
}
