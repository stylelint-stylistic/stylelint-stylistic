import type { AtRule, Container, Declaration, Node } from "postcss"
import type { PostcssResult } from "stylelint"

import { COLON_AND_WHITESPACE, TRAILING_CSS_WHITESPACE, TRAILING_SPACES_AND_TABS } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { blockString } from "../blockString/index.ts"
import { declarationValueAsSpelled } from "../declarationValueAsSpelled/index.ts"
import { fixDisabledOnLine } from "../fixDisabledOnLine/index.ts"
import { isSingleLineString } from "../isSingleLineString/index.ts"
import { neighborCopies, type NeighborCopy, type NeighborRuleSetting } from "../neighborSettings/index.ts"
import { optionsMatches } from "../optionsMatches/index.ts"
import { isAtRule, isComment, isDeclaration } from "../typeGuards/index.ts"

/** What a rule asks of the run in front of a delimiter opening a node's text: a break, one space, nothing; or, at the stylesheet's head, no empty line and no indentation. */
export type EdgeRun = `newline` | `space` | `none` | `noEmptyLine` | `noIndentation`

/** What a delimiter's rule writes there. */
export type EdgeWrite = `newline` | `space` | `none`

/** The break a neighbor asking one leaves in front of the text, as the checks read it. */
const LINE_FEED = `\n`

/** Every option a whitespace rule takes. */
const EVERY_OPTION = [`always`, `never`, `always-single-line`, `never-single-line`, `always-multi-line`, `never-multi-line`]

