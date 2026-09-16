import type { AtRule, Declaration } from "postcss"
import type { PostcssResult } from "stylelint"

import { CSS_LINE_BREAK, TRAILING_BACKSLASHES, TRAILING_CSS_WHITESPACE } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { blockString } from "../blockString/index.ts"
import { isSingleLineString } from "../isSingleLineString/index.ts"
import type { NeighbourRule } from "../neighbourSettings/index.ts"
import { isAtRule } from "../typeGuards/index.ts"
import { type Whitespace, whitespaceAsked } from "../whitespaceAsked/index.ts"

/** The rules about the whitespace in front of a semicolon, by node type and whitespace. */
const RULES_OF_WHITESPACE: Record<`decl` | `atrule`, Partial<Record<Whitespace, NeighbourRule>>> = {
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
 * The whitespace the rules about it ask for in front of a semicolon a fix adds behind a declaration or bodiless at-rule.
 *
 * Stylelint runs each rule once, so a bare semicolon written behind `declaration-block-semicolon-newline-before` or `-space-before` waits for the next `--fix` ([#354](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/354)), as does one written behind `at-rule-semicolon-space-before` ([#477](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/477)). `whitespaceAsked` picks the later-listed live rule; lineness is asked of the block at the write ([#355](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/355)).
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
		singleLine ??= isSingleLineString(blockString(block, result))

		return singleLine
	}

	return whitespaceAsked(node, result, RULES_OF_WHITESPACE[node.type], isSingleLine)
}

/**
 * The raw a bodiless at-rule ends on: a Less mixin call's flag, where the `less` namespace hands the run behind it ([#374](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/374)), otherwise `raws.between`.
 * @param atRule - The at-rule.
 * @returns The raw.
 */
function atRuleTail (atRule: AtRule): string {
	let flag = atRule.raws.important

	return typeof flag === `string` ? flag : atRule.raws.between ?? ``
}

/**
 * Reads the whitespace in front of a semicolon: the run `writeWhitespaceBeforeSemicolon` writes over, as the tokenizer reads whitespace, since a no-break space or a vertical tab there is a word the value keeps.
 * @param syntax - The syntax reading the value.
 * @param node - The declaration or bodiless at-rule.
 * @returns The run, empty where the node ends in a word.
 */
export function readWhitespaceBeforeSemicolon (syntax: Syntax, node: AtRule | Declaration): string {
	let text = isAtRule(node) ? atRuleTail(node) : textInFrontOfSemicolon(syntax, node)

	return text.slice(text.replace(TRAILING_CSS_WHITESPACE, ``).length)
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
 * Asks whether writing whitespace in front of a node's semicolon keeps the character behind a backslash the node's code ends on.
 *
 * PostCSS lets a backslash cover no whitespace and no solidus, so `red \` ends the value there; the grammar reads one in front of a line break as a delimiter and one in front of anything else as an escape. Whatever a write puts behind that backslash is read with it by one of the two: a semicolon joins the value, and under `never` the file stops parsing where a declaration follows.
 * @param syntax - The syntax reading the value.
 * @param node - The declaration or bodiless at-rule.
 * @param whitespace - The whitespace the write leaves in front of the semicolon.
 * @param behind - What stands behind the run now, a semicolon unless the write adds one.
 * @returns True where the node's code ends on no such backslash or the character behind it stays.
 */
export function keepsEscapedCharacter (syntax: Syntax, node: AtRule | Declaration, whitespace: string, behind = `;`): boolean {
	let text = textInFrontOfSemicolon(syntax, node)
	let code = text.replace(TRAILING_CSS_WHITESPACE, ``)
	let backslashes = code.length - code.replace(TRAILING_BACKSLASHES, ``).length

	return backslashes % 2 === 0 || openAlike(text.slice(code.length) + behind, `${whitespace};`)
}

/**
 * Writes the whitespace in front of a semicolon, over the whitespace the node ends with.
 *
 * With `!important` it goes into `raws.important`, kept by PostCSS only for a spelling other than ` !important` and edited so a comment in front of the flag survives; otherwise onto the end of the value, or into a bodiless at-rule's `raws.between` — a Less mixin call's `raws.important` where it has one, since the `less` namespace hands it the run behind the flag ([#374](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/374)). The two declaration rules and `declaration-block-trailing-semicolon` all write through here.
 * @param syntax - The syntax reading and writing the value.
 * @param node - The declaration or bodiless at-rule.
 * @param whitespace - The whitespace to write.
 */
export function writeWhitespaceBeforeSemicolon (syntax: Syntax, node: AtRule | Declaration, whitespace: string): void {
	if (isAtRule(node) && typeof node.raws.important === `string`) node.raws.important = node.raws.important.replace(TRAILING_CSS_WHITESPACE, whitespace)
	else if (isAtRule(node)) node.raws.between = (node.raws.between ?? ``).replace(TRAILING_CSS_WHITESPACE, whitespace)
	else if (node.important) node.raws.important = (node.raws.important || ` !important`).replace(TRAILING_CSS_WHITESPACE, whitespace)
	else syntax.write(node, syntax.read(node).replace(TRAILING_CSS_WHITESPACE, whitespace))
}
