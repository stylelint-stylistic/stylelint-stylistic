import { LEADING_CSS_WHITESPACE, LINE_BREAK } from "../../regexps.ts"
import type { RunWrites } from "../closingBraceRunWrites/index.ts"

/**
 * What `block-opening-brace-newline-after` and `block-opening-brace-space-after` each write over the run behind the opening brace: both spell the whitespace the run opens with and keep whatever stands behind it, since a stray semicolon the parser files in that run is no whitespace, and no write may drop it.
 * @param lineBreak - Returns the break the file is written with, called only where a break is written.
 * @returns The two writes, by rule.
 */
export function openingBraceRunWrites (lineBreak: () => string): RunWrites {
	return {
		newline: (option, run) => {
			let kept = run.replace(LEADING_CSS_WHITESPACE, ``)

			if (!option.startsWith(`always`)) return kept

			let opening = run.slice(0, run.length - kept.length)
			let index = opening.search(LINE_BREAK)

			// Trim to the break already there, or add one, as `block-closing-brace-newline-before` spells a run of whitespace alone
			return (index >= 0 ? opening.slice(index) : lineBreak() + opening) + kept
		},
		space: (option, run) => (option.startsWith(`always`) ? ` ` : ``) + run.replace(LEADING_CSS_WHITESPACE, ``),
	}
}
