import { readIdentifierCharacter } from "../readIdentifierCharacter/index.ts"

/**
 * Asks whether a name spells `url` in any spelling CSS allows: `\75 rl`, `u\rl` and `URL` do, `image-url` and `a\url` do not. The one reading, shared by the comment scan and the value-parser rules.
 * @param name - The name as the file spells it.
 * @returns True where the name spells `url` alone.
 */
export function namesAnAddress (name: string): boolean {
	let index = 0

	for (let letter of `url`) {
		let { character, end } = readIdentifierCharacter(name, index)

		if (character?.toLowerCase() !== letter) return false

		index = end
	}

	return index === name.length
}
