import { hasBlock } from "../hasBlock/index.js"
import { isLessDetachedRulesetCall } from "../isLessDetachedRulesetCall/index.js"
import { isAtRule } from "../typeGuards/index.js"

/** @type {WeakMap<object, boolean>} The verdict of {@link readsAsLess}, per syntax. */
let lessSyntaxes = new WeakMap()

/** A stylesheet spelling a Less variable declaration, which is one of the things Less reads as something other than an at-rule while every other syntax reads it as one, and the one `postcss-less` marks. It is valid Less, valid Sass and valid CSS alike, so every syntax that reads stylesheets at all reads this one. */
const LESS_PROBE = `a { @v: pink; }`

/**
 * Asks whether a syntax reads a stylesheet as Less, by handing it one and looking at what comes back. Naming the syntaxes that qualify would miss every custom one, and a syntax passed as an object has no name to go by in the first place.
 *
 * `postcss-less` marks the at-rule of the probe `variable`, and nothing else does: `postcss-scss` and PostCSS itself hand back an at-rule named `v:` carrying `pink`. That is the same mark `isStandardSyntaxAtRule` reads Less by, so the plugin knows the language by one property rather than by two readings that can drift apart.
 *
 * Everything else is answered `false`. A host language reads a stylesheet out of a page, a template or a tagged literal and finds none in a bare one, and a syntax that throws says nothing at all — but neither can be Less, since the probe is a stylesheet any syntax that reads stylesheets reads. A host language whose blocks are written in Less says so on each block's own root, which is asked ahead of this.
 * @param {any} syntax - The syntax the stylesheet was parsed with.
 * @returns {boolean} True where that syntax reads a stylesheet as Less.
 */
function readsAsLess (syntax) {
	if (!syntax || typeof syntax.parse !== `function`) return false

	let known = lessSyntaxes.get(syntax)

	if (known !== undefined) return known

	let verdict = false

	try {
		/** @type {import('postcss').Root | import('postcss').Document} */
		let probe = syntax.parse(LESS_PROBE, { from: undefined })

		probe.walkAtRules((atRule) => {
			verdict = Boolean(`variable` in atRule && atRule.variable)

			// The probe spells one at-rule, and the first one it comes back as is the whole of the answer
			return false
		})
	}
	catch {
		// A syntax that cannot parse the probe reads no stylesheet in it, and Less reads this one
	}

	lessSyntaxes.set(syntax, verdict)

	return verdict
}

/**
 * Asks whether Less reads a node `postcss-less` has handed over as an at-rule as an at-rule of its own.
 *
 * That parser files three other things of the language under the same node type, and Less ends none of the three the way it ends an at-rule. Two of them are told by the shape of the node, and those two are what this answers:
 *
 * - a mixin call, which the parser names for the class or the id it calls and marks `mixin` — `.b`, `.b()`, `.b() !important`;
 * - a call to a detached ruleset, which {@link isLessDetachedRulesetCall} tells by the `()` its parameters open on.
 *
 * The third is a variable declaration, `@v: pink`, and it is answered here as the at-rule the parser called it, so the semicolon behind one is left where it stands. Telling it from an at-rule means reading its value the way Less reads it, and Less asks that the whole text behind the colon parse as an expression of its own: its flag parser is `! *important`, in lower case and behind spaces alone, and whatever the expression parser cannot take sends it back to reading a directive that the semicolon closes. So `a { @v: pink !IMPORTANT }`, `a { @v: a:b }`, `a { @v: !x }` and `a { @v: pink !important !important }` are all `@v rule is missing block or ending semi-colon`, and two readings short of that grammar were measured letting some of them through. The grammar is not this plugin's to carry, so the question is not put: the `never` option loses its fix behind a Less variable closing a block, and the warning stands over it, which is what this rule does wherever an option asks for something the syntax has nowhere to put.
 * @param {import('postcss-less').AtRule} atRule - The node to read.
 * @returns {boolean} True where Less reads it as an at-rule.
 */
function isLessAtRule (atRule) {
	if (atRule.mixin) return false

	return !isLessDetachedRulesetCall(atRule)
}

/**
 * Asks whether the syntax refuses to part with the semicolon standing behind a node.
 *
 * The trailing semicolon of a declaration block is optional in CSS and in Sass behind every node a block can end on, which is what the `never` option of `declaration-block-trailing-semicolon` is built on. Less agrees about a declaration carrying a value, and disagrees about every at-rule carrying no block of its own: it reads such an at-rule as running to its semicolon, so `a { @extend .b }` comes back as `@extend rule is missing block or ending semi-colon`, and `a { @whatever x }`, `a { @import "x" }` and `a { @layer l }` come back the same way. Measured against `less@4.9.0`; `sass@1.103.1` compiles all four of those blocks without the semicolon once the target of the `@extend` and the file of the `@import` exist, and `lightningcss@1.33.0` compiles three of them and prints the semicolon back itself, refusing `@layer` inside a style rule whether the semicolon is there or not.
 *
 * Which nodes Less reads as at-rules is {@link isLessAtRule}'s to say, and the two answers together were measured against Less over seventy-four spellings. Every disagreement is one way about: the guard keeps a semicolon Less would have parted with, which costs a warning its fix. None goes the other way, where a file would be left the compiler refuses.
 *
 * A declaration is left alone here, and Less does not part with every one of those semicolons either: a declaration spelling no value is as unreadable to it as an at-rule spelling no block, so `a { color: }` is `Unrecognised input`, as is a custom property whose value is a comment and nothing else. That is a node class of its own, with a reading of its own — a custom property spells a value in `!important` where an ordinary declaration spells none — and it is #358 rather than this.
 *
 * A stylesheet embedded in a page carries the syntax of its own block, and it is that one the question belongs to: the syntax the file was opened with parses the page rather than the style, and one page may hold blocks written in several languages.
 * @param {import('postcss').Node} node - The node the semicolon stands behind.
 * @param {import('stylelint').PostcssResult} result - The Stylelint result, which holds the syntax the file was opened with.
 * @returns {boolean} True where the semicolon behind that node is not the fix's to take away.
 */
export function requiresTrailingSemicolon (node, result) {
	if (!isAtRule(node) || hasBlock(node) || !isLessAtRule(node)) return false

	let root = node.root()
	let syntax = (root.source && /** @type {{ syntax?: any }} */ (root.source).syntax) || (result.opts && result.opts.syntax)

	return readsAsLess(syntax)
}
