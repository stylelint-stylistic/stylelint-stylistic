import type { AtRule, Container, Declaration } from "postcss"
import styleSearch from "style-search"
import type { PostcssResult } from "stylelint"

import { CSS_LINE_BREAK, TRAILING_BACKSLASHES, TRAILING_CSS_WHITESPACE } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { blockString } from "../blockString/index.ts"
import { declarationString } from "../declarationString/index.ts"
import { type CommentReading, findEscapeSpans } from "../findCommentSpans/index.ts"
import { fixDisabledOnLine } from "../fixDisabledOnLine/index.ts"
import { functionCommaSpaceChecker } from "../functionCommaSpaceChecker/index.ts"
import { isSingleLineString } from "../isSingleLineString/index.ts"
import { maskEscapes } from "../maskEscapes/index.ts"
import { neighborCopies, type NeighborCopy, type NeighborRule } from "../neighborSettings/index.ts"
import { isAtRule, isDeclaration, isRoot } from "../typeGuards/index.ts"
import { isRegExp, isString } from "../validateTypes/index.ts"
import { type Whitespace, whitespaceAsked } from "../whitespaceAsked/index.ts"

/** The rules about the whitespace in front of a semicolon, by node type and whitespace. */
const RULES_OF_WHITESPACE: Record<`decl` | `atrule`, Partial<Record<Whitespace, NeighborRule>>> = {
	decl: {
		newline: {
			name: `declaration-block-semicolon-newline-before`,
			options: [`always`, `always-multi-line`, `never-multi-line`],
		},
		space: {
			name: `declaration-block-semicolon-space-before`,
			options: [`always`, `never`, `always-single-line`, `never-single-line`],
		},
	},
	atrule: {
		space: {
			name: `at-rule-semicolon-space-before`,
			options: [`always`, `never`],
		},
	},
}

/**
 * Asks whether a declaration holds a comma of a value list, read as `valueListCommaWhitespaceChecker` reads them: over the search copy, a function's arguments skipped, and on the properties the comma rules read at all.
 * @param syntax - The asking rule's syntax.
 * @param decl - The declaration.
 * @param result - The Stylelint result.
 * @returns True where the comma rules have a comma of it to break behind or in front of.
 */
function holdsAListComma (syntax: Syntax, decl: Declaration, result: PostcssResult): boolean {
	if (!syntax.isStandardDeclaration(decl) || !syntax.isStandardProperty(decl.prop)) return false

	let found = false

	styleSearch({ source: syntax.searchCopy(declarationString(syntax, decl), decl, result).searchString, target: `,`, functionArguments: `skip` }, () => {
		found = true
	})

	return found
}

/**
 * Asks whether a block holds a comma of a call that a function comma rule reads, as that rule's checker reads them: its own walk over the block, every comma it would check counted and none reported, under the copy's `ignoreFunctions`. A copy whose `ignoreFunctions` the rule refuses writes nothing, so it breaks nothing.
 * @param block - The declaration block.
 * @param result - The Stylelint result.
 * @param copy - The copy of the comma rule, whose secondary options the checker reads.
 * @param fixPosition - Which side of the comma the copy's rule writes, which decides the edge comma it passes over.
 * @returns True where the copy has a comma of the block to check at.
 */
function holdsACallComma (block: Container, result: PostcssResult, copy: NeighborCopy, fixPosition: `after` | `before`): boolean {
	let { ignoreFunctions } = copy.secondary
	let names = Array.isArray(ignoreFunctions) ? ignoreFunctions : [ignoreFunctions]

	if (ignoreFunctions !== undefined && !names.every((name) => isString(name) || isRegExp(name))) return false

	let found = false

	functionCommaSpaceChecker({
		root: block,
		result,
		syntax: copy.syntax,
		locationChecker: () => {
			found = true
		},
		checkedRuleName: copy.name,
		fixPosition,
		ignoreFunctions: names.filter((name) => isString(name) || isRegExp(name)),
	})

	return found
}

