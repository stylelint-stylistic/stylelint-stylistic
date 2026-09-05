import type { AtRule, Declaration } from "postcss"
import type { PostcssResult } from "stylelint"

import { TRAILING_CSS_WHITESPACE } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { blockString } from "../blockString/index.ts"
import { isSingleLineString } from "../isSingleLineString/index.ts"
import type { NeighbourRule } from "../neighbourSettings/index.ts"
import { isAtRule } from "../typeGuards/index.ts"
import { type Whitespace, whitespaceAsked } from "../whitespaceAsked/index.ts"

/** The rules about the whitespace in front of a semicolon, by the kind of node the semicolon closes and by the whitespace each of them writes. A declaration block's semicolons have two, one for the break and one for the space; an at-rule's has the space alone. */
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
 * The whitespace a fix writes in front of a semicolon it puts behind a declaration or a bodiless at-rule, so that the semicolon is written the way the rules about that whitespace ask for rather than bare, for one of them to respell afterwards — or, where the rule has no fixer, to report on every run after and never to put right.
 *
 * Stylelint runs each rule once and in the order the configuration lists them, so a semicolon written behind `declaration-block-semicolon-newline-before` or `declaration-block-semicolon-space-before` is one those rules never see until the next run of `--fix` (#354), and one written behind `at-rule-semicolon-space-before` is one that rule reports on the run after and cannot fix at all (#477). Their settings are read through `neighbourSettings`, under the names of the namespace the asking rule is registered under and in the order the run makes them.
 *
 * Which of two rules speaking of the block wins is `whitespaceAsked`'s question, and it is answered there the same way for every run a fix writes: the later-listed one whose fix is turned on.
 *
 * Whether the block stands on one line is asked of it as it stands when the fix is written, which is what the rule itself would read on the run after, and a rule listed ahead may have broken the block already; a rule listed behind still may, and which of the two the `-single-line` and `-multi-line` options speak of is #355's question rather than this one's.
 * @param syntax - The syntax the asking rule is built over, whose namespace names the rules and which says whether an at-rule is one the rule about it reads.
 * @param node - The declaration or bodiless at-rule the semicolon is written behind.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns The whitespace: the line break `getLineBreak` gives, a single space, or nothing.
 */
export function whitespaceBeforeSemicolon (syntax: Syntax, node: AtRule | Declaration, result: PostcssResult): string {
	let { parent } = node

	if (!parent) throw new Error(`A parent node must be present`)

	// `at-rule-semicolon-space-before` reads the at-rules of standard CSS alone, so behind one the syntax spells of its own — a Less mixin call or variable, a Sass `@content` — it asks for nothing under either option, and nothing is written there whatever it lists; the two declaration rules read every declaration, so no such question arises on that side
	if (isAtRule(node) && !syntax.isStandardAtRule(node)) return ``

	// Held under a name of its own, since the narrowing above does not reach into the function below
	let block = parent
	let singleLine: boolean | undefined

	/**
	 * Asks whether the block stands on one line, printing it once however many options turn on the answer.
	 * @returns True where the block stands on one line.
	 */
	function isSingleLine (): boolean {
		singleLine ??= isSingleLineString(blockString(block, result))

		return singleLine
	}

	return whitespaceAsked(syntax, node, result, RULES_OF_WHITESPACE[node.type], isSingleLine)
}

/**
 * Writes the whitespace in front of the semicolon behind a declaration or a bodiless at-rule, over whatever whitespace the node ends with.
 *
 * The semicolon of a declaration stands behind `!important`, so wherever the declaration carries the flag, the raw holding it is the text the whitespace goes into, and PostCSS keeps that raw only where the flag is spelled some other way than ` !important`. The raw is kept rather than written anew, so that a comment, and any other layout standing in front of the flag, survives the fix. Everywhere else the whitespace goes onto the end of the value, in the copy of it the syntax prints. The semicolon of a bodiless at-rule stands behind its `raws.between`, the text between its parameters and the semicolon, so that raw is where the whitespace goes.
 *
 * The rules that write a semicolon's whitespace — the two about a declaration's and `declaration-block-trailing-semicolon`, which writes the semicolon itself — all write through here, so that what one of them writes is what the others read; `at-rule-semicolon-space-before` has no fixer, so the whitespace it asks for is written by the trailing-semicolon rule alone.
 * @param syntax - The syntax the rule is built over.
 * @param node - The declaration or bodiless at-rule.
 * @param whitespace - What is to stand in front of the semicolon.
 */
export function writeWhitespaceBeforeSemicolon (syntax: Syntax, node: AtRule | Declaration, whitespace: string): void {
	if (isAtRule(node)) node.raws.between = (node.raws.between ?? ``).replace(TRAILING_CSS_WHITESPACE, whitespace)
	else if (node.important) node.raws.important = (node.raws.important || ` !important`).replace(TRAILING_CSS_WHITESPACE, whitespace)
	else syntax.write(node, syntax.read(node).replace(TRAILING_CSS_WHITESPACE, whitespace))
}
