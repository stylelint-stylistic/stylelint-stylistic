import type { AtRule, Container, Declaration, Node } from "postcss"
import type { PostcssResult } from "stylelint"

import { COLON_AND_WHITESPACE, EVERY_LINE_BREAK, TRAILING_CSS_WHITESPACE, TRAILING_SPACES_AND_TABS } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { applyEditsFromEnd, type Edit } from "../applyEditsFromEnd/index.ts"
import { blockString } from "../blockString/index.ts"
import { declarationValueSpelled } from "../declarationValueAsSpelled/index.ts"
import { fixDisabledOnLine } from "../fixDisabledOnLine/index.ts"
import { isSingleLineString } from "../isSingleLineString/index.ts"
import { neighborCopies, type NeighborCopy, type NeighborRuleSetting } from "../neighborSettings/index.ts"
import { optionsMatches } from "../optionsMatches/index.ts"
import { isAtRule, isComment, isDeclaration, isRule } from "../typeGuards/index.ts"

/** What a rule asks of the run in front of a delimiter opening a node's text: a break, one space, nothing; or, at the stylesheet's head, no empty line and no indentation. */
export type EdgeRun = `newline` | `space` | `none` | `noEmptyLine` | `noIndentation`

/** What a delimiter's rule writes there. */
export type EdgeWrite = `newline` | `space` | `none`

/** A delimiter's rule's whole fix over the node's text: what it writes in the raw in front of the text, and what it writes in the text the node's own rule reads, in front of the rule's other delimiters. */
export type EdgeFix = {

	/** What the rule writes in the raw in front of the text, where the delimiter stands. A declaration's value is spelled by the run behind its colon, which no owner reads in place, so only a rule fixing in front of a delimiter names a write there. */
	written: EdgeWrite,

	/** What the rule writes in the text the node's own rule reads, indexed in that text: the writes it is given over its other delimiters, where its own guards accept them and Stylelint will apply them. */
	edits: Edit[],
}

/** The break a neighbor asking one leaves in front of the text, as the checks read it. */
const LINE_FEED = `\n`

/** Every option a whitespace rule takes. */
const EVERY_OPTION = [`always`, `never`, `always-single-line`, `never-single-line`, `always-multi-line`, `never-multi-line`]

/** A neighbor writing the raw in front of a node's text: the rule, what it writes, whether the text whose lineness its option asks stands on one line as the delimiter's rule's fix leaves it, whether a secondary option passes the node over, and the line it reports on. */
type Owner = {
	rule: NeighborRuleSetting,
	writes: `newline` | `space` | `head`,
	singleLine?: (node: Node, syntax: Syntax, result: PostcssResult, fix: EdgeFix | undefined) => boolean,
	ignores?: (node: Node, secondary: Record<string, unknown>) => boolean,
	line: (node: Node) => number | undefined,
}

/**
 * Names a whitespace rule writing the raw, under any option.
 * @param name - The rule's name.
 * @param writes - What it writes.
 * @param rest - Its lineness, secondary options and line.
 * @returns The owner.
 */
function owner (name: string, writes: `newline` | `space`, rest: Omit<Owner, `rule` | `writes`>): Owner {
	return { rule: { name, options: EVERY_OPTION }, writes, ...rest }
}

/**
 * Reads the text whose lineness a block asks.
 * @param container - The block.
 * @param result - The Stylelint result.
 * @returns The text.
 */
function linesOfBlock (container: Node | undefined, result: PostcssResult): string {
	return container && `nodes` in container ? blockString(container as Container, result) : ``
}

/**
 * Reads the text a node's own rule reads out of it: the parsed copy of a rule's selector, and, as a guard for a node the block owners never see, what the syntax reads of anything else.
 * @param node - The node.
 * @param syntax - The syntax, which opens the selector.
 * @returns The text.
 */
function ownTextOf (node: Node, syntax: Syntax): string {
	return isRule(node) ? syntax.selectorCopies(node).selector : syntax.read(node as AtRule | Declaration)
}

/**
 * Counts the breaks of a text, {@link EVERY_LINE_BREAK} being the break {@link isSingleLineString} reads.
 * @param text - The text.
 * @returns The count.
 */
function breaksOf (text: string): number {
	return (text.match(EVERY_LINE_BREAK) ?? []).length
}

