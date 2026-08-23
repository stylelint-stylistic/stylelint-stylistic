import { endsWithInlineComment } from "../endsWithInlineComment/index.js"
import { getAtRuleParams } from "../getAtRuleParams/index.js"
import { getDeclarationValue } from "../getDeclarationValue/index.js"
import { hasBlock } from "../hasBlock/index.js"
import { readsInlineComments } from "../readsInlineComments/index.js"
import { isAtRule, isComment, isDeclaration } from "../typeGuards/index.js"

/** A character standing in for the one the fix would write, put on the end of a run a caller has spelled out. `endsWithInlineComment` reads the trailing whitespace of a text as room a write is about to go into, and such a run is the opposite of that, so something has to stand behind it; only this character's not being whitespace matters, since it neither opens anything nor closes anything. */
const A_WRITTEN_CHARACTER = `;`

/**
 * Asks whether the syntax has already read a node as a comment opened by a double slash.
 * @param {import('postcss').Node} node - The node to ask about.
 * @returns {boolean} True where it is such a comment.
 */
function isInlineComment (node) {
	return isComment(node) && Boolean(node.inline || node.raws.inline)
}

/**
 * The text a character written right behind a node would follow, spelled as the file spells it.
 *
 * A declaration is asked about its value and the raw of its `!important` together, since the write follows the two of them and either can settle the answer. Where the flag stands on a line of its own, the raw opens with the break that closes a comment the value left open; and where `postcss-less` reads a flag out of the text of a `//` comment — `red // c !important` giving a value of `red // c` and a raw of ` !important` — the raw is more of that comment's text. Neither one alone answers both.
 *
 * An at-rule carrying a block ends with the closing brace of that block, and one carrying none ends with the raw standing where that brace would be, behind its parameters.
 *
 * A comment the syntax has already named an inline one has no text of its own to scan: it runs to the end of its line whatever it holds, so a double slash stands for the whole of it.
 *
 * Everything else — a rule, which ends with a closing brace of its own — ends with a character no comment can be left open behind.
 * @param {import('postcss').Node} node - The node the write would stand behind.
 * @returns {string} That text, empty where the node ends with something no comment can hold.
 */
function textAWriteFollows (node) {
	if (isComment(node)) return isInlineComment(node) ? `//` : ``

	if (isDeclaration(node)) return getDeclarationValue(node) + (node.raws.important || ``)

	if (isAtRule(node)) return hasBlock(node) ? `` : getAtRuleParams(node) + (node.raws.between || ``)

	return ``
}

/**
 * Asks whether a fix writing right behind a node would write inside an inline comment.
 *
 * Such a comment is closed by a line break and by nothing else, so a semicolon, a brace or a space written behind one lands inside its text instead, and the code that character was to close is commented out along with it. Nothing can be written there, whichever character the option asks for, so a caller told as much leaves the node alone and lets the warning stand.
 *
 * The caller says which node the write stands behind, and nothing more: which of that node's texts the question is about is this one's to know, a caller picking one of them by itself being how #211 came about.
 *
 * Where the write lands is the caller's to say, though, and there are two places it can land. A fix writing over the whitespace the node ends with says nothing further, and that whitespace is read as the room the write goes into — which is what it is for the `declaration-block-semicolon-*` rules this was written for. A fix landing anywhere else spells out the run that will stand between the node and the write once it has run, and then none of that run is room, the node's own trailing whitespace included: a break either of them holds closes the comment, since the fix reaches neither. The semicolon standing between a declaration and the whitespace a `never-multi-line` fix takes away is such a run (#248), and so is whatever a closing brace is written behind once a block's final raw has been rewritten (#231).
 * @param {import('postcss').Node} node - The node the write would stand behind.
 * @param {import('stylelint').PostcssResult} result - The Stylelint result, which holds the syntax the file was opened with.
 * @param {string} [spelledBetween] - The run that will stand between the node and the write once the fix has run, where the write does not land on the whitespace the node ends with.
 * @returns {boolean} True where such a write would land inside an inline comment.
 */
export function writesIntoInlineComment (node, result, spelledBetween) {
	let text = textAWriteFollows(node)
	let spellsInlineComments = readsInlineComments(node, result)

	// Nothing was said of where the write lands, so it lands on the whitespace the node ends with, which is how `endsWithInlineComment` reads the trailing whitespace of a text handed over on its own
	if (spelledBetween === undefined) return endsWithInlineComment(text, spellsInlineComments)

	return endsWithInlineComment(`${text}${spelledBetween}${A_WRITTEN_CHARACTER}`, spellsInlineComments)
}
