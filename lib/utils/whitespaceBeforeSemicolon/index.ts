import type { AtRule, Declaration } from "postcss"
import type { PostcssResult } from "stylelint"

import { TRAILING_CSS_WHITESPACE } from "../../regexps.ts"
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
 * Stylelint runs each rule once, so a bare semicolon written behind `declaration-block-semicolon-newline-before` or `-space-before` waits for the next `--fix` ([#354](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/354)), and behind `at-rule-semicolon-space-before`, which has no fixer, is reported every run ([#477](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/477)). `whitespaceAsked` picks the later-listed live rule; lineness is asked of the block at the write ([#355](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/355)).
 * @param syntax - The syntax, whose namespace names the rules.
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

	return whitespaceAsked(syntax, node, result, RULES_OF_WHITESPACE[node.type], isSingleLine)
}

/**
 * Writes the whitespace in front of a semicolon, over the whitespace the node ends with.
 *
 * With `!important` it goes into `raws.important`, kept by PostCSS only for a spelling other than ` !important` and edited so a comment in front of the flag survives; otherwise onto the end of the value, or into a bodiless at-rule's `raws.between`. The two declaration rules and `declaration-block-trailing-semicolon` all write through here.
 * @param syntax - The syntax reading and writing the value.
 * @param node - The declaration or bodiless at-rule.
 * @param whitespace - The whitespace to write.
 */
export function writeWhitespaceBeforeSemicolon (syntax: Syntax, node: AtRule | Declaration, whitespace: string): void {
	if (isAtRule(node)) node.raws.between = (node.raws.between ?? ``).replace(TRAILING_CSS_WHITESPACE, whitespace)
	else if (node.important) node.raws.important = (node.raws.important || ` !important`).replace(TRAILING_CSS_WHITESPACE, whitespace)
	else syntax.write(node, syntax.read(node).replace(TRAILING_CSS_WHITESPACE, whitespace))
}