/** What an edge write leaves in the raw in front of a node's text, as `isSingleLineAfter` reads it. */
const SPELLED: Record<EdgeWrite, string> = { newline: LINE_FEED, space: ` `, none: `` }

/**
 * Asks whether a block holding a node stands on one line, as the delimiter's rule's fix leaves it. The node's own text is a span of the block and the run in front of the node another, so what the fix writes in either is counted out of the block and counted back in; the rest of the block stands as it is. Counting rather than moving an index into the block is what keeps the block's own spelling of the text — which under `postcss-scss` is the file's copy of the selector — from having to be the one the fix's edits are indexed in.
 *
 * A block holding no break outside those two spans is read as the node's own text however many breaks it holds, which covers the copies disagreeing about what is inside it.
 * @param container - The block the node stands in.
 * @param node - The node in it.
 * @param syntax - The syntax, which reads the node's own text.
 * @param result - The Stylelint result.
 * @param fix - The delimiter's rule's fix, where there is one.
 * @returns True where the block stands on one line.
 */
function blockSingleLine (container: Node | undefined, node: Node, syntax: Syntax, result: PostcssResult, fix: EdgeFix | undefined): boolean {
	let text = linesOfBlock(container, result)
	let run = runOf(node)

	if (!fix) return isSingleLineString(text)

	let own = ownTextOf(node, syntax)
	let beside = Math.max(0, breaksOf(text) - breaksOf(run) - breaksOf(own)) + breaksOf(SPELLED[fix.written]) + breaksOf(applyEditsFromEnd(own, fix.edits))

	return beside === 0
}

/**
 * Reads an at-rule's head, whose lineness the rules behind its name ask: the name, the run behind it and the parameters, as the delimiter's rule's fix leaves the parameters.
 * @param node - The at-rule.
 * @param syntax - The syntax, which reads the parameters.
 * @param fix - The delimiter's rule's fix, where there is one.
 * @returns The head.
 */
function atRuleHead (node: Node, syntax: Syntax, fix: EdgeFix | undefined): string {
	let atRule = node as AtRule
	let params = syntax.read(atRule)

	return `@${atRule.name}${atRule.raws.afterName ?? ``}${fix ? applyEditsFromEnd(params, fix.edits) : params}`
}

/**
 * Asks whether a text is on one line once the write a delimiter's rule makes at the edge replaces the run it holds there: the breaks of the run go, and a break written comes in.
 * @param text - The text.
 * @param run - The run it holds, empty where it holds none.
 * @param fix - What the rule writes there, if a fix is asked about.
 * @returns True where it is.
 */
function isSingleLineAfter (text: string, run: string, fix?: EdgeFix): boolean {
	if (!fix || (!run && fix.written !== `newline`)) return isSingleLineString(text)

	if (fix.written === `newline`) return false

	return isSingleLineString(text.replace(run, ` `))
}

/** The rules behind an at-rule's name, asking the lineness of its head. */
const BEHIND_THE_NAME: Owner[] = [
	owner(`at-rule-name-newline-after`, `newline`, { singleLine: (node, syntax, _result, fix) => isSingleLineAfter(atRuleHead(node, syntax, fix), runOf(node), fix), line: (node) => node.source?.start?.line }),
	owner(`at-rule-name-space-after`, `space`, { singleLine: (node, syntax, _result, fix) => isSingleLineAfter(atRuleHead(node, syntax, fix), runOf(node), fix), line: (node) => node.source?.start?.line }),
]

/**
 * Asks whether a declaration's value stands on one line, as the delimiter's rule's fix leaves it: the value as the file spells it, with the run behind the colon up to it, the rule's own writes applied to the value where they are indexed in it.
 * @param node - The declaration.
 * @param syntax - The syntax, which reads the value.
 * @param result - The Stylelint result.
 * @param fix - The delimiter's rule's fix, where there is one.
 * @returns True where the value stands on one line.
 */
function declarationValueSingleLine (node: Node, syntax: Syntax, result: PostcssResult, fix: EdgeFix | undefined): boolean {
	let { head, value } = declarationValueSpelled(syntax, node as Declaration, result)

	return isSingleLineString(head + (fix ? applyEditsFromEnd(value, fix.edits) : value))
}

