import type { ChildNode, Comment, Node } from "postcss"
import type { PostcssResult } from "stylelint"

import { LEADING_CSS_WORD, LINE_BREAK } from "../../regexps.ts"

/**
 * Asks whether an empty line is due before a comment under the core or plugin copy of `comment-empty-line-before`, accounting for `except: ["first-nested"]`, `ignore: ["stylelint-commands"]` and `ignoreComments`.
 * @param comment - The comment the rule is moving.
 * @param result - The Postcss result carrying the configuration.
 * @returns True where an empty line is due before a comment.
 */
export function commentEmptyLineBeforeAsked (comment: Comment, result: PostcssResult): boolean {
	let rules: Record<string, unknown> | undefined = result.stylelint?.config?.rules

	if (!rules) return false

	for (let [name, value] of Object.entries(rules)) {
		let shortName = name.slice(name.lastIndexOf(`/`) + 1)

		if (shortName !== `comment-empty-line-before`) continue

		let primary = Array.isArray(value) ? value[0] : value

		if (primary !== `always`) continue

		let secondary = Array.isArray(value) ? value[1] : undefined
		let options = typeof secondary === `object` && secondary !== null ? secondary as { except?: unknown, ignore?: unknown, ignoreComments?: unknown } : {}

		if (includesOption(options.except, `first-nested`) && isFirstNested(comment)) continue
		if (includesOption(options.ignore, `stylelint-commands`) && isStylelintCommand(comment, result)) continue
		if (includesOption(options.ignore, `after-comment`) && isAfterComment(comment)) continue
		if (matchesIgnoredComment(comment.text, options.ignoreComments)) continue

		return true
	}

	return false
}

/**
 * Checks whether a secondary option list holds a keyword.
 * @param value - The option or option list.
 * @param keyword - The keyword to find.
 * @returns True when the keyword is configured.
 */
function includesOption (value: unknown, keyword: string): boolean {
	return value === keyword || (Array.isArray(value) && value.includes(keyword))
}

/**
 * Checks whether the comment is the first nested statement, ignoring comments on the opening-brace line as Stylelint does.
 * @param comment - The comment.
 * @returns True when the comment is first nested.
 */
function isFirstNested (comment: Comment): boolean {
	let parent = comment.parent
	let first = parent?.first

	if (!parent || (parent.type === `root` && parent.parent?.type !== `document`)) return false
	if (first === comment) return true
	if (!first || first.type !== `comment` || (LINE_BREAK.test(first.raws.before ?? ``))) return false
	if (!first.source?.start || first.source.end?.line !== first.source.start.line) return false

	return isFirstNestedAfterOpeningComments(parent.nodes ?? [], comment, first.source.start.line)
}

/**
 * Checks whether the comment follows only comments on the opening-brace line.
 * @param nodes - The parent's children.
 * @param comment - The comment.
 * @param openingBraceLine - The opening brace's line.
 * @returns True when no other statement precedes the comment.
 */
function isFirstNestedAfterOpeningComments (nodes: ChildNode[], comment: Comment, openingBraceLine: number): boolean {
	let first = nodes[0]

	for (let node of nodes) {
		if (node === first) continue
		if (node === comment) return true
		if (node.type !== `comment` || node.source?.end?.line !== openingBraceLine) return false
	}

	return false
}

/**
 * Checks whether Stylelint recognizes the comment as a configuration command.
 * @param comment - The comment.
 * @param result - The PostCSS result carrying the configuration.
 * @returns True when the comment is a Stylelint command.
 */
function isStylelintCommand (comment: Comment, result: PostcssResult): boolean {
	let configurationComment = result.stylelint?.config?.configurationComment ?? `stylelint`
	let command = comment.text.trim().match(LEADING_CSS_WORD)?.[0] ?? ``
	let suffix = command.slice(configurationComment.length)

	return command.startsWith(`${configurationComment}-`) && [`-disable`, `-disable-line`, `-disable-next-line`, `-enable`].includes(suffix)
}

/**
 * Checks whether the comment text matches an `ignoreComments` setting.
 * @param text - The comment text.
 * @param ignored - The configured text or patterns.
 * @returns True when an ignore setting matches.
 */
function matchesIgnoredComment (text: string, ignored: unknown): boolean {
	let patterns = Array.isArray(ignored) ? ignored : [ignored]

	return patterns.some((pattern) => {
		if (pattern instanceof RegExp) return text.match(pattern) !== null
		if (typeof pattern !== `string`) return false
		if (pattern.startsWith(`/`) && (pattern.endsWith(`/`) || pattern.endsWith(`/i`))) {
			let insensitive = pattern.endsWith(`/i`)
			let expression = new RegExp(pattern.slice(1, insensitive ? -2 : -1), insensitive ? `i` : ``)

			return text.match(expression) !== null
		}

		return text === pattern
	})
}

/**
 * Checks whether the preceding comment is not shared with another node, as the core rule defines `ignore: ["after-comment"]`.
 * @param comment - The comment.
 * @returns True when a non-shared-line comment precedes it.
 */
function isAfterComment (comment: Comment): boolean {
	let previous = comment.prev()

	return previous?.type === `comment` && !isSharedLineComment(previous)
}

/**
 * Checks whether a comment shares a source line with the nearest non-shared comment or another node.
 * @param comment - The comment.
 * @returns True when the comment shares a line.
 */
function isSharedLineComment (comment: Comment): boolean {
	let previous = previousNonSharedLineNode(comment)

	if (nodesShareLines(previous, comment)) return true

	let next = nextNonSharedLineNode(comment)

	if (next && nodesShareLines(comment, next)) return true

	let parent = comment.parent

	return Boolean(parent && parent.type !== `root` && parent.first === comment && comment.raws.before !== undefined && !LINE_BREAK.test(comment.raws.before))
}

/**
 * Finds the previous node that does not share a line with a comment chain.
 * @param node - The node.
 * @returns The previous non-shared node.
 */
function previousNonSharedLineNode (node: Node): Node | undefined {
	let previous = node.prev()

	if (previous?.type !== `comment`) return previous
	if (sourceLine(node) === sourceLine(previous)) return previousNonSharedLineNode(previous)

	let beforePrevious = previous.prev()

	if (beforePrevious && sourceLine(previous) === sourceLine(beforePrevious)) return previousNonSharedLineNode(previous)

	return previous
}

/**
 * Finds the next node that does not share a line with a comment chain.
 * @param node - The node.
 * @returns The next non-shared node.
 */
function nextNonSharedLineNode (node: Node): Node | undefined {
	let next = node.next()

	if (next?.type !== `comment`) return next
	if (sourceLine(node) === sourceLine(next) || sourceLine(next) === sourceLine(next.next())) return nextNonSharedLineNode(next)

	return next
}

/**
 * Reads the source line where a node starts.
 * @param node - The node.
 * @returns The line, if the parser recorded one.
 */
function sourceLine (node: Node | undefined): number | undefined {
	return node?.source?.start?.line
}

/**
 * Checks whether one node ends on the line where the next starts.
 * @param first - The first node.
 * @param second - The second node.
 * @returns True when their source lines meet.
 */
function nodesShareLines (first: Node | undefined, second: Node | undefined): boolean {
	return first?.source?.end?.line === second?.source?.start?.line
}