/** The rules whose live `always` breaks a single-line declaration block in the same pass, each with the question of whether it has anything of the block to break: the brace rules any block with braces, which a root standing in for one, an inline `style` attribute's, has not, the colon rule a block holding a standard declaration, the semicolon newline rule a block holding two declarations, so that a semicolon stands between them, the value-list comma rules a block holding a declaration with a comma of its list, the function comma rules a block holding a call with a comma they read. `declaration-block-semicolon-newline-before` is not listed, since its live `always` is the ask itself and outranks the twin in `whitespaceAsked` without any lineness asked; the families writing breaks into a selector or an at-rule's parameters are not listed, since the block's own stand outside its text. */
const BLOCK_BREAKERS: { rule: NeighborRule, breaks: (syntax: Syntax, block: Container, result: PostcssResult, copy: NeighborCopy) => boolean }[] = [
	{ rule: { name: `block-opening-brace-newline-after`, options: [`always`] }, breaks: (syntax, block) => !isRoot(block) },
	{ rule: { name: `block-closing-brace-newline-before`, options: [`always`] }, breaks: (syntax, block) => !isRoot(block) },
	{ rule: { name: `declaration-colon-newline-after`, options: [`always`] }, breaks: (syntax, block) => (block.nodes ?? []).some((node) => isDeclaration(node) && syntax.isStandardDeclaration(node)) },
	{ rule: { name: `declaration-block-semicolon-newline-after`, options: [`always`] }, breaks: (syntax, block) => (block.nodes ?? []).filter((node) => isDeclaration(node)).length > 1 },
	{ rule: { name: `value-list-comma-newline-after`, options: [`always`] }, breaks: (syntax, block, result) => (block.nodes ?? []).some((node) => isDeclaration(node) && holdsAListComma(syntax, node, result)) },
	{ rule: { name: `value-list-comma-newline-before`, options: [`always`] }, breaks: (syntax, block, result) => (block.nodes ?? []).some((node) => isDeclaration(node) && holdsAListComma(syntax, node, result)) },
	{ rule: { name: `function-comma-newline-after`, options: [`always`] }, breaks: (syntax, block, result, copy) => holdsACallComma(block, result, copy, `after`) },
	{ rule: { name: `function-comma-newline-before`, options: [`always`] }, breaks: (syntax, block, result, copy) => holdsACallComma(block, result, copy, `before`) },
]

/**
 * Asks whether a live rule breaks the block in this pass: a `-single-line` option of the semicolon rules is asked at the run's end, when every undeferred rule has written, so the block it judges is the one those rules leave, not the one a semicolon's writer sees at its own turn. The block is on one line when asked, so a disable comment keeping a breaker's fix off that line keeps it off the block.
 * @param syntax - The asking rule's syntax.
 * @param block - The declaration block.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns True where a live `always` of a rule writing breaks into the block is configured with its fix on, not kept off the block's line, and has something of the block to break.
 */
function breaksInThisPass (syntax: Syntax, block: Container, result: PostcssResult): boolean {
	let line = block.source?.start?.line

	return BLOCK_BREAKERS.some(({ rule, breaks }) => neighborCopies(block, result, rule).some((copy) => copy.option === `always` && !copy.fixDisabled && !(line !== undefined && fixDisabledOnLine(result, copy.name, line)) && breaks(syntax, block, result, copy)))
}

/**
 * The whitespace the rules about it ask for in front of a semicolon a fix adds behind a declaration or bodiless at-rule.
 *
 * Stylelint runs each rule once, so a bare semicolon written behind `declaration-block-semicolon-newline-before` or `-space-before` waits for the next `--fix`, as does one written behind `at-rule-semicolon-space-before`. `whitespaceAsked` picks the rule, a break asked for winning over a `-single-line` twin's space; lineness is asked of the block as the rules writing breaks into it leave it, since a `-single-line` twin judges the block at the run's end, behind their writes.
 * @param syntax - The asking rule's syntax.
 * @param node - The declaration or bodiless at-rule.
 * @param result - The Stylelint result.
 * @returns A break, a space, or nothing.
 */
