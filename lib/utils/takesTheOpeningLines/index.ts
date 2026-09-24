import type { Root } from "postcss"
import type { PostcssResult } from "stylelint"

import { OPENS_WITH_LINE_BREAK } from "../../regexps.ts"
import { neighborCopies, type NeighborRuleSetting } from "../neighborSettings/index.ts"
import type { EmbeddedSource } from "../typeGuards/index.ts"

/** The rule that takes the empty lines a file opens with off the raw they stand in. */
const NO_EMPTY_FIRST_LINE: NeighborRuleSetting = {
	name: `no-empty-first-line`,
	options: [true],
}

/**
 * Asks whether `no-empty-first-line` takes the empty lines this file opens with off the raw they stand in, so that a rule writing the same raw leaves that run alone.
 *
 * The run is one both rules read and both take breaks out of. Where the file leaves the root no node the raw is the whole file, so the two of them took one break each where one stood, and which of the two got there first was the configuration's to decide ([#682](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/682)).
 *
 * The question is put to the text handed to the parser, which is the text `no-empty-first-line` reads, so both rules answer it alike wherever either stands in the configuration and however far the tree has been written by then. The guards are that rule's own: an inline `style` attribute's root and a CSS-in-JS object literal are passed over, a file of whitespace alone is accepted, and a copy whose fix is off writes nothing. A styled template's root is passed over by neither guard, since no copy of the rule under a namespace reading such a root is listed here.
 * @param root - The stylesheet.
 * @param result - The PostCSS result carrying the configuration.
 * @returns True where a live copy of the rule takes the run off.
 */
export function takesTheOpeningLines (root: Root, result: PostcssResult): boolean {
	let source: EmbeddedSource | undefined = root.source

	if (source?.inline || source?.lang === `object-literal`) return false

	let text = source?.input.css ?? ``

	if (!text.trim() || !OPENS_WITH_LINE_BREAK.test(text)) return false

	return neighborCopies(root, result, NO_EMPTY_FIRST_LINE).some(({ fixDisabled }) => !fixDisabled)
}
