import type { Node } from "postcss"
import type { PostcssResult } from "stylelint"

import { getLineBreak } from "../getLineBreak/index.ts"
import { type NeighborRule, neighborSettings, speaksOf } from "../neighborSettings/index.ts"

/** A break or a single space. */
export type Whitespace = `newline` | `space`

/**
 * Returns the whitespace the rules about one run ask for, so that a fix spells the run as they would rather than leaving it to a rule already run.
 *
 * The settings come through `neighborSettings`, under every namespace reading the node's root. Two rules speaking of one run and asking for different whitespace do not load, save the break rule's `always` beside a `-single-line` option of its space twin, which speak together over a single-line construct: the break wins there, since written it makes the construct multi-line and the twin silent, while the space would leave the break rule asking on the next run. A rule whose fix is off answers too, as the caller still writes its whitespace.
 * @param node - Written into; its root names the namespaces read, and it is read for the line break.
 * @param result - Holds the configuration.
 * @param rules - By the whitespace each writes.
 * @param isSingleLine - Whether the counted text is one line, asked only where an option needs it.
 * @param fallback - What to write where no rule speaks.
 * @returns The break `getLineBreak` gives, a space, nothing, or the fallback.
 */
export function whitespaceAsked (node: Node, result: PostcssResult, rules: Partial<Record<Whitespace, NeighborRule>>, isSingleLine: () => boolean, fallback: string = ``): string {
	let speaking = neighborSettings(node, result, rules).filter(([, option]) => speaksOf(option, isSingleLine))

	if (speaking.length === 0) return fallback

	let asking = new Set(speaking.filter(([, option]) => option.startsWith(`always`)).map(([kind]) => kind))

	if (asking.has(`newline`)) return getLineBreak(node, result)

	return asking.has(`space`) ? ` ` : ``
}
