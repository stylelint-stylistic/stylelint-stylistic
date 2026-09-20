import type { Node } from "postcss-value-parser"

import { IDENTIFIER_CODE_POINT, INTERPOLATION_MARK, NAME_CHARACTER_BESIDE_IDENTIFIER } from "../../regexps.ts"
import { namesAnAddress } from "../namesAnAddress/index.ts"
import { readCallName } from "../readCallName/index.ts"
import { readIdentifierCharacter } from "../readIdentifierCharacter/index.ts"

/**
 * Reads the name a `(` opens its parentheses under out of the word the value parser hands back, which holds whatever stands in front of that name with no whitespace between: `1%url` and `[c]url` are one word to it, and a sign, an identifier and an address to `@csstools/css-tokenizer` and to lightningcss. The name is what stands behind the last character that is no identifier code point, {@link NAME_CHARACTER_BESIDE_IDENTIFIER} aside; a character an escape covers ends nothing, since `@csstools/css-tokenizer` reads it as a character of the name and Less and Sass refuse such a text. A closing brace ends the name like any other such character unless it closes an interpolation the word opened itself, with a `{` behind a {@link INTERPOLATION_MARK}, and no brace has ended the name already: `#{$p}url(` and `#{#{p}}url(` name the call dart-sass names there, `@{p}url(` the same thing in the Less spelling, which Less refuses outright, while `1}url(` opens no interpolation and `1}#{$p}url(` is a text dart-sass and Less both refuse, where the tokenizer's url token is the only reading to follow. PostCSS's own tokenizer is not who is asked here: it ends the word on the backslash, and it keeps `1%url` whole, which is the reading the comment scan follows instead.
 * @param name - The word in front of the `(`, as the file spells it.
 * @returns The part of it standing behind the last character that ends a name there.
 */
function readNameInWord (name: string): string {
	let interpolations = 0
	let ended = false
	let previous = ``
	let opening = 0
	let index = 0

	while (index < name.length) {
		let character = name.charAt(index)

		if (character === `\\`) {
			index = readIdentifierCharacter(name, index).end
			previous = ``

			continue
		}

		if (character === `}` && interpolations > 0 && !ended) {
			interpolations -= 1
		}
		else {
			if (character === `{` && INTERPOLATION_MARK.test(previous)) interpolations += 1
			if (character === `}`) ended = true

			if (!IDENTIFIER_CODE_POINT.test(character) && !NAME_CHARACTER_BESIDE_IDENTIFIER.test(character)) opening = index + 1
		}

		previous = character
		index += 1
	}

	return name.slice(opening)
}

/**
 * Asks whether a node of a value parse opens a `url()` in any spelling, since a bare address's commas, units and numbers are its own. The name is read, not matched against `url(`: `u\rl(`, `\75 rl(` and `URL(` count, as Sass and `lightningcss` read them, and `\61 url(`, one call named `aurl` which the parser returns as `url`, does not. Anything but an identifier code point in front of the name ends it ({@link readNameInWord}), which is where the reading parts from the word the value parser hands back: `1%url(`, `1+url(`, `[c]url(` and `1}url(` open an address, `1-url(`, `1#url(` and `#{$p}url(` name a call.
 * @param valueNode - The value parser node asked about.
 * @param index - Its index among its siblings.
 * @param siblings - The nodes of the value the node stands among.
 * @returns True where the node opens an address.
 */
export function opensAnAddress (valueNode: Node, index: number, siblings: Node[]): boolean {
	return valueNode.type === `function` && namesAnAddress(readNameInWord(readCallName(valueNode, index, siblings).name))
}
