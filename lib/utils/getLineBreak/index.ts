import type { Input, Node } from "postcss"
import type { PostcssResult } from "stylelint"

import { CAPTURED_LINE_BREAK } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { addNamespace } from "../addNamespace/index.ts"

/** The one rule about the spelling of a break, under the name its directory spells; a configuration lists it under the namespace of the family that reads the file. */
const LINEBREAKS_RULE = `linebreaks`

/** The break each of that rule's options asks for. */
const BREAK_OF_OPTION = { unix: `\n`, windows: `\r\n` }

/** What each file was found to end its lines with, kept against the input it was read out of, so that a file is scanned once however many fixes ask about it. */
let lineBreaks: WeakMap<Input, string | undefined> = new WeakMap()

/**
 * Reads what a file ends its lines with, off the text the syntax was handed rather than off anything PostCSS prints back.
 *
 * The first break is the answer rather than the commonest one. A file spelling its lines two ways is a file no reading can tell the truth about, and one sentence that always holds beats a count that is right more often; it is also how Stylelint reads the file for `context.newline`, so the two part company only where they must.
 * @param node - A node of the file being asked about.
 * @returns The break the file ends its lines with, or `undefined` where nothing can be read: a file written on one line, and a node standing in no file at all, which is one made by hand.
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
 * The line break a fix writes where it puts a line where none stood.
 *
 * Three answers, in order: the one `linebreaks` asks for, where the configuration lists that rule, since a break another rule writes is a break `linebreaks` would otherwise have to respell — and Stylelint runs each rule once and in the order the configuration spells them, so written the other way it never would (#352); the one the file spells its lines with, where it spells any; and a line feed. Never the line ending of the machine, which `context.newline` falls back on: a stylesheet is written for the file it stands in and not for the machine it happens to be linted on.
 *
 * The setting is read out of `result.stylelint.config`, which holds every rule's normalised settings and is assigned before any rule runs, so the answer is the same wherever a break is written. It is read under the name of the namespace the asking rule is registered under — `@stylistic/scss/linebreaks` for a rule of the scss family — since the configuration of a file lists the core's names and a namespace's alike, and the family that reads the file is the one the rule belongs to; read under the core's name alone, the setting was never found under a namespace, and the break fell back on the file's (#478).
 * @param syntax - The syntax the asking rule is built over, whose namespace names the `linebreaks` rule.
 * @param node - A node of the file the break is written into.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns The break to write.
 */
export function getLineBreak (syntax: Syntax, node: Node, result: PostcssResult): string {
	let setting = result.stylelint?.config?.rules?.[addNamespace(LINEBREAKS_RULE, syntax.namespace)]
	let option = Array.isArray(setting) ? setting[0] : setting

	if (typeof option === `string` && option in BREAK_OF_OPTION) return BREAK_OF_OPTION[(option as keyof typeof BREAK_OF_OPTION)]

	return lineBreakOfFile(node) ?? `\n`
}
