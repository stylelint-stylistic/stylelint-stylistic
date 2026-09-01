import type { AtRule, Declaration } from "postcss"
import type { PostcssResult } from "stylelint"

import { TRAILING_WHITESPACE } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { addNamespace } from "../addNamespace/index.ts"
import { blockString } from "../blockString/index.ts"
import { getLineBreak } from "../getLineBreak/index.ts"
import { isSingleLineString } from "../isSingleLineString/index.ts"
import { isAtRule } from "../typeGuards/index.ts"

/** A rule about the whitespace in front of a semicolon: the name its directory spells, and the primary options it accepts, since a rule handed an option outside them refuses it and runs over nothing. */
type WhitespaceRule = {
	name: string,
	options: string[],
}

/** The rules about the whitespace in front of a semicolon, by the kind of node the semicolon closes and by the whitespace each of them writes. A declaration block's semicolons have two, one for the break and one for the space; an at-rule's has the space alone. */
const RULES_OF_WHITESPACE: Record<`decl` | `atrule`, Partial<Record<Whitespace, WhitespaceRule>>> = {
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

/** The whitespace one of those rules writes. */
type Whitespace = `newline` | `space`

/**
 * Reads the primary option out of a rule's setting: the array a normalised configuration wraps every setting in, which the option opens and the secondary options close, or the option alone as a setting may be handed over before normalisation.
 * @param setting - The setting.
 * @returns The option, where it is a keyword.
 */
function primaryOf (setting: unknown): string | undefined {
	let option = Array.isArray(setting) ? setting[0] : setting

	return typeof option === `string` ? option : undefined
}

/**
 * Asks whether an option of one of those rules speaks of the semicolons of a block at all.
 *
 * `always` and `never` speak of every block; the `-single-line` and `-multi-line` options of a block on one line or over several, the way the rule itself decides it through `lineCheckStr`. An option silent about the block asks for nothing and takes nothing away.
 * @param option - The primary option, where the configuration lists the rule.
 * @param isSingleLine - Whether the block stands on one line, asked only where the option turns on it.
 * @returns True where the option speaks of the block.
 */
function speaksOf (option: string, isSingleLine: () => boolean): boolean {
	if (option === `always` || option === `never`) return true
	if (option === `always-single-line` || option === `never-single-line`) return isSingleLine()
	if (option === `always-multi-line` || option === `never-multi-line`) return !isSingleLine()

	return false
}

/**
 * The whitespace a fix writes in front of a semicolon it puts behind a declaration or a bodiless at-rule, so that the semicolon is written the way the rules about that whitespace ask for rather than bare, for one of them to respell afterwards — or, where the rule has no fixer, to report on every run after and never to put right.
 *
 * Stylelint runs each rule once and in the order the configuration lists them, so a semicolon written behind `declaration-block-semicolon-newline-before` or `declaration-block-semicolon-space-before` is one those rules never see until the next run of `--fix` (#354), and one written behind `at-rule-semicolon-space-before` is one that rule reports on the run after and cannot fix at all (#477). Their settings are read here out of `result.stylelint.config`, which holds every rule's normalised settings and is assigned before any rule runs, under the names of the namespace the asking rule is registered under: the configuration of a file lists the core's names and a namespace's alike, and the family that reads the file is the one the rule belongs to.
 *
 * Where two rules speak of the block, the one the configuration lists later wins — an `always` with its whitespace, a `never` with none: that is the rule that runs last, and over a semicolon the file spelled from the start it rewrites or strips what the other wrote, so the block ends up spelling its semicolons one way either way, a configuration contradicting itself included. The order of the keys is the order of the run, since Stylelint sorts the rules of a run by its own registry, a plugin's rules stand nowhere in it, and the sort is stable.
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
	let rules: Record<string, unknown> = result.stylelint?.config?.rules ?? {}
	let whitespaceRules = Object.entries(RULES_OF_WHITESPACE[node.type]) as [Whitespace, WhitespaceRule][]
	let singleLine: boolean | undefined
	let asked: Whitespace | undefined

	/**
	 * Asks whether the block stands on one line, printing it once however many options turn on the answer.
	 * @returns True where the block stands on one line.
	 */
	function isSingleLine (): boolean {
		singleLine ??= isSingleLineString(blockString(block, result))

		return singleLine
	}

	for (let name of Object.keys(rules)) {
		let found = whitespaceRules.find(([, rule]) => name === addNamespace(rule.name, syntax.namespace))

		if (!found) continue

		let [kind, rule] = found
		let option = primaryOf(rules[name])

		if (option === undefined || !rule.options.includes(option) || !speaksOf(option, isSingleLine)) continue

		asked = option.startsWith(`always`) ? kind : undefined
	}

	if (asked === `newline`) return getLineBreak(syntax, node, result)

	return asked === `space` ? ` ` : ``
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
	if (isAtRule(node)) node.raws.between = (node.raws.between ?? ``).replace(TRAILING_WHITESPACE, whitespace)
	else if (node.important) node.raws.important = (node.raws.important || ` !important`).replace(TRAILING_WHITESPACE, whitespace)
	else syntax.write(node, syntax.read(node).replace(TRAILING_WHITESPACE, whitespace))
}