/** The rules behind a declaration's colon, asking the lineness of the value; the space rule writes the run the colon opens, the break rule the run in front of the value. */
const BEHIND_THE_COLON: Owner[] = [
	owner(`declaration-colon-newline-after`, `newline`, { singleLine: declarationValueSingleLine, line: (node) => node.source?.start?.line }),
	owner(`declaration-colon-space-after`, `space`, { singleLine: declarationValueSingleLine, line: (node) => node.source?.start?.line }),
]

/**
 * Asks whether the block in front of a node is an at-rule the rules behind a closing brace pass over.
 * @param node - The node.
 * @param secondary - The neighbor's secondary options.
 * @returns True where it is.
 */
function ignoresTheAtRuleInFront (node: Node, secondary: Record<string, unknown>): boolean {
	let prev = node.prev()

	return Boolean(prev && isAtRule(prev) && optionsMatches(secondary, `ignoreAtRules`, prev.name))
}

/** The rules behind a closing brace, asking the lineness of the block closed, which pass over the at-rules named. That block is the one before the node, so it holds none of the node's own text and the delimiter's rule writes nothing into it. */
const BEHIND_A_BRACE: Owner[] = [
	owner(`block-closing-brace-newline-after`, `newline`, { singleLine: (node, _syntax, result) => isSingleLineString(linesOfBlock(node.prev(), result)), ignores: ignoresTheAtRuleInFront, line: (node) => node.prev()?.source?.end?.line }),
	owner(`block-closing-brace-space-after`, `space`, { singleLine: (node, _syntax, result) => isSingleLineString(linesOfBlock(node.prev(), result)), ignores: ignoresTheAtRuleInFront, line: (node) => node.prev()?.source?.end?.line }),
]

/** The rules behind an opening brace, asking the lineness of the block opened; the break rule may pass over rules, the space rule at-rules. */
const BEHIND_AN_OPENING_BRACE: Owner[] = [
	owner(`block-opening-brace-newline-after`, `newline`, { singleLine: (node, syntax, result, fix) => blockSingleLine(node.parent, node, syntax, result, fix), ignores: (node, secondary) => node.parent?.type === `rule` && optionsMatches(secondary, `ignore`, `rules`), line: (node) => node.parent?.source?.start?.line }),
	owner(`block-opening-brace-space-after`, `space`, { singleLine: (node, syntax, result, fix) => blockSingleLine(node.parent, node, syntax, result, fix), ignores: (node, secondary) => node.parent?.type === `atrule` && optionsMatches(secondary, `ignore`, `at-rules`), line: (node) => node.parent?.source?.start?.line }),
]

/** The rules behind a declaration's semicolon, asking the lineness of the block it stands in. */
const BEHIND_A_DECLARATION: Owner[] = [
	owner(`declaration-block-semicolon-newline-after`, `newline`, { singleLine: (node, syntax, result, fix) => blockSingleLine(node.parent, node, syntax, result, fix), line: (node) => node.prev()?.source?.end?.line }),
	owner(`declaration-block-semicolon-space-after`, `space`, { singleLine: (node, syntax, result, fix) => blockSingleLine(node.parent, node, syntax, result, fix), line: (node) => node.prev()?.source?.end?.line }),
]

/** The rule behind a bodiless at-rule's semicolon. */
const BEHIND_AN_AT_RULE: Owner[] = [owner(`at-rule-semicolon-newline-after`, `newline`, { line: (node) => node.prev()?.source?.end?.line })]

/** The rules at the stylesheet's head: the one taking the empty lines it opens with, the one counting empty lines, and the one indenting its first line. */
const AT_THE_HEAD: Owner[] = [
	{ rule: { name: `no-empty-first-line`, options: [true] }, writes: `head`, line: () => 1 },
	// Only a count of none allows no empty first line
	{ rule: { name: `max-empty-lines`, options: [`0`] }, writes: `head`, line: () => 1 },
	{ rule: { name: `indentation`, options: [`tab`, ...Array.from({ length: 100 }, (_, spaces) => String(spaces))] }, writes: `head`, line: () => 1 },
]

/**
 * Names the rules writing the raw in front of a node's text, where a delimiter opening that text has its run: behind an at-rule's name or a declaration's colon, and in front of a rule behind a closing brace, an opening brace, a declaration's or a bodiless at-rule's semicolon, or at the stylesheet's head. Behind a comment no rule writes it.
 * @param node - The node whose text it is.
 * @returns The rules.
 */
