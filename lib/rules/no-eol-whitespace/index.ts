import type { AtRule, Comment, Container, Declaration, Node, Rule } from "postcss"
import stylelint, { type PostcssResult } from "stylelint"

import { OPENS_WITH_LINE_BREAK_PAST_CSS_WHITESPACE, TRAILING_LINE_BREAK, WHITESPACE_OR_NOTHING } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { fixDisabledOnLine, fixDisabledRanges } from "../../utils/fixDisabledOnLine/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { optionsMatches } from "../../utils/optionsMatches/index.ts"
import { report } from "../../utils/report/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { semicolonsTakenAlready } from "../../utils/semicolonsTakenAlready/index.ts"
import { straySemicolonOffsetsTaken, straySemicolonsTaken, straySemicolonsTakenBefore, straySemicolonsTakenOwn } from "../../utils/straySemicolonsTaken/index.ts"
import { isAtRule, isComment, isDeclaration, isRule } from "../../utils/typeGuards/index.ts"

import { backslashesBehindHead, backslashesBehindStatement, isEscaped } from "./escapes.ts"
import { trimTheLastNodesEnd } from "./lastNodesEnd.ts"
import { byRank, lineInFile, type LineOf, linesBackFrom, linesFound, linesOnFrom, rootsLastLine } from "./lines.ts"
import { eachEolWhitespace, type EolRun, type EolScope, fixString, fixText, keptAt, lastLineBreakIndex, LINE_BREAK_CHARACTERS, runsOf, type TextOptions, WHITESPACES_TO_REJECT } from "./runs.ts"
import { afterSpan, beforeSpan, braceOffset, headSpan, ownSemicolonSpan, type Span, tailSpan } from "./spans.ts"
import { maskTaken, TAKEN_MARK, trimKeepingTaken } from "./taken.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `no-eol-whitespace`

