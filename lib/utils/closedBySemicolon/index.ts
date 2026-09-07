import type { Declaration, Node } from "postcss"
import type { PostcssResult } from "stylelint"

import { TRAILING_CSS_WHITESPACE } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { addNamespace } from "../addNamespace/index.ts"
import { fixDisabledOnLine } from "../fixDisabledOnLine/index.ts"
import { hasBlock } from "../hasBlock/index.ts"
import { isCustomProperty } from "../isCustomProperty/index.ts"
import { isInlineStyleAttribute } from "../isInlineStyleAttribute/index.ts"
import { isLastNodeWithoutSemicolon } from "../isLastNodeWithoutSemicolon/index.ts"
import { lastNonCommentNode } from "../lastNonCommentNode/index.ts"
import { neighbourSetting } from "../neighbourSettings/index.ts"
import { nextNonCommentNode } from "../nextNonCommentNode/index.ts"
import { optionsMatches } from "../optionsMatches/index.ts"
import { isAtRule, isDeclaration, isRoot } from "../typeGuards/index.ts"
import { whitespaceBeforeSemicolon } from "../whitespaceBeforeSemicolon/index.ts"

/** The rule that writes and takes away the semicolon a declaration block ends on, and the primaries it takes. */
const TRAILING_SEMICOLON_RULE = { name: `declaration-block-trailing-semicolon`, options: [`always`, `never`] }

/** The keys a secondary option of any rule may carry, which Stylelint reads for itself and `validateOptions` lets through. */
const STYLELINT_SECONDARY_KEYS = new Set([`severity`, `message`, `reportDisables`, `disableFix`, `url`])

/** The one secondary option the rule declares, with the one value it takes. */
const IGNORE = `single-declaration`

/**
 * Asks whether the rule would take the secondary options it is configured with, the way `validateOptions` asks it: `ignore` holding `single-declaration`, as one or in a list, and nothing else beside what Stylelint reads for itself. A rule handed an option it refuses runs no check and writes nothing, so a reader that took it for live would count in a write that never comes.
 * @param secondary - The secondary options as the configuration spells them.
 * @returns True where the rule runs under them.
 */
function takesSecondary (secondary: Record<string, unknown>): boolean {
	return Object.entries(secondary).every(([key, value]) => {
		if (STYLELINT_SECONDARY_KEYS.has(key)) return true
		if (key !== `ignore`) return false

		return value === IGNORE || (Array.isArray(value) && value.every((item) => item === IGNORE))
	})
}

/**
 * Asks whether the node stands in a declaration block, the trailing semicolon of which is what `declaration-block-trailing-semicolon` is named for. Whether the node is the one closing that block is asked separately, by each walk of that rule and by {@link trailingSemicolonAsked}.
 *
 * A stylesheet is no declaration block. The semicolon behind the last of its own nodes is every bit as optional as a block's — dart-sass compiles a file ending in `$var: pink`, and `lightningcss` parses one ending in `@import "a"` and prints the semicolon back itself — so what leaves it alone here is not the syntax but that rule's own scope: the semicolon it is named for is the one a declaration block ends on, and the top level of a file ends no block. The walk over at-rules has said so since the rule was written, and the walk over declarations says it now too.
 *
 * The root of an inline `style` attribute is the one exception, since the value of such an attribute is a declaration block and nothing else, and `declaration-block-semicolon-*` read such a root the same way. An at-rule is left outside that exception all the same: an attribute holds declarations, so an at-rule the parser puts on such a root is nothing it has a place for, and the semicolon behind it is not the rule's to move.
 *
 * A Sass map is no declaration block either: a container of declarations with no block of its own, so no semicolon closes it and nothing is asked of its last node, comments or none.
 * @param node - The node the semicolon would stand behind.
 * @returns True where the node stands in a declaration block.
 */
export function standsInADeclarationBlock (node: Node): boolean {
	let container = node.parent

	// The two walks throw on a node with no parent before they ask, so this stands for whoever asks next rather than for them
	if (!container || container.type === `object`) return false
	if (!isRoot(container)) return true

	return isDeclaration(node) && isInlineStyleAttribute(container)
}

/**
 * Asks whether the semicolon behind a node is written whatever the block's `raws.semicolon` says.
 *
 * PostCSS writes one behind a childless at-rule and behind a custom property wherever any sibling stands behind that node, and a comment closing the block is such a sibling. Without it the comment would be folded into the at-rule's parameters or into the custom property's value on the next parse and would stop being a node of the block at all. So `never` has nothing it can take away there, and the warning stands over code the fix leaves alone.
 *
 * That is what `pushBody` of PostCSS's stringifier does, and this restates it rather than asking the stringifier itself, which would mean printing the whole block twice for one warning. The at-rule half of it arrived in PostCSS 8.5.21 and the custom property half in 8.5.22, and the copy that prints the file is neither this package's nor Stylelint's but the one the custom syntax resolves, its stringifier being a subclass of that copy's; where an install resolves an older copy than those, the fix is declined on a node it would have got right, which costs a warning its fix and no more.
 * @param node - The node the semicolon stands behind.
 * @returns True where clearing the block's flag would leave the semicolon where it is.
 */
export function semicolonOutlivesTheFlag (node: Node): boolean {
	if (!node.next()) return false

	return (isAtRule(node) && !hasBlock(node)) || (isDeclaration(node) && isCustomProperty(node.prop))
}

