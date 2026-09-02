import type { Node } from "postcss"
import type { PostcssResult } from "stylelint"

import type { Syntax } from "../../syntaxes/index.ts"
import { getLineBreak } from "../getLineBreak/index.ts"
import { type NeighbourRule, neighbourSettings, speaksOf } from "../neighbourSettings/index.ts"

/** The whitespace a rule about a run writes: a line break, or a single space. A rule asking for neither is a `never`, and asks for nothing at all. */
export type Whitespace = `newline` | `space`

/**
 * Reads what the rules about one run of whitespace ask a writer to put there, so that a fix writing the run spells it the way those rules would rather than bare, for one of them to respell on the run after — or, where the rule has no fixer, to report on every run after and never put right.
 *
 * Stylelint runs each rule once and in the order the configuration lists them, so a run written behind a rule about it is one that rule never sees until the next run of `--fix` (#354). The settings are read through `neighbourSettings`, under the names of the namespace the asking rule is registered under and in the order the run makes them.
 *
 * Where two rules speak of the run, the one the configuration lists later wins — an `always` with its whitespace, a `never` with none: that is the rule that runs last, and over a run the file spelled from the start it rewrites or strips what the other wrote, so the file ends up spelling such runs one way either way, a configuration contradicting itself included. The winner is the last-listed speaking rule whose fix is turned on, since that is the last write the file gets: a speaking rule whose fix the configuration turned off cannot rewrite what a live one leaves, so it wins only where no live one speaks — and there the whitespace it asks for is still written, the write being the caller's own text rather than the turned-off fix (#485).
 * @param syntax - The syntax the asking rule is built over, whose namespace names the rules.
 * @param node - The node the run is written into, which the line break is read for.
 * @param result - The Stylelint result, which holds the configuration.
 * @param rules - The rules about the run, by the whitespace each of them writes.
 * @param isSingleLine - Whether the text those rules count the lines of stands on one line, asked only where an option turns on it.
 * @param fallback - What to write where no rule speaks of the run at all, which is nothing unless the caller says otherwise.
 * @returns The whitespace: the line break `getLineBreak` gives, a single space, nothing, or the fallback.
 */
export function whitespaceAsked (syntax: Syntax, node: Node, result: PostcssResult, rules: Partial<Record<Whitespace, NeighbourRule>>, isSingleLine: () => boolean, fallback: string = ``): string {
	let spoke = false
	let asked: Whitespace | undefined
	let askedByTurnedOff: Whitespace | undefined
	let aFixSpeaks = false

	for (let [kind, option, fixTurnedOff] of neighbourSettings(syntax, result, rules)) {
		if (!speaksOf(option, isSingleLine)) continue

		spoke = true

		if (fixTurnedOff) {
			askedByTurnedOff = option.startsWith(`always`) ? kind : undefined
			continue
		}

		aFixSpeaks = true
		asked = option.startsWith(`always`) ? kind : undefined
	}

	if (!spoke) return fallback
	if (!aFixSpeaks) asked = askedByTurnedOff
	if (asked === `newline`) return getLineBreak(syntax, node, result)

	return asked === `space` ? ` ` : ``
}
