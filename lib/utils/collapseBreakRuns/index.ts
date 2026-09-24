import { EVERY_LINE_BREAK, EVERY_RUN_OF_LINE_BREAKS } from "../../regexps.ts"

/**
 * Counts the breaks of a run, a Windows pair and a line feed alike.
 * @param run - A run of breaks.
 * @returns How many breaks it holds.
 */
function countBreaks (run: string): number {
	return run.match(EVERY_LINE_BREAK)?.length ?? 0
}

/**
 * Asks whether a text holds a run of more breaks than allowed, read as PostCSS counts lines: a Windows pair and a line feed are one break each, in whatever order a run spells them.
 * @param blanked - The text with every comment blanked, so a run inside one is read by nobody.
 * @param maxBreaks - The most breaks a run may hold.
 * @returns True where a run holds more.
 */
export function holdsLongerBreakRun (blanked: string, maxBreaks: number): boolean {
	return [...blanked.matchAll(EVERY_RUN_OF_LINE_BREAKS)].some((run) => countBreaks(run[0]) > maxBreaks)
}

/**
 * Cuts every run of breaks the blanked copy holds to its first breaks as the text spells them, in the text: the copy is the text's length with every comment spaced out, so every run found lies outside the comments, where the two agree.
 * @param text - The text as the file spells it.
 * @param blanked - The text with every comment blanked.
 * @param maxBreaks - The most breaks a run may keep.
 * @returns The text written.
 */
export function collapseBreakRuns (text: string, blanked: string, maxBreaks: number): string {
	let pieces = []
	let index = 0

	for (let run of blanked.matchAll(EVERY_RUN_OF_LINE_BREAKS)) {
		pieces.push(text.slice(index, run.index), run[0].match(EVERY_LINE_BREAK)?.slice(0, maxBreaks).join(``) ?? run[0])
		index = run.index + run[0].length
	}

	pieces.push(text.slice(index))

	return pieces.join(``)
}
