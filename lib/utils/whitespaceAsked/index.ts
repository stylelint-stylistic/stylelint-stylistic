import type { Node } from "postcss"
import type { PostcssResult } from "stylelint"

import type { Syntax } from "../../syntaxes/index.ts"
import { getLineBreak } from "../getLineBreak/index.ts"
import { type NeighbourRule, neighbourSettings, speaksOf } from "../neighbourSettings/index.ts"

/** A break or a single space. */
export type Whitespace = `newline` | `space`

/**
 * Returns the whitespace the rules about one run ask for, so that a fix spells the run as they would rather than leaving it to a rule already run ([#354](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/354)).
 *
 * The settings come through `neighbourSettings`, under every namespace reading the node's root. Of two speaking rules the later-listed one with its fix on wins, its write being the file's last; a rule whose fix is off wins only where no live one speaks, and the caller still writes its whitespace ([#485](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/485)).
 * @param syntax - The asking rule's, which reads the line break.
 * @param node - Written into; its root names the namespaces read, and it is read for the line break.
 * @param result - Holds the configuration.
 * @param rules - By the whitespace each writes.
 * @param isSingleLine - Whether the counted text is one line, asked only where an option needs it.
 * @param fallback - What to write where no rule speaks.
 * @returns The break `getLineBreak` gives, a space, nothing, or the fallback.
 */
export function whitespaceAsked (syntax: Syntax, node: Node, result: PostcssResult, rules: Partial<Record<Whitespace, NeighbourRule>>, isSingleLine: () => boolean, fallback: string = ``): string {
	let spoke = false
	let asked: Whitespace | undefined
	let askedByTurnedOff: Whitespace | undefined
	let aFixSpeaks = false

	for (let [kind, option, fixTurnedOff] of neighbourSettings(node, result, rules)) {
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