/**
 * Asks whether `declaration-block-trailing-semicolon`, configured as the setting says, runs over a declaration and may write there: with its fix on, under secondary options it takes, not silenced over the declaration by a disable comment, over the node closing a declaration block, and not over a block of one declaration where `ignore: single-declaration` says so.
 * @param syntax - The syntax the asking rule is built over.
 * @param decl - The declaration.
 * @param result - The Stylelint result, which holds the configuration and the disabled ranges.
 * @param setting - The rule's setting, as `neighbourSetting` reads it.
 * @returns True where the rule reaches the declaration with its fix.
 */
function reaches (syntax: Syntax, decl: Declaration, result: PostcssResult, setting: { fixDisabled: boolean, secondary: Record<string, unknown> }): boolean {
	if (setting.fixDisabled || !takesSecondary(setting.secondary)) return false

	let { parent } = decl

	if (!parent || !standsInADeclarationBlock(decl) || lastNonCommentNode(parent) !== decl) return false

	let line = decl.source?.end?.line ?? decl.source?.start?.line

	if (line !== undefined && fixDisabledOnLine(result, addNamespace(TRAILING_SEMICOLON_RULE.name, syntax.namespace), line)) return false

	return !(optionsMatches(setting.secondary, `ignore`, `single-declaration`) && nextNonCommentNode(parent.first) === decl)
}

/**
 * Asks what `declaration-block-trailing-semicolon` will leave behind a declaration once it has taken its turn: a semicolon under a live `always`, none under a live `never`.
 *
 * The rule is read the way it reads itself — under the asking rule's namespace, with secondary options it takes, with its fix on and not silenced over the declaration by a disable comment, over the node closing a declaration block, past a block of one declaration where `ignore: single-declaration` says so, and only where its fix can be written: `always` writes behind no node carrying a block and none whose text an inline comment closes, since the semicolon would land inside the comment; `never` takes away no semicolon PostCSS writes whatever the flag says and none the language will not part with. Wherever the rule is not configured, cannot reach the node or cannot write, it leaves the file as it stands, and so does the answer here.
 *
 * A disable comment is asked about by the line the declaration ends on, which is where the rule reports under `always`; under `never` it reports on the semicolon, which stands on that line save where a comment behind the declaration carries it further, and a range opened over the one line and not the other is read here by the declaration's.
 * @param syntax - The syntax the asking rule is built over.
 * @param decl - The declaration.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns True where a semicolon will close the declaration, false where none will, and nothing where the rule leaves that to the file.
 */
export function trailingSemicolonAsked (syntax: Syntax, decl: Declaration, result: PostcssResult): boolean | undefined {
	let setting = neighbourSetting(syntax, result, TRAILING_SEMICOLON_RULE)

	if (!setting || !reaches(syntax, decl, result, setting)) return undefined

	if (setting.option === `always`) return !hasBlock(decl) && !syntax.writesIntoInlineComment(decl, result, whitespaceBeforeSemicolon(syntax, decl, result)) ? true : undefined

	return !semicolonOutlivesTheFlag(decl) && !syntax.requiresTrailingSemicolon(decl, result) ? false : undefined
}

/**
 * Asks whether a semicolon closes a declaration, as the file will stand once `declaration-block-trailing-semicolon` has taken its turn.
 *
 * Whether the whitespace behind a declaration's colon belongs to the declaration or to the block turns on that one character: where the file writes one, the parser keeps the run inside the declaration, and where it writes none, the run goes on into the raw of whatever stands next (#387). That rule moves the boundary while the run is on, and Stylelint runs each rule once in the order the configuration lists them, so a rule reading the run as the file stands at its own turn read it before or after the move by the order alone, and the file the user was left with went with the order (#536). Read as the semicolon rule will leave it, the boundary is the same at every rule's turn, wherever the configuration lists it.
 * @param syntax - The syntax the asking rule is built over.
 * @param decl - The declaration.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns True where a semicolon closes the declaration, or will.
 */
export function closedBySemicolon (syntax: Syntax, decl: Declaration, result: PostcssResult): boolean {
	return trailingSemicolonAsked(syntax, decl, result) ?? !isLastNodeWithoutSemicolon(decl)
}

/**
 * Reads a declaration's printed value as `declaration-block-trailing-semicolon` will leave it.
 *
 * Its `never` takes the whitespace in front of the semicolon away along with the semicolon (#479): the end of the value, where the declaration carries no flag and no inline comment closes its text — the same write `takeTheTrailingSemicolonsAway` makes, and nothing else of the value moves. A reader of the run behind the colon that read the value as it stands would read a run the rule is about to take away, and would write it or report it by the order the configuration lists the two in.
 * @param syntax - The syntax the asking rule is built over.
 * @param decl - The declaration.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns The value in the copy the syntax prints, less the run `never` takes away.
 */
export function valueAsClosed (syntax: Syntax, decl: Declaration, result: PostcssResult): string {
	let value = syntax.read(decl)

	if (decl.important || !decl.parent?.raws.semicolon || trailingSemicolonAsked(syntax, decl, result) !== false || syntax.writesIntoInlineComment(decl, result)) return value

	return value.replace(TRAILING_CSS_WHITESPACE, ``)
}
