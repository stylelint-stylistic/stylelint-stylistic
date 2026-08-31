import type { Rule } from "postcss"

/**
 * Gets the selector of a rule, spelled as the file spells it.
 *
 * PostCSS keeps every comment of a selector in `raws.selector.raw` and hands back a copy with those comments taken out. The raw is the text the file holds, the text the positions of a warning are counted in, and the only text a fix can reach, so it is the one a rule reads. The copy a preprocessor keeps beside the pair is its own namespace\u2019s to read.
 * @param rule - The rule node.
 * @returns The selector, spelled as the file spells it.
 */
import type { SyntaxRaw } from "../typeGuards/index.ts"

export function getRuleSelector (rule: Rule): string {
	let syntaxRaw: SyntaxRaw | undefined = rule.raws.selector

	if (!syntaxRaw) return rule.selector

	return syntaxRaw.raw || rule.selector
}
