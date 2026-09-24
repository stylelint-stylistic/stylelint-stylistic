import { EVERY_WHITESPACE, LINE_BREAK, TRAILING_WHITESPACE, WHITESPACE } from "../../regexps.ts"

/** The run each of the two rules' fixes leaves over the one given, by the option the rule is under. */
export type RunWrites = Record<`newline` | `space`, (option: string, run: string) => string>

/**
 * Spells the run in front of the closing brace as the `always` options of the break rule ask: whatever stands in front of the run's first break with the whitespace taken out of it, then the run from that break; where the run holds no break, one in front of its first whitespace, or behind a run holding no whitespace either.
 *
 * A stray semicolon standing in front of the break is no whitespace and stays, since no option of the rule speaks of it, and the check cuts it out of the run it measures, so the break behind it opens that run.
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
 * What `block-closing-brace-newline-before` and `block-closing-brace-space-before` each write over the run in front of the closing brace.
 *
 * Over whitespace alone the two spell one run between them. Around a stray semicolon they part: the break rule writes in front of the first break, the space rule the whitespace closing the run, and neither drops the semicolon.
 * @param lineBreak - Returns the break the file is written with, called only where a break is written.
 * @returns The two writes, by rule.
 */
export function closingBraceRunWrites (lineBreak: () => string): RunWrites {
	return {
		newline: (option, run) => option.startsWith(`always`) ? spellTheRun(run, lineBreak()) : run.replaceAll(EVERY_WHITESPACE, ``),
		space: (option, run) => run.replace(TRAILING_WHITESPACE, option.startsWith(`always`) ? ` ` : ``),
	}
}
