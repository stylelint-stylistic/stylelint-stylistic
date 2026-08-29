import type { Rule } from "postcss"

/**
 * Gets the selector of a rule, spelled as the file spells it.
 *
 * PostCSS keeps every comment of a selector in `raws.selector.raw` and hands back a copy with those comments taken out; `postcss-scss` rewrites every `//` comment of that raw into a block comment, keeps the spelling of the file in `raws.selector.scss` and prints that second copy. The copy that is printed is the one a rule has to read: it is the text the file holds, the text the positions of a warning are counted in, and the only text a fix can reach.
 * @param rule - The rule node.
 * @returns The selector, spelled as the file spells it.
 */
import type { SyntaxRaw } from "../typeGuards/index.ts"

export function getRuleSelector (rule: Rule): string {
	let syntaxRaw: SyntaxRaw | undefined = rule.raws.selector

	if (!syntaxRaw) return rule.selector

	if (typeof syntaxRaw.scss === `string`) return syntaxRaw.scss

	return syntaxRaw.raw || rule.selector
}