export function whitespaceBeforeSemicolon (syntax: Syntax, node: AtRule | Declaration, result: PostcssResult): string {
	let { parent } = node

	if (!parent) throw new Error(`A parent node must be present`)

	// `at-rule-semicolon-space-before` reads standard at-rules alone
	if (isAtRule(node) && !syntax.isStandardAtRule(node)) return ``

	// The narrowing above does not reach into the closure
	let block = parent
	let singleLine: boolean | undefined

	/**
	 * Whether the block is on one line, printed once.
	 * @returns True when it is.
	 */
	function isSingleLine (): boolean {
		singleLine ??= isSingleLineString(blockString(block, result)) && !breaksInThisPass(syntax, block, result)

		return singleLine
	}

	return whitespaceAsked(node, result, RULES_OF_WHITESPACE[node.type], isSingleLine)
}

/**
 * The raw a bodiless at-rule ends on: a Less mixin call's flag, where the `less` namespace hands the run behind it, otherwise `raws.between`.
 * @param atRule - The at-rule.
 * @returns The raw.
 */
function atRuleTail (atRule: AtRule): string {
	let flag = atRule.raws.important

	return typeof flag === `string` ? flag : atRule.raws.between ?? ``
}

/**
 * Reads the whitespace a text ends on, as the tokenizer reads whitespace, since a no-break space or a vertical tab there is a word the value keeps. The run is measured over the copy with its escapes masked: an escaped space is a character of a word and no run, and the whitespace closing a hexadecimal escape stays a run, since the semicolon closes the escape as well. The reading is the syntax's, as the rules' checks read: in a plain CSS value `//d\ ` is code ending in an escaped space, and a comment to the default reading.
 * @param text - The text.
 * @param reading - What the syntax makes of a `//` comment.
 * @returns The run, empty where the text ends in a word.
 */
function trailingRun (text: string, reading: CommentReading): string {
	let copy = maskEscapes(text, findEscapeSpans(text, reading), true)

	return text.slice(copy.replace(TRAILING_CSS_WHITESPACE, ``).length)
}

/**
 * Reads the whitespace in front of a semicolon: the run `writeWhitespaceBeforeSemicolon` writes over. It is measured over the whole text in front of the semicolon and read out of the raw the node ends on, since PostCSS parts an escape ending a bodiless at-rule's params from the whitespace it covers, `"x"\` and `raws.between` of ` ` for `@import "x"\ ;`.
 * @param syntax - The syntax reading the value.
 * @param node - The declaration or bodiless at-rule.
 * @param result - The Stylelint result.
 * @returns The run, empty where the node ends in a word.
 */
export function readWhitespaceBeforeSemicolon (syntax: Syntax, node: AtRule | Declaration, result: PostcssResult): string {
	let tail = isAtRule(node) ? atRuleTail(node) : textInFrontOfSemicolon(syntax, node)
	let run = trailingRun(textInFrontOfSemicolon(syntax, node), syntax.inlineComments(node, result))

	return tail.slice(Math.max(tail.length - run.length, 0))
}

/**
 * Returns the text a node ends on in front of its semicolon: a declaration's flag or value, a bodiless at-rule's flag or everything from its name on, since `postcss-scss` keeps a backslash ending `@foo\` in the name.
 * @param syntax - The syntax reading the value.
 * @param node - The declaration or bodiless at-rule.
 * @returns The text, its trailing whitespace included.
 */
function textInFrontOfSemicolon (syntax: Syntax, node: AtRule | Declaration): string {
	if (isAtRule(node)) return typeof node.raws.important === `string` ? node.raws.important : `${node.name}${node.raws.afterName ?? ``}${syntax.read(node)}${node.raws.between ?? ``}`

	return node.important ? node.raws.important || ` !important` : syntax.read(node)
}

/**
 * Asks whether two texts open with the same character, a line break of any spelling read as one.
 * @param one - The text behind a backslash as the file spells it.
 * @param other - The same text as the write leaves it.
 * @returns True where they do.
 */
function openAlike (one: string, other: string): boolean {
	let [first, second] = [one.charAt(0), other.charAt(0)]

	return first === second || (CSS_LINE_BREAK.test(first) && CSS_LINE_BREAK.test(second))
}

