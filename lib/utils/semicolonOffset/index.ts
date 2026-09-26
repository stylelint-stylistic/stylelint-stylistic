import { EVERY_SEMICOLON } from "../../regexps.ts"

/**
 * Finds a semicolon of a raw in the file as `no-extra-semicolons` places its warning: the semicolon with as many semicolons behind it in the raw as it stands is the one with as many behind it in the file, counted back from the raw's end, which a rule listed earlier leaves in place while its write moves the lines inside the raw. Semicolons the file spells but the raw no longer holds, which a rule listed earlier took out, are passed over where they are handed.
 * @param text - The root's text.
 * @param rawEnd - Where the raw ends in it.
 * @param raw - The raw.
 * @param index - The semicolon's index in the raw.
 * @param passed - The offsets of the semicolons passed over.
 * @returns The offset, or nothing where the file holds too few.
 */
export function semicolonOffset (text: string, rawEnd: number, raw: string, index: number, passed: Set<number> = new Set()): number | undefined {
	let behind = (raw.slice(index + 1).match(EVERY_SEMICOLON) ?? []).length

	for (let offset = text.lastIndexOf(`;`, rawEnd - 1); offset >= 0; offset = text.lastIndexOf(`;`, offset - 1)) {
		if (passed.has(offset)) continue

		if (behind === 0) return offset

		behind -= 1
	}

	return undefined
}