function ownersOf (node: Node): Owner[] {
	let head = String(node.raws[rawKey(node)] ?? ``).replace(TRAILING_CSS_WHITESPACE, ``)

	// Behind a comment in the raw the run is its tail's, which the rules writing the run the name or the colon opens do not reach; the colon's break rule writes the run in front of the value wherever it stands
	if (isAtRule(node)) return head.trim() === `` ? BEHIND_THE_NAME : []

	if (isDeclaration(node)) return head.replace(COLON_AND_WHITESPACE, ``) === `` ? BEHIND_THE_COLON : BEHIND_THE_COLON.filter(({ writes }) => writes === `newline`)

	let prev = node.prev()

	if (!prev) return node.parent?.type === `root` ? AT_THE_HEAD : BEHIND_AN_OPENING_BRACE

	if (isComment(prev)) return []

	if (`nodes` in prev && (prev as Container).nodes) return BEHIND_A_BRACE

	return isDeclaration(prev) ? BEHIND_A_DECLARATION : BEHIND_AN_AT_RULE
}

/**
 * Reads what one copy of a neighbor asks of the run, where it speaks of it: a break or a space under `always`, nothing under `never`, a lineness option only where the text it asks is of that lineness as the delimiter's rule's fix leaves it. At the head: no empty line where `no-empty-first-line` lives or `max-empty-lines` allows none, which the copies listed say, and no indentation where `indentation` lives.
 * @param own - The neighbor.
 * @param copy - Its copy.
 * @param node - The node whose text it is.
 * @param result - The Stylelint result.
 * @param fix - The delimiter's rule's whole fix, where there is one, which the neighbors' lineness is read against.
 * @returns What it asks, or nothing where it passes the run over.
 */
function askedBy (own: Owner, copy: NeighborCopy, node: Node, result: PostcssResult, fix?: EdgeFix): EdgeRun | undefined {
	if (own.writes === `head`) {
		return own.rule.name === `indentation` ? `noIndentation` : `noEmptyLine`
	}

	let option = String(copy.option)

	if ((option.endsWith(`-single-line`) || option.endsWith(`-multi-line`)) && own.singleLine && option.endsWith(`-single-line`) !== own.singleLine(node, copy.syntax, result, fix)) return undefined

	return option.startsWith(`always`) ? own.writes : `none`
}

/**
 * Reads the run in front of a node's text.
 * @param node - The node.
 * @returns The run.
 */
function runOf (node: Node): string {
	return TRAILING_CSS_WHITESPACE.exec(String(node.raws[rawKey(node)] ?? ``))?.[0] ?? ``
}

/**
 * Reads what the live neighbors writing the raw in front of a node's text ask of it: each copy whose fix is on, which no secondary option or disable comment keeps off this node, and whose option speaks of it.
 * @param node - The node whose text it is.
 * @param result - The Stylelint result, which holds the configuration.
 * @param fix - The delimiter's rule's whole fix, where there is one, which the neighbors' lineness is read against.
 * @returns What each asks.
 */
export function edgeRunAsked (node: Node, result: PostcssResult, fix?: EdgeFix): EdgeRun[] {
	let asked: EdgeRun[] = []

	for (let own of ownersOf(node)) {
		let line = own.line(node)

		for (let copy of neighborCopies(node, result, own.rule)) {
			if (copy.fixDisabled || own.ignores?.(node, copy.secondary) || (line !== undefined && fixDisabledOnLine(result, copy.name, line))) continue

			let run = askedBy(own, copy, node, result, fix)

			if (run) asked.push(run)
		}
	}

	return asked
}

/**
 * Asks whether the run a delimiter's rule would write is at odds with what a live neighbor writing that raw asks, so that the delimiter's rule leaves the raw to it, whichever side of it the rule is listed. A neighbor asking the same run is none: both write it. At the head a break opens the file with an empty line, and a space indents its first line.
 * @param node - The node whose text it is.
 * @param result - The Stylelint result, which holds the configuration.
 * @param fix - The delimiter's rule's whole fix: what it writes at the edge, and what it writes in the text the neighbors read the lineness of.
 * @returns True where a neighbor asks otherwise.
 */
