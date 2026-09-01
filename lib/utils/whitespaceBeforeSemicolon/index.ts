import type { Declaration } from "postcss"
import type { PostcssResult } from "stylelint"

import { TRAILING_WHITESPACE } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { addNamespace } from "../addNamespace/index.ts"
import { blockString } from "../blockString/index.ts"
import { getLineBreak } from "../getLineBreak/index.ts"
import { isSingleLineString } from "../isSingleLineString/index.ts"

/** The two rules about the whitespace in front of a declaration block's semicolons, by the whitespace each of them writes: the name its directory spells, and the primary options it accepts, since a rule handed an option outside them refuses it and runs over nothing. */
const RULE_OF_WHITESPACE = {
	newline: {
		name: `declaration-block-semicolon-newline-before`,
		options: [`always`, `always-multi-line`, `never-multi-line`],
	},
	space: {
		name: `declaration-block-semicolon-space-before`,
		options: [`always`, `never`, `always-single-line`, `never-single-line`],
	},
}

/** The whitespace one of those rules writes. */
type Whitespace = keyof typeof RULE_OF_WHITESPACE

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
 * @param singleLine - Whether the block stands on one line.
 * @returns True where the option speaks of the block.
 */
function speaksOf (option: string, singleLine: boolean): boolean {
	if (option === `always` || option === `never`) return true
	if (option === `always-single-line` || option === `never-single-line`) return singleLine
	if (option === `always-multi-line` || option === `never-multi-line`) return !singleLine

	return false
}

/**
 * The whitespace a fix writes in front of a semicolon it puts behind a declaration, so that the semicolon is written the way the two rules about that whitespace ask for rather than bare, for one of them to respell afterwards.
 *
 * Stylelint runs each rule once and in the order the configuration lists them, so a semicolon written behind `declaration-block-semicolon-newline-before` or `declaration-block-semicolon-space-before` is one those rules never see until the next run of `--fix` (#354). Their settings are read here out of `result.stylelint.config`, which holds every rule's normalised settings and is assigned before any rule runs, under the names of the namespace the asking rule is registered under: the configuration of a file lists the core's names and a namespace's alike, and the family that reads the file is the one the rule belongs to.
 *
 * Where both rules speak of the block, the one the configuration lists later wins — an `always` with its whitespace, a `never` with none: that is the rule that runs last, and over a semicolon the file spelled from the start it rewrites or strips what the other wrote, so the block ends up spelling its semicolons one way either way, a configuration contradicting itself included. The order of the keys is the order of the run, since Stylelint sorts the rules of a run by its own registry, a plugin's rules stand nowhere in it, and the sort is stable.
 *
 * Whether the block stands on one line is asked of it as it stands when the fix is written, which is what the rule itself would read on the run after, and a rule listed ahead may have broken the block already; a rule listed behind still may, and which of the two the `-single-line` and `-multi-line` options speak of is #355's question rather than this one's.
 * @param syntax - The syntax the asking rule is built over, whose namespace names the two rules.
 * @param decl - The declaration the semicolon is written behind.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns The whitespace: the line break `getLineBreak` gives, a single space, or nothing.
 */
export function whitespaceBeforeSemicolon (syntax: Syntax, decl: Declaration, result: PostcssResult): string {
	let { parent } = decl

	if (!parent) throw new Error(`A parent node must be present`)

	let rules: Record<string, unknown> = result.stylelint?.config?.rules ?? {}
	let singleLine: boolean | undefined
	let asked: Whitespace | undefined

	for (let name of Object.keys(rules)) {
		let kind = (Object.keys(RULE_OF_WHITESPACE) as Whitespace[]).find((whitespace) => name === addNamespace(RULE_OF_WHITESPACE[whitespace].name, syntax.namespace))

		if (!kind) continue

		let option = primaryOf(rules[name])

		if (option === undefined || !RULE_OF_WHITESPACE[kind].options.includes(option)) continue

		singleLine ??= isSingleLineString(blockString(parent, result))

		if (!speaksOf(option, singleLine)) continue

		asked = option.startsWith(`always`) ? kind : undefined
	}

	if (asked === `newline`) return getLineBreak(syntax, decl, result)

	return asked === `space` ? ` ` : ``
}

/**
 * Writes the whitespace in front of the semicolon behind a declaration, over whatever whitespace the declaration ends with.
 *
 * The semicolon stands behind `!important`, so wherever the declaration carries the flag, the raw holding it is the text the whitespace goes into, and PostCSS keeps that raw only where the flag is spelled some other way than ` !important`. The raw is kept rather than written anew, so that a comment, and any other layout standing in front of the flag, survives the fix. Everywhere else the whitespace goes onto the end of the value, in the copy of it the syntax prints.
 *
 * The three rules that write a semicolon's whitespace — the two about it and `declaration-block-trailing-semicolon`, which writes the semicolon itself — all write through here, so that what one of them writes is what the others read.
 * @param syntax - The syntax the rule is built over.
 * @param decl - The declaration.
 * @param whitespace - What is to stand in front of the semicolon.
 */
export function writeWhitespaceBeforeSemicolon (syntax: Syntax, decl: Declaration, whitespace: string): void {
	if (decl.important) decl.raws.important = (decl.raws.important || ` !important`).replace(TRAILING_WHITESPACE, whitespace)
	else syntax.write(decl, syntax.read(decl).replace(TRAILING_WHITESPACE, whitespace))
}
