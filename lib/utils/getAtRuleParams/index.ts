import type { AtRule } from "postcss"

/**
 * Gets the params of an at-rule, spelled as the file spells them.
 *
 * `postcss-scss` rewrites every `//` comment of a set of parameters into a block comment inside `raws.params.raw`, keeps the spelling of the file in `raws.params.scss` and prints that second copy. The copy that is printed is the one a rule has to read: it is the text the file holds, the text the positions of a warning are counted in, and the only text a fix can reach.
 * @param atRule - The at-rule node.
 * @returns The params, spelled as the file spells them.
 */
import type { SyntaxRaw } from "../typeGuards/index.ts"

export function getAtRuleParams (atRule: AtRule): string {
	let syntaxRaw: SyntaxRaw | undefined = atRule.raws.params

	if (!syntaxRaw) return atRule.params

	if (typeof syntaxRaw.scss === `string`) return syntaxRaw.scss

	return syntaxRaw.raw || atRule.params
}
