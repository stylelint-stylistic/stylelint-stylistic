import { readIdentifierCharacter } from "../readIdentifierCharacter/index.js"

/**
 * Asks whether a name spells `url`, whichever of the spellings CSS gives it the file is written in.
 *
 * The three letters may each be written as an escape wherever the stylesheet likes, and in either case: `\75 rl`, `u\rl`, `\url` and `URL` all name the token that `url` names, and Sass and `lightningcss` read the address of all four. A name spelling those three letters and anything besides is a name of its own — `image-url` and `a\url` open an ordinary call, whose arguments are the author's to rewrite.
 *
 * This is the one reading of that question the plugin holds, and it stands on its own so that every place asking it — the scan that finds the comments of a text, and every rule that places the nodes of a value parse — asks the same one.
 * @param {string} name - The name a call was made by, as the file spells it.
 * @returns {boolean} True where the name spells `url` and nothing besides.
 */
export function namesAnAddress (name) {
	let index = 0

	for (let letter of `url`) {
		let { character, end } = readIdentifierCharacter(name, index)

		if (character?.toLowerCase() !== letter) return false

		index = end
	}

	return index === name.length
}
