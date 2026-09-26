import { LEADING_ESCAPED_LESS_THAN } from "../../regexps.ts"

/** Where a print parts from the text it prints: at each escape, the text's offset of the escaped character, the print's offset the escape opens at, and how many characters longer it is. */
export type PrintEscape = { from: number, at: number, extra: number }

/**
 * Lines a print up with the text it prints, where they part only where PostCSS's stringifier escapes the `<` opening `<!--`, `<style` or `</style`, printing it three characters longer.
 * @param text - The text.
 * @param printed - The print.
 * @returns The escapes, or nothing where the two part otherwise.
 */
export function printEscapes (text: string, printed: string): PrintEscape[] | undefined {
	let escapes: PrintEscape[] = []
	let at = 0
	let into = 0

	while (at < text.length && into < printed.length) {
		if (text[at] === printed[into]) {
			at += 1
			into += 1

			continue
		}

		let escape = text[at] === `<` ? printed.slice(into).match(LEADING_ESCAPED_LESS_THAN) : null

		if (!escape) return undefined

		escapes.push({ from: at, at: into, extra: escape[0].length - 1 })
		at += 1
		into += escape[0].length
	}

	return at === text.length && into === printed.length ? escapes : undefined
}

/**
 * Counts how many of the escapes, in their order, stand in front of a point.
 * @param escapes - The escapes.
 * @param before - Whether an escape stands in front of the point, which holds for every escape up to some one and for none behind it.
 * @returns The count.
 */
function escapesInFront (escapes: PrintEscape[], before: (escape: PrintEscape) => boolean): number {
	let low = 0
	let high = escapes.length

	while (low < high) {
		let middle = Math.floor((low + high) / 2)

		if (before(escapes[middle] as PrintEscape)) low = middle + 1
		else high = middle
	}

	return low
}

/**
 * Moves the offsets of the semicolons the neighbors take from the text they are counted in into the print the empty lines are counted in, past each escape in front of them; where the two part otherwise they stay where the text puts them, as they did before the print was lined up.
 * @param taken - The offsets in the text.
 * @param escapes - The print's escapes, or nothing where it does not line up with the text.
 * @returns The offsets in the print.
 */
export function takenInPrint (taken: Set<number>, escapes: PrintEscape[] | undefined): Set<number> {
	if (!escapes || escapes.length === 0) return taken

	// Every escape is the same `\\3c `, as long as the next
	let { extra } = escapes[0] as PrintEscape

	return new Set([...taken].map((offset) => offset + (extra * escapesInFront(escapes, (escape) => escape.from < offset))))
}

/**
 * Moves an offset of the print back into the text, where a warning is placed.
 * @param index - The offset in the print.
 * @param escapes - The print's escapes, or nothing where it does not line up with the text.
 * @returns The offset in the text.
 */
export function textIndex (index: number, escapes: PrintEscape[] | undefined): number {
	if (!escapes || escapes.length === 0) return index

	let count = escapesInFront(escapes, (escape) => escape.at < index)
	let last = escapes[count - 1]

	return last ? index - (last.extra * (count - 1)) - Math.min(last.extra, index - last.at) : index
}