export function edgeRunOwned (node: Node, result: PostcssResult, fix: EdgeFix): boolean {
	let { written } = fix

	return edgeRunAsked(node, result, fix).some((asked) => {
		if (asked === `noEmptyLine`) return written === `newline`

		if (asked === `noIndentation`) return written === `space`

		return asked !== written
	})
}

/**
 * Reads what the file holds in front of a node's text as the live neighbors writing its run leave it, where they ask it alike: a break, the indentation standing behind it kept, one space, or nothing. So a delimiter opening the text is judged alike in front of their write and behind it, whichever side of them its rule is listed; where they ask nothing or ask it otherwise, the raw is read as it stands.
 * @param node - The node whose text it is.
 * @param raw - What the file holds in front of the text.
 * @param result - The Stylelint result, which holds the configuration.
 * @param fix - The delimiter's rule's whole fix, where there is one, which the neighbors' lineness is read against.
 * @returns What is read in front of the text.
 */
export function textBeforeAsLeft (node: Node, raw: string, result: PostcssResult, fix?: EdgeFix): string {
	let asked = new Set(edgeRunAsked(node, result, fix).filter((spelling) => spelling === `newline` || spelling === `space` || spelling === `none`))
	let [spelling] = asked

	if (asked.size !== 1 || spelling === undefined) return raw

	let run = TRAILING_CSS_WHITESPACE.exec(raw)?.[0] ?? ``
	let left = { newline: `${LINE_FEED}${run.match(TRAILING_SPACES_AND_TABS)?.[0] ?? ``}`, space: ` `, none: `` }[spelling as EdgeWrite]

	return raw.slice(0, raw.length - run.length) + left
}

/**
 * Names the raw in front of a node's text.
 * @param node - The node.
 * @returns `raws.afterName` of an at-rule, `raws.between` of a declaration, `raws.before` of a rule.
 */
function rawKey (node: Node): `afterName` | `before` | `between` {
	if (isAtRule(node)) return `afterName`

	return isDeclaration(node) ? `between` : `before`
}

/**
 * Asks whether the run in front of a node's text is out of a write's reach: the host's code holds it (`raws.codeBefore` of an embedded stylesheet, or an interpolation in `raws.before`), or taking its break would close an inline comment in front of it over the text.
 * @param node - The node whose text it is.
 * @param syntax - The syntax, which reads the comments.
 * @param result - The Stylelint result, which names the syntax the file was parsed with.
 * @param written - What the write leaves.
 * @returns True where the write is refused.
 */
export function edgeRunOutOfReach (node: Node, syntax: Syntax, result: PostcssResult, written: EdgeWrite): boolean {
	let key = rawKey(node)
	let head = String(node.raws[key] ?? ``).replace(TRAILING_CSS_WHITESPACE, ``)
	let { parent } = node
	let codeBefore = key === `before` && parent?.type === `root` && parent.first === node ? String(parent.raws.codeBefore ?? ``) : ``

	// The run reaching into the host's code, which no rule of the stylesheet writes
	if (head === `` && TRAILING_CSS_WHITESPACE.exec(codeBefore)?.[0]) return true

	// Anything but whitespace and stray semicolons in front of a rule is the host's
	if (key === `before` && head.replaceAll(`;`, ``).trim() !== ``) return true

	if (written === `newline`) return false

	let prev = node.prev()

	if (key === `before`) return Boolean(prev && isComment(prev) && !syntax.isStandardComment(prev))

	return syntax.endsWithInlineComment(`${isAtRule(node) ? `@${node.name}` : (node as Declaration).prop}${head}`, syntax.inlineComments(node as AtRule | Declaration, result))
}

/**
 * Writes the run in front of a delimiter opening a node's text, which stands at the end of the raw in front of that text: `raws.afterName` of an at-rule, `raws.between` of a declaration behind its colon, `raws.before` of a rule.
 * @param node - The node whose text it is.
 * @param write - Writes the run.
 */
export function writeEdgeRun (node: Node, write: (run: string) => string): void {
	let key = rawKey(node)
	let raws = node.raws as Record<string, unknown>
	let raw = typeof raws[key] === `string` ? raws[key] as string : ``
	let run = TRAILING_CSS_WHITESPACE.exec(raw)?.[0] ?? ``

	raws[key] = raw.slice(0, raw.length - run.length) + write(run)
}
