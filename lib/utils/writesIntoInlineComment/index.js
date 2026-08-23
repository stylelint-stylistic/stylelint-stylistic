import { endsWithInlineComment } from "../endsWithInlineComment/index.js"
import { getAtRuleParams } from "../getAtRuleParams/index.js"
import { getDeclarationValue } from "../getDeclarationValue/index.js"
import { hasBlock } from "../hasBlock/index.js"
import { readsInlineComments } from "../readsInlineComments/index.js"
import { isAtRule, isComment, isDeclaration } from "../typeGuards/index.js"

/**
 * The text a character written right behind a node would follow, spelled as the file spells it.
 *
 * A declaration is asked about its value and the raw of its `!important` together, since the write follows the two of them and either can settle the answer. Where the flag stands on a line of its own, the raw opens with the break that closes a comment the value left open; and where `postcss-less` reads a flag out of the text of a `//` comment — `red // c !important` giving a value of `red // c` and a raw of ` !important` — the raw is more of that comment's text. Neither one alone answers both.
 *
 * An at-rule carrying a block ends with the closing brace of that block, and one carrying none ends with the raw standing where that brace would be, behind its parameters.
 *
 * Everything else — a rule, which ends with a closing brace of its own — ends with a character no comment can be left open behind. A comment of its own is not among them: it is answered before this is reached, since the syntax has already said what kind it is.
 * @param {import('postcss').Node} node - The node the write would stand behind.
 * @returns {string} That text, empty where the node ends with something no comment can hold.
 */
function textAWriteFollows (node) {
	if (isDeclaration(node)) return getDeclarationValue(node) + (node.raws.important || ``)

	if (isAtRule(node)) return hasBlock(node) ? `` : getAtRuleParams(node) + (node.raws.between || ``)

	return ``
}

/**
 * Asks whether a fix writing right behind a node would write inside an inline comment.
 *
 * Such a comment is closed by a line break and by nothing else, so a semicolon, a brace or a space written behind one lands inside its text instead, and the code that character was to close is commented out along with it. Nothing can be written there, whichever character the option asks for, so a caller told as much leaves the node alone and lets the warning stand.
 *
 * The caller says which node the write stands behind, and nothing more: which of that node's texts the question is about is this one's to know, a caller picking one of them by itself being how #211 came about. What the file already spells between the two is the caller's to say, since only the caller knows where the write lands — a `never-multi-line` fix taking away the whitespace that follows a declaration writes behind the semicolon rather than in front of it (#248).
 *
 * That text is scanned along with the node's own, and it matters most where it holds no break: the scan reads whitespace at the end as room the write is about to take, so a declaration ending in the break that closes its comment reads as still open on its own, and reads as closed with the semicolon that stands behind it handed in. A caller with nothing spelled in between hands in nothing, which is the write standing directly behind the node.
 * @param {import('postcss').Node} node - The node the write would stand behind.
 * @param {import('stylelint').PostcssResult} result - The Stylelint result, which holds the syntax the file was opened with.
 * @param {string} [spelledBetween] - What the file spells between the end of the node and the place the write lands, on the node's own line.
 * @returns {boolean} True where such a write would land inside an inline comment.
 */
export function writesIntoInlineComment (node, result, spelledBetween = ``) {
	// The syntax read this comment as an inline one itself, so there is nothing here to scan: whatever is written behind it is its text, until the line ends. Nothing a caller spells in between changes that, standing as it does on the comment's own line
	if (isComment(node)) return Boolean(node.inline || node.raws.inline)

	return endsWithInlineComment(textAWriteFollows(node) + spelledBetween, readsInlineComments(node, result))
}
