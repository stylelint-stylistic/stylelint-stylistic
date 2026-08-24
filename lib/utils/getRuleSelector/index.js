/**
 * Gets the selector of a rule, spelled as the file spells it.
 *
 * PostCSS keeps every comment of a selector in `raws.selector.raw` and hands back a copy with those comments taken out; `postcss-scss` rewrites every `//` comment of that raw into a block comment, keeps the spelling of the file in `raws.selector.scss` and prints that second copy. The copy that is printed is the one a rule has to read: it is the text the file holds, the text the positions of a warning are counted in, and the only text a fix can reach.
 * @param {import('postcss').Rule} rule - The rule node.
 * @returns {string} The selector, spelled as the file spells it.
 */
export function getRuleSelector (rule) {
	let raws = rule.raws

	if (!raws.selector) return rule.selector

	if (typeof raws.selector.scss === `string`) return raws.selector.scss

	return raws.selector.raw || rule.selector
}
