import { EVERY_WHITESPACE, LEADING_LINE_BREAK, LINE_BREAK, SEMICOLON_RUN, TRAILING_WHITESPACE, WHITESPACE } from "../../regexps.ts"
import { isWhitespace } from "../isWhitespace/index.ts"
import type { Twin, TwinReading } from "../writesTwinRun/index.ts"

/**
 * Spells the run in front of the closing brace as the `always` options of the break rule ask: whatever stands in front of the run's first break with the whitespace taken out of it, then the run from that break; where the run holds no break, one in front of its first whitespace, or behind a run holding no whitespace either.
 *
 * A stray semicolon standing in front of the break is no whitespace and stays, since no option of the rule speaks of it ([#687](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/687)), and the check cuts it out of the run it measures, so the break behind it opens that run (1789520440).
 * @param raw - The run as it stands.
 * @param lineBreak - The break the file is written with.
 * @returns The run to write.
 */
function spellTheRun (raw: string, lineBreak: string): string {
	let breakIndex = raw.search(LINE_BREAK)

	if (breakIndex >= 0) return raw.slice(0, breakIndex).replaceAll(EVERY_WHITESPACE, ``) + raw.slice(breakIndex)

	let firstWhitespaceIndex = raw.search(WHITESPACE)

	return firstWhitespaceIndex >= 0 ? raw.slice(0, firstWhitespaceIndex) + lineBreak + raw.slice(firstWhitespaceIndex) : raw + lineBreak
}

/**
 * How `block-closing-brace-newline-before` and `block-closing-brace-space-before` each read and write the run in front of the closing brace: the writes are the rules' own, and the readings model their checks for the gate that settles which of the two writes.
 *
 * Over whitespace alone the two spell one run between them. Around a stray semicolon they part: the break rule measures the run with its first run of semicolons cut out and writes in front of the first break, the space rule reads the characters right in front of the brace and writes the whitespace closing the run, so a write of either is judged by the run it leaves (1789979881).
 * @param lineBreak - Returns the break the file is written with, called only where a break is written.
 * @returns The two readings, by twin.
 */
export function closingBraceTwinReadings (lineBreak: () => string): Record<Twin, TwinReading> {
	return {
		newline: {
			accepts: (option, run) => {
				let measured = run.replace(SEMICOLON_RUN, ``)

				return option.startsWith(`always`) ? LEADING_LINE_BREAK.test(measured) : measured === ``
			},
			writes: (option, run) => option.startsWith(`always`) ? spellTheRun(run, lineBreak()) : run.replaceAll(EVERY_WHITESPACE, ``),
		},
		space: {
			accepts: (option, run) => {
				let last = run.at(-1) ?? ``

				if (!option.startsWith(`always`)) return !isWhitespace(last)

				return last === ` ` && !isWhitespace(run.at(-2) ?? ``)
			},
			writes: (option, run) => run.replace(TRAILING_WHITESPACE, option.startsWith(`always`) ? ` ` : ``),
		},
	}
}
