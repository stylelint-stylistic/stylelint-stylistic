import type { Input, Node } from "postcss"
import type { PostcssResult } from "stylelint"

import { CAPTURED_LINE_BREAK } from "../../regexps.ts"
import { neighbourCopies } from "../neighbourSettings/index.ts"

/** The rule about the spelling of a break and the options it accepts. */
const LINEBREAKS_RULE = { name: `linebreaks`, options: [`unix`, `windows`] }

/** The break each of that rule's options asks for. */
const BREAK_OF_OPTION = { unix: `\n`, windows: `\r\n` }

/** What each file ends its lines with, by input; scanned once. */
let lineBreaks: WeakMap<Input, string | undefined> = new WeakMap()

/**
 * Reads what a file ends its lines with: the first break, as Stylelint does for `context.newline`.
 * @param node - A node of the file.
 * @returns The break; `undefined` for a one-line file or a node made by hand.
 */
function lineBreakOfFile (node: Node): string | undefined {
	let input = node.root().source?.input

	if (!input) return

	if (lineBreaks.has(input)) return lineBreaks.get(input)

	let spelled = input.css.match(CAPTURED_LINE_BREAK)
	let ending = spelled ? spelled[0] : undefined

	lineBreaks.set(input, ending)

	return ending
}

/**
 * The line break a fix writes where none stood.
 *
 * In order: what `linebreaks` asks for where configured, or a break written the other way would never be respelled ([#352](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/352)); the file's; a line feed. Never the machine's, which `context.newline` falls back on. The rule is read under whichever namespace its copy reading the root is configured ([#716](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/716)), one whose fix is off included, as it still reports the other break ([#485](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/485)).
 * @param node - A node of the file.
 * @param result - The result, with the configuration.
 * @returns The break to write.
 */
export function getLineBreak (node: Node, result: PostcssResult): string {
	let option = neighbourCopies(node, result, LINEBREAKS_RULE)[0]?.option

	if (option !== undefined) return BREAK_OF_OPTION[option as keyof typeof BREAK_OF_OPTION]

	return lineBreakOfFile(node) ?? `\n`
}
