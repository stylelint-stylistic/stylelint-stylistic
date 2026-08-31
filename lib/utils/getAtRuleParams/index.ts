import type { AtRule } from "postcss"

/**
 * Gets the params of an at-rule, spelled as the file spells them.
 *
 * PostCSS keeps a set of parameters holding comments in `raws.params.raw` beside the copy it hands back with the comments taken out. The raw is the text the file holds, the text the positions of a warning are counted in, and the only text a fix can reach, so it is the one a rule reads. The copy a preprocessor keeps beside the pair is its own namespace\u2019s to read.
 * @param atRule - The at-rule node.
 * @returns The params, spelled as the file spells them.
 */
import type { SyntaxRaw } from "../typeGuards/index.ts"

export function getAtRuleParams (atRule: AtRule): string {
	let syntaxRaw: SyntaxRaw | undefined = atRule.raws.params

	if (!syntaxRaw) return atRule.params

	return syntaxRaw.raw || atRule.params
}
