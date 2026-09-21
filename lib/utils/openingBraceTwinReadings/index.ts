import { LEADING_CSS_WHITESPACE, LEADING_LINE_BREAK, LINE_BREAK } from "../../regexps.ts"
import { isWhitespace } from "../isWhitespace/index.ts"
import type { Twin, TwinReading } from "../writesTwinRun/index.ts"

/**
 * How `block-opening-brace-newline-after` and `block-opening-brace-space-after` each read and write the run behind the opening brace: the writes are the rules' own, and the readings model their checks for the gate that settles which of the two writes.
 *
 * Both read the characters the run opens with, the break rule its first and the space rule its first two, and both spell the whitespace the run opens with and keep whatever stands behind it: a stray semicolon the parser files in that run is no whitespace, and no write may drop it ([#655](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/655), 1789998855, 1790006582). Over whitespace alone the two spell one run between them; around a semicolon a write is judged by the run it leaves (1790006583).
 * @param lineBreak - Returns the break the file is written with, called only where a break is written.
 * @returns The two readings, by twin.
 */
export function openingBraceTwinReadings (lineBreak: () => string): Record<Twin, TwinReading> {
	return {
		newline: {
			accepts: (option, run) => option.startsWith(`always`) ? LEADING_LINE_BREAK.test(run) : !isWhitespace(run.charAt(0)),
			writes: (option, run) => {
				let kept = run.replace(LEADING_CSS_WHITESPACE, ``)

				if (!option.startsWith(`always`)) return kept

				let opening = run.slice(0, run.length - kept.length)
				let index = opening.search(LINE_BREAK)

				// Trim to the break already there, or add one, as `block-closing-brace-newline-before` spells a run of whitespace alone
				return (index >= 0 ? opening.slice(index) : lineBreak() + opening) + kept
			},
		},
		space: {
			accepts: (option, run) => option.startsWith(`always`) ? run.startsWith(` `) && !isWhitespace(run.charAt(1)) : !isWhitespace(run.charAt(0)),
			writes: (option, run) => (option.startsWith(`always`) ? ` ` : ``) + run.replace(LEADING_CSS_WHITESPACE, ``),
		},
	}
}
