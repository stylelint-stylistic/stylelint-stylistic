import type { Input, Node } from "postcss"
import type { PostcssResult } from "stylelint"

import { CAPTURED_LINE_BREAK } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { addNamespace } from "../addNamespace/index.ts"

/** The rule about the spelling of a break, under its bare name; configured under a namespace. */
const LINEBREAKS_RULE = `linebreaks`

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
 * In order: what `linebreaks` asks for where configured, or a break written the other way would never be respelled ([#352](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/352)); the file's; a line feed. Never the machine's, which `context.newline` falls back on. The setting is read out of `result.stylelint.config` under the asking rule's namespace; under the core's name alone it was never found ([#478](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/478)).
 * @param syntax - The syntax naming the `linebreaks` rule's namespace.
 * @param node - A node of the file.
 * @param result - The result, with the configuration.
 * @returns The break to write.
 */
export function getLineBreak (syntax: Syntax, node: Node, result: PostcssResult): string {
	let setting = result.stylelint?.config?.rules?.[addNamespace(LINEBREAKS_RULE, syntax.namespace)]
	let option = Array.isArray(setting) ? setting[0] : setting

	if (typeof option === `string` && option in BREAK_OF_OPTION) return BREAK_OF_OPTION[(option as keyof typeof BREAK_OF_OPTION)]

	return lineBreakOfFile(node) ?? `\n`
}