const MESSAGES = defineMessages({
	rejected: `Unexpected whitespace at end of line`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `true`; the rule has no other setting. */
export type PrimaryOption = true

/** The secondary options. */
export type SecondaryOptions = {

	/** `empty-lines` allows whitespace on a line holding nothing else. */
	ignore?: `empty-lines` | `empty-lines`[],
}

/**
 * Asks whether nothing but whitespace follows a rule on its line, reading the raw behind it — the next node's `raws.before`, else its container's `raws.after` — as it stands and as the neighbors leave it, so that the last line of its `raws.ownSemicolon` ends there as far as whitespace at its end goes. The end of the root ends a line too, which for a root a document holds is the end of its block.
 * @param scope - The run.
 * @param node - The rule.
 * @returns True where it does.
 */
function breakFollows (scope: EolScope, node: Node): boolean {
	let next = node.next()
	let container = node.parent as Container | undefined
	let behind = next ? next.raws.before : container?.raws.after

	if (typeof behind !== `string`) return false

	let taken = new Set<number>()

	if (next) taken = straySemicolonsTakenBefore(next, scope.result)
	else if (container) taken = straySemicolonsTaken(container, scope.result)

	let read = maskTaken(behind, taken).replaceAll(TAKEN_MARK, ``)

	return OPENS_WITH_LINE_BREAK_PAST_CSS_WHITESPACE.test(read) || (!next && container === scope.root && WHITESPACE_OR_NOTHING.test(read))
}

/** A text of a node the fix trims: the text, how it is written back and read, and how its lines are read where the check's runs do not tell them. */
type Part = {
	text: string | undefined,
	write: (fixed: string) => void,
	options?: TextOptions | undefined,
	fallback: LineOf,
}

/**
 * Trims the ends of the lines of the texts of one span of the file. Where a disable comment keeps the fix off some line, the runs of the texts, in the order the file holds them, are read by rank against the runs the check found in the span.
 * @param scope - The run.
 * @param parts - The texts, in the order the file holds them.
 * @param span - The span, if the file tells it.
 * @param sequence - The order to write them in, where it is another.
 */
function fixParts (scope: EolScope, parts: Part[], span: Span | undefined, sequence: number[] = parts.map((_, index) => index)): void {
	let lines = linesFound(scope.found, span)
	let counts = lines ? parts.map(({ text, options }) => runsOf(scope, text, options).length) : []
	let total = counts.reduce((sum, count) => sum + count, 0)

	for (let index of sequence) {
		let part = parts[index]

		if (!part) continue

		let first = counts.slice(0, index).reduce((sum, count) => sum + count, 0)

		fixText(scope, part.text, part.write, { ...part.options, lineOf: byRank(lines, part.fallback, first, total) })
	}
}

/**
 * Reads the texts of a statement's head in the order the file holds them — an at-rule's name and params, a rule's selector, the run behind them, a declaration's value and a flag — each reading its lines, where the check's runs do not tell them, from the line the node opens on.
 * @param syntax - The syntax, which reads and writes the head.
 * @param node - The node.
 * @param opens - The line it opens on, if the file holds it.
 * @param result - The Stylelint result, which names the syntax the file was parsed with.
 * @returns The texts.
 */
function headParts (syntax: Syntax, node: AtRule | Declaration | Rule, opens: number | undefined, result: PostcssResult): Part[] {
	let parts: Part[] = []
	let head = ``

	/**
	 * Files a text of the head behind the ones in front of it.
	 * @param text - The text.
	 * @param write - Writes it back.
	 * @param options - How it is read.
	 */
	function add (text: string, write: (fixed: string) => void, options?: TextOptions): void {
		parts.push({ text, write, options, fallback: linesOnFrom(opens, head, text) })
		head += text
	}

	if (isAtRule(node)) {
		add(node.raws.afterName ?? ``, (fixed) => {
			node.raws.afterName = fixed
		})
		// Whatever stands in front of the params, the name holds no break
		add(syntax.read(node), (fixed) => {
			syntax.write(node, fixed)
		})
	}
	// An inline comment in the selector may end in a space the raw hides
	else if (isRule(node)) {
		add(syntax.read(node), (fixed) => {
			syntax.write(node, fixed)
		})
	}
	else head = node.prop

	add(node.raws.between ?? ``, (fixed) => {
		node.raws.between = fixed
	}, { lead: backslashesBehindHead(syntax, node, result) })

	if (isDeclaration(node)) {
		add(syntax.read(node), (fixed) => {
			syntax.write(node, fixed)
		})
	}

	// The run behind a Less mixin call's flag, which the `less` namespace hands to the flag's raw, and behind a declaration's, where the parser files the comments and the whitespace behind the flag up to the node's end
	let important = isRule(node) ? undefined : node.raws.important

	if (typeof important === `string`) {
		add(important, (fixed) => {
			node.raws.important = fixed
		})
	}

	return parts
}

/**
 * Trims the ends of the lines of a comment.
 * @param scope - The run.
 * @param node - The comment.
 * @param opens - The line it opens on, if the file holds it.
 */
function fixComment (scope: EolScope, node: Comment, opens: number | undefined): void {
	let { syntax } = scope
	let left = node.raws.left ?? ``
	let right = node.raws.right ?? ``
	let rightLines = linesOnFrom(opens, `${left}${node.text}`, right)

	// `postcss-less` runs an inline comment to a line feed, so a bare carriage return or form feed ending the file stays in its `raws.right`; `postcss-scss` ends the comment on either and leaves them to the root's `raws.after`. The comment body is prose
	fixParts(scope, [
		{
			text: left,
			write: (fixed): void => {
				node.raws.left = fixed
			},
			fallback: linesOnFrom(opens, ``, left),
		},
		{
			text: node.text,
			write: (fixed): void => {
				node.text = fixed
			},
			options: { isPlainText: true },
			fallback: linesOnFrom(opens, left, node.text),
		},
		{
			text: right,
			write: (fixed): void => {
				node.raws.right = fixed
			},
			fallback: rightLines,
		},
	], headSpan(node, scope.result), [0, 2, 1])

	// A whitespace-only inline comment is an empty text with the whitespace in `raws.left`; trimming `raws.left` under a text would close `// c` onto it. The comment's line keeps its end where a disable comment keeps the fix off it
	if (!syntax.isStandardComment(node) && !keptAt(scope, rightLines, right.length)) {
		if (node.raws.right) node.raws.right = fixString(node.raws.right)
		else if (!node.text && node.raws.left) node.raws.left = fixString(node.raws.left)
	}
}

/**
 * Trims the ends of the lines behind a node's last child: the run in front of a block's closing brace, and a stray semicolon behind the brace with the run in front of it. Where the check's runs do not tell their lines, they are read from the brace's.
 * @param scope - The run.
 * @param node - The node.
 */
function fixBlockEnd (scope: EolScope, node: Node): void {
	let { syntax, root, result } = scope
	let brace = braceOffset(node)
	let braceLine = brace === undefined ? node.source?.end?.line : lineInFile(root, brace)

	if (isAtRule(node) || isRule(node)) {
		let after = node.raws.after ?? ``

		fixParts(scope, [
			{
				text: node.raws.after,
				write: (fixed): void => {
					node.raws.after = fixed
				},
				options: { lead: backslashesBehindStatement(syntax, node.last, result), taken: straySemicolonsTaken(node, result) },
				fallback: linesBackFrom(braceLine, after),
			},
		], afterSpan(node, result))
	}

	// A stray semicolon behind a rule's closing brace, which PostCSS files with the run in front of it in the rule's own `raws.ownSemicolon`; the break ending its last line stands in the raw behind it
	if (typeof node.raws.ownSemicolon === `string`) {
		// A break standing in for the one behind the raw, taken off again
		let lineEnd = breakFollows(scope, node) ? LINE_BREAK_CHARACTERS.join(``) : ``
		let own = `${node.raws.ownSemicolon}${lineEnd}`

		fixParts(scope, [
			{
				text: own,
				write: (fixed): void => {
					node.raws.ownSemicolon = fixed.slice(0, fixed.length - lineEnd.length)
				},
				options: { taken: straySemicolonsTakenOwn(node, result) },
				fallback: linesOnFrom(braceLine, ``, own),
			},
		], ownSemicolonSpan(node))
	}
}

/**
 * Trims the ends of the lines of the root's tail, and the end of its last line, which a disable comment may keep.
 * @param scope - The run.
 * @param isRootFirst - Whether the tail opens the root.
 */
function fixRootsEnd (scope: EolScope, isRootFirst: boolean): void {
	let { syntax, root } = scope
	let lead = backslashesBehindStatement(syntax, root.last, scope.result)
	let lastLine = rootsLastLine(root)

	fixParts(scope, [
		{
			text: root.raws.after,
			write: (fixed): void => {
				root.raws.after = fixed
			},
			options: { isRootFirst, lead, taken: straySemicolonsTaken(root, scope.result), lastBreakWritten: scope.sourceEndsWithoutBreak },
			fallback: linesBackFrom(lastLine, root.raws.after ?? ``),
		},
	], tailSpan(root, scope.result))

	if (scope.kept?.(lastLine)) return

	trimTheLastLine(scope, lead)
	trimTheLastNodesEnd(scope.syntax, scope.root, scope.result)
}

/**
 * Trims the root's last line where its tail holds it.
 * @param scope - The run.
 * @param lead - The backslashes the text in front of the tail ends on.
 */
function trimTheLastLine (scope: EolScope, lead: number): void {
	let { syntax, root } = scope

	if (typeof root.raws.after === `string`) {
		let after = root.raws.after
		// A space or tab a backslash in front of the tail escapes opens no run
		let lastLineStart = lastLineBreakIndex(after) + 1
		let start = lastLineStart === 0 && WHITESPACES_TO_REJECT.has(after.charAt(0)) && syntax.readsBackslashesAsWritten(root) && isEscaped(after, 0, lead) ? 1 : lastLineStart
		// Asked again, since the trim above may have shortened the tail
		let read = maskTaken(after, straySemicolonsTaken(root, scope.result))

		// Under `ignore: empty-lines` a last line of nothing but whitespace is passed over, as the check passes it
		let opensALine = lastLineStart > 0 || !root.first

		if (start < after.length && !(scope.ignoreEmptyLines && opensALine && WHITESPACE_OR_NOTHING.test(read.slice(start).replaceAll(TAKEN_MARK, ``)))) root.raws.after = after.slice(0, start) + trimKeepingTaken(after.slice(start), read.slice(start), false)
	}
}

/**
 * Trims the end of every line of every text a node holds. Where a disable comment keeps the fix off some line, each span of the file — the run in front of a node, its head, the run in front of its closing brace, a stray semicolon behind it, the root's tail — reads its runs by rank against the runs the check found there, however many breaks a neighbor listed earlier wrote around them.
 * @param scope - The run.
 */
function fixRoot (scope: EolScope): void {
	let { syntax, root, result } = scope
	let isRootFirst = true

	root.walk((node) => {
		let opens = node.source?.start?.line
		let before = node.raws.before ?? ``

		fixParts(scope, [
			{
				text: node.raws.before,
				write: (fixed): void => {
					node.raws.before = fixed
				},
				options: { isRootFirst, lead: backslashesBehindStatement(syntax, node.prev(), result), taken: straySemicolonsTakenBefore(node, result) },
				fallback: linesBackFrom(opens, before),
			},
		], beforeSpan(node, result))
		isRootFirst = false

		// A declaration's head is written flag first, then value, as the flag's raw may hold what the value's writer reads
		if (isAtRule(node) || isRule(node)) fixParts(scope, headParts(syntax, node, opens, result), headSpan(node, result))
		else if (isDeclaration(node)) fixParts(scope, headParts(syntax, node, opens, result), headSpan(node, result), typeof node.raws.important === `string` ? [0, 2, 1] : [0, 1])

		if (isComment(node)) fixComment(scope, node, opens)

		fixBlockEnd(scope, node)
	})

	fixRootsEnd(scope, isRootFirst)
}

/**
 * Disallows end-of-line whitespace.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option.
 * @param secondaryOptions - The secondary options.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption, secondaryOptions: SecondaryOptions): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: primary,
			},
			{
				optional: true,
				actual: secondaryOptions,
				possible: {
					ignore: [`empty-lines`],
				},
			},
		)

		if (!validOptions) return

		let ignoreEmptyLines = optionsMatches(secondaryOptions, `ignore`, `empty-lines`)
		// Read as the neighbors taking stray semicolons out leave it, so that the verdict is one whichever side of them this rule is listed
		let text = (root.source && root.source.input.css) || ``
		let rootString = maskTaken(text, new Set([...straySemicolonOffsetsTaken(root, result), ...semicolonsTakenAlready(root, text, result)]))
		// Stylelint drops the fix of a warning on a line a disable comment covers, and the fix of any other trims every line at once, so it asks of each line itself
		let kept = fixDisabledRanges(result, ruleName).length > 0 ? (line: number): boolean => fixDisabledOnLine(result, ruleName, line) : undefined
		let scope: EolScope = { syntax, root, result, ignoreEmptyLines, sourceEndsWithoutBreak: !TRAILING_LINE_BREAK.test(text), kept }
		let found: EolRun[] = []

		eachEolWhitespace(scope, rootString, (run) => {
			found.push(run)
		}, { isRootFirst: true, endsALine: true })

		// The fix reads its runs against the ones the check finds, where a disable comment keeps some line
		if (kept) scope.found = { offsets: found.map(({ index }) => index), lines: found.map(({ index }) => lineInFile(root, index)) }
		let isFixed = false

		/**
		 * Reports trailing whitespace at an index.
		 * @param index - The offset in the root's source where the whitespace starts.
		 */
		function reportFromIndex (index: number): void {
			report({
				message: messages.rejected,
				node: root,
				index,
				endIndex: index,
				result,
				ruleName,
				fix: () => {
					// Every warning hands the fix over, and it trims every line at once; a second pass would read the lines the first wrote
					if (isFixed) return

					isFixed = true
					fixRoot(scope)
				},
			})
		}

		for (let { index } of found) reportFromIndex(index)
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
