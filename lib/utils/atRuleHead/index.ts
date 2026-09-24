import type { AtRule } from "postcss"
import type { PostcssResult } from "stylelint"

import { LEADING_IMPORTANT_FLAG_LINE, TRAILING_CSS_WHITESPACE } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { blankComments } from "../blankComments/index.ts"
import { hasBlock } from "../hasBlock/index.ts"
import { isLastNodeWithoutSemicolon } from "../isLastNodeWithoutSemicolon/index.ts"
import { isRoot } from "../typeGuards/index.ts"

/**
 * Prints an at-rule's head, from its `@` to where the code of its params ends, and the lines it swallowed behind that.
 *
 * PostCSS moves the comments and whitespace behind the params into `raws.between`, but a `//` comment is a word to its tokenizer, so `postcss-less` leaves one standing behind a mixin call or a variable written without a semicolon in the params; measured with them, its line was asked for the params' level, a level deeper than the block it is a line of, which is how Less reads the comment (1788576696). So the head ends where the code does, and what stands behind it opens the swallowed lines. The cut runs over `raws.afterName` as well, since a call written without parentheses, `.m⏎// c`, has the comment for its whole params and the break in front of them; and it is made only where the at-rule carries no block, since in front of an opening brace the comment's line is a line of the params, as it is under every parser filing it into `raws.between`.
 *
 * With neither block nor semicolon an at-rule runs to its block's closing brace, and PostCSS puts everything in between into `raws.between`. Such a line is the block's ([#510](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/510)); the tree is read as it stands, so a neighbour's semicolon moves the comment at once, and the trailing whitespace is the run in front of the brace, `getBlockAfter`'s ([#509](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/509)). Behind a Less mixin call's flag those lines are in `raws.important`, printed behind `raws.between` ([#374](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/374)); the flag's line is blanked, since it is measured behind a semicolon neither. Behind a stylesheet's last at-rule the parser files them into the root's `raws.after`, printed behind both ([#592](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/592)).
 * @param syntax - The rule's syntax, which reads the params and says which of their comments are comments.
 * @param atRule - The at-rule.
 * @param result - The lint result naming the syntax the file was parsed with.
 * @returns The head, and the swallowed lines, which the printed at-rule spells right behind it: empty where it swallowed none.
 */
export function atRuleHead (syntax: Syntax, atRule: AtRule, result: PostcssResult): { head: string, swallowedLines: string } {
	let afterName = atRule.raws.afterName || ``
	let params = syntax.read(atRule)
	let rest = `${afterName}${params}`
	let codeLength = hasBlock(atRule) ? rest.length : blankComments(rest, syntax.printedComments(atRule, params, result).map(({ start, end }) => ({ start: start + afterName.length, end: end + afterName.length }))).replace(TRAILING_CSS_WHITESPACE, ``).length
	let swallowedRaws = !hasBlock(atRule) && isLastNodeWithoutSemicolon(atRule) ? `${atRule.raws.between || ``}${`${atRule.raws.important ?? ``}${atRule.parent && isRoot(atRule.parent) ? atRule.parent.raws.after || `` : ``}`.replace(LEADING_IMPORTANT_FLAG_LINE, (line) => ` `.repeat(line.length))}` : ``

	return {
		head: `@${atRule.name}${rest.slice(0, codeLength)}`,
		swallowedLines: `${rest.slice(codeLength)}${swallowedRaws}`.replace(TRAILING_CSS_WHITESPACE, ``),
	}
}