/** A neighbor writing the raw in front of a node's text: the rule, what it writes, the text whose lineness its option asks and whether that text holds the raw, whether a secondary option passes the node over, and the line it reports on. */
type Owner = {
	rule: NeighborRuleSetting,
	writes: `newline` | `space` | `head`,
	lines?: (node: Node, syntax: Syntax, result: PostcssResult) => string,
	linesHoldTheRun?: boolean,
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
 * Reads an at-rule's head, whose lineness the rules behind its name ask: the name, the run behind it and the parameters.
 * @param node - The at-rule.
 * @param syntax - The syntax, which reads the parameters.
 * @returns The head.
 */
function atRuleHead (node: Node, syntax: Syntax): string {
	let atRule = node as AtRule

	return `@${atRule.name}${atRule.raws.afterName ?? ``}${syntax.read(atRule)}`
}

/** The rules behind an at-rule's name, asking the lineness of its head. */
const BEHIND_THE_NAME: Owner[] = [
	owner(`at-rule-name-newline-after`, `newline`, { lines: atRuleHead, linesHoldTheRun: true, line: (node) => node.source?.start?.line }),
	owner(`at-rule-name-space-after`, `space`, { lines: atRuleHead, linesHoldTheRun: true, line: (node) => node.source?.start?.line }),
]

/** The rules behind a declaration's colon, asking the lineness of the value; the space rule writes the run the colon opens, the break rule the run in front of the value. */
const BEHIND_THE_COLON: Owner[] = [
	owner(`declaration-colon-newline-after`, `newline`, { lines: (node, syntax, result) => declarationValueAsSpelled(syntax, node as Declaration, result), line: (node) => node.source?.start?.line }),
	owner(`declaration-colon-space-after`, `space`, { lines: (node, syntax, result) => declarationValueAsSpelled(syntax, node as Declaration, result), line: (node) => node.source?.start?.line }),
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

/** The rules behind a closing brace, asking the lineness of the block closed, which pass over the at-rules named. */
const BEHIND_A_BRACE: Owner[] = [
	owner(`block-closing-brace-newline-after`, `newline`, { lines: (node, _syntax, result) => linesOfBlock(node.prev(), result), ignores: ignoresTheAtRuleInFront, line: (node) => node.prev()?.source?.end?.line }),
	owner(`block-closing-brace-space-after`, `space`, { lines: (node, _syntax, result) => linesOfBlock(node.prev(), result), ignores: ignoresTheAtRuleInFront, line: (node) => node.prev()?.source?.end?.line }),
]

/** The rules behind an opening brace, asking the lineness of the block opened; the break rule may pass over rules, the space rule at-rules. */
const BEHIND_AN_OPENING_BRACE: Owner[] = [
	owner(`block-opening-brace-newline-after`, `newline`, { lines: (node, _syntax, result) => linesOfBlock(node.parent, result), linesHoldTheRun: true, ignores: (node, secondary) => node.parent?.type === `rule` && optionsMatches(secondary, `ignore`, `rules`), line: (node) => node.parent?.source?.start?.line }),
	owner(`block-opening-brace-space-after`, `space`, { lines: (node, _syntax, result) => linesOfBlock(node.parent, result), linesHoldTheRun: true, ignores: (node, secondary) => node.parent?.type === `atrule` && optionsMatches(secondary, `ignore`, `at-rules`), line: (node) => node.parent?.source?.start?.line }),
]

/** The rules behind a declaration's semicolon, asking the lineness of the block it stands in. */
const BEHIND_A_DECLARATION: Owner[] = [
	owner(`declaration-block-semicolon-newline-after`, `newline`, { lines: (node, _syntax, result) => linesOfBlock(node.parent, result), linesHoldTheRun: true, line: (node) => node.prev()?.source?.end?.line }),
	owner(`declaration-block-semicolon-space-after`, `space`, { lines: (node, _syntax, result) => linesOfBlock(node.parent, result), linesHoldTheRun: true, line: (node) => node.prev()?.source?.end?.line }),
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
 * Reads what one copy of a neighbor asks of the run, where it speaks of it: a break or a space under `always`, nothing under `never`, a lineness option only where the text it asks is of that lineness. At the head: no empty line where `no-empty-first-line` lives or `max-empty-lines` allows none, which the copies listed say, and no indentation where `indentation` lives.
 * @param own - The neighbor.
 * @param copy - Its copy.
 * @param node - The node whose text it is.
 * @param result - The Stylelint result.
 * @param written - What the delimiter's rule would write, where the lineness the neighbor asks is read as that write leaves the text holding the run.
 * @returns What it asks, or nothing where it passes the run over.
 */
function askedBy (own: Owner, copy: NeighborCopy, node: Node, result: PostcssResult, written?: EdgeWrite): EdgeRun | undefined {
	if (own.writes === `head`) {
		return own.rule.name === `indentation` ? `noIndentation` : `noEmptyLine`
	}

	let option = String(copy.option)

	if ((option.endsWith(`-single-line`) || option.endsWith(`-multi-line`)) && own.lines && option.endsWith(`-single-line`) !== (own.linesHoldTheRun ? isSingleLineAfter(own.lines(node, copy.syntax, result), runOf(node), written) : isSingleLineString(own.lines(node, copy.syntax, result)))) return undefined

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
 * Asks whether a text is on one line once a write replaces a run it holds: the breaks of the run go, and a break written comes in.
 * @param text - The text.
 * @param run - The run it holds, empty where it holds none.
 * @param written - What the write leaves there, if one is asked about.
 * @returns True where it is.
 */
function isSingleLineAfter (text: string, run: string, written?: EdgeWrite): boolean {
	if (written === undefined || (!run && written !== `newline`)) return isSingleLineString(text)

	if (written === `newline`) return false

	return isSingleLineString(text.replace(run, ` `))
}

/**
 * Reads what the live neighbors writing the raw in front of a node's text ask of it: each copy whose fix is on, which no secondary option or disable comment keeps off this node, and whose option speaks of it.
 * @param node - The node whose text it is.
 * @param result - The Stylelint result, which holds the configuration.
 * @param written - What a delimiter's rule would write there, where the neighbors' lineness is read as it leaves the text.
 * @returns What each asks.
 */
export function edgeRunAsked (node: Node, result: PostcssResult, written?: EdgeWrite): EdgeRun[] {
	let asked: EdgeRun[] = []

	for (let own of ownersOf(node)) {
		let line = own.line(node)

		for (let copy of neighborCopies(node, result, own.rule)) {
			if (copy.fixDisabled || own.ignores?.(node, copy.secondary) || (line !== undefined && fixDisabledOnLine(result, copy.name, line))) continue

			let run = askedBy(own, copy, node, result, written)

			if (run) asked.push(run)
		}
	}

	return asked
}

/**
 * Asks whether the run a delimiter's rule would write is at odds with what a live neighbor writing that raw asks, so that the delimiter's rule leaves the raw to it, whichever side of it the rule is listed. A neighbor asking the same run is none: both write it. At the head a break opens the file with an empty line, and a space indents its first line.
 * @param node - The node whose text it is.
 * @param result - The Stylelint result, which holds the configuration.
 * @param written - What the delimiter's rule writes.
 * @returns True where a neighbor asks otherwise.
 */
export function edgeRunOwned (node: Node, result: PostcssResult, written: EdgeWrite): boolean {
	return edgeRunAsked(node, result, written).some((asked) => {
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
 * @returns What is read in front of the text.
 */
export function textBeforeAsLeft (node: Node, raw: string, result: PostcssResult): string {
	let asked = new Set(edgeRunAsked(node, result).filter((spelling) => spelling === `newline` || spelling === `space` || spelling === `none`))
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