/**
 * Asks whether a write beside a node's semicolon keeps the character behind a backslash the node's code ends on.
 *
 * PostCSS lets a backslash cover no whitespace and no solidus, so `red \` ends the value there; the grammar reads one in front of a line break as a delimiter and one in front of anything else as an escape. Whatever a write leaves behind that backslash is read with it by one of the two.
 * @param syntax - The syntax reading the value.
 * @param node - The declaration or bodiless at-rule.
 * @param result - The Stylelint result.
 * @param standing - What stands behind the node's run now.
 * @param written - What stands there once the write has been made.
 * @returns True where the node's code ends on no such backslash or the character behind it stays.
 */
function keepsTheEscape (syntax: Syntax, node: AtRule | Declaration, result: PostcssResult, standing: string, written: string): boolean {
	let text = textInFrontOfSemicolon(syntax, node)
	let code = text.slice(0, text.length - trailingRun(text, syntax.inlineComments(node, result)).length)
	let backslashes = code.length - code.replace(TRAILING_BACKSLASHES, ``).length

	return backslashes % 2 === 0 || openAlike(text.slice(code.length) + standing, written)
}

/**
 * Asks whether writing whitespace in front of a node's semicolon keeps the character behind a backslash the node's code ends on: a semicolon written against it joins the value, and under `never` the file stops parsing where a declaration follows.
 * @param syntax - The syntax reading the value.
 * @param node - The declaration or bodiless at-rule.
 * @param result - The Stylelint result.
 * @param whitespace - The whitespace the write leaves in front of the semicolon.
 * @param behind - What stands behind the run now, a semicolon unless the write adds one.
 * @returns True where the node's code ends on no such backslash or the character behind it stays.
 */
export function keepsEscapedCharacter (syntax: Syntax, node: AtRule | Declaration, result: PostcssResult, whitespace: string, behind = `;`): boolean {
	return keepsTheEscape(syntax, node, result, behind, `${whitespace};`)
}

/**
 * Asks whether taking a node's semicolon away, with the run in front of it, keeps the character behind a backslash the node's code ends on: `c\⏎;` would come out as `c\`, and whatever the file holds behind it lands against the backslash, an escaped space where a space stood.
 * @param syntax - The syntax reading the value.
 * @param node - The declaration or bodiless at-rule.
 * @param result - The Stylelint result.
 * @param behind - The text standing behind the node once the semicolons are gone.
 * @returns True where the node's code ends on no such backslash or the character behind it stays.
 */
export function takingTheSemicolonKeepsEscapedCharacter (syntax: Syntax, node: AtRule | Declaration, result: PostcssResult, behind: string): boolean {
	return keepsTheEscape(syntax, node, result, `;`, behind)
}

/**
 * Writes the whitespace in front of a semicolon, over the whitespace the node ends with.
 *
 * With `!important` it goes into `raws.important`, kept by PostCSS only for a spelling other than ` !important` and edited so a comment in front of the flag survives; otherwise onto the end of the value, or into a bodiless at-rule's `raws.between` — a Less mixin call's `raws.important` where it has one, since the `less` namespace hands it the run behind the flag. The two declaration rules, `at-rule-semicolon-space-before`, `declaration-block-trailing-semicolon` and `indentation` all write through here.
 * @param syntax - The syntax reading and writing the value.
 * @param node - The declaration or bodiless at-rule.
 * @param result - The Stylelint result.
 * @param whitespace - The whitespace to write.
 */
export function writeWhitespaceBeforeSemicolon (syntax: Syntax, node: AtRule | Declaration, result: PostcssResult, whitespace: string): void {
	let run = readWhitespaceBeforeSemicolon(syntax, node, result)

	/**
	 * Writes the whitespace over the run a raw ends on.
	 * @param raw - The raw.
	 * @returns The raw with the whitespace in place of its run.
	 */
	function written (raw: string): string {
		return raw.slice(0, raw.length - run.length) + whitespace
	}

	if (isAtRule(node) && typeof node.raws.important === `string`) node.raws.important = written(node.raws.important)
	else if (isAtRule(node)) node.raws.between = written(node.raws.between ?? ``)
	else if (node.important) node.raws.important = written(node.raws.important || ` !important`)
	else syntax.write(node, written(syntax.read(node)))
}
