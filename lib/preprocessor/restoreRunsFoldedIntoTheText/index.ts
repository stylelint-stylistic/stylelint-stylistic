import type { AtRule, ChildNode, Container, Declaration, Root, Rule } from "postcss"

import { HEX_ESCAPE_PAST_SIX_DIGITS, TRAILING_CSS_WHITESPACE, TRAILING_HEX_ESCAPE_PAST_SIX_DIGITS } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { isCustomProperty } from "../../utils/isCustomProperty/index.ts"
import { lastNodeHoldsTheBlockAfter } from "../../utils/lastNodeHoldsTheBlockAfter/index.ts"
import { isDeclaration } from "../../utils/typeGuards/index.ts"

/**
 * Puts the run a hexadecimal escape's seventh digit left in the text back into the raw the file spells it in.
 *
 * PostCSS's tokenizer reads an escape's digits without counting them and swallows one space behind them into the same word, so `\0000311 }` leaves a declaration's value `\0000311 ` with the block's final raw empty, and `a\0000311 { }` a selector `a\0000311 ` with `raws.between` empty. The grammar reads six digits and no more, so the seventh is a name character of its own and the space behind it a run of its own: the file spells it in front of the brace, and every rule reading a raw in front of a brace — and every one writing it — is left looking where there is none.
 *
 * The space behind six digits or fewer closes the escape, a character of it to the grammar and no run, and a text ending on one is passed over. So is a value behind a semicolon of its own, whose run the semicolon rules ask for, one behind a flag, and a custom property's, which PostCSS keeps in the value and the rules read there.
 *
 * `restore` is called once per rule a configuration holds and before every check, so the walk is behind a question over the whole stylesheet: a file holding no such digits walks nowhere.
 * @param root - The stylesheet being restored.
 * @param syntax - The syntax printing it back.
 */
export function restoreRunsFoldedIntoTheText (root: Root, syntax: Syntax): void {
	if (!HEX_ESCAPE_PAST_SIX_DIGITS.test(root.source?.input.css ?? ``)) return

	root.walk((node: ChildNode) => {
		// A Sass nested property is a declaration carrying a block, whose brace opens behind the run its own value holds, not behind a selector
		if (hasBlock(node)) {
			if (!isDeclaration(node)) restoreHead(syntax, node as AtRule | Rule)

			return
		}

		if (isDeclaration(node)) {
			if (node.parent) restoreValue(syntax, node, node.parent)

			return
		}

		if (node.parent) restoreParams(syntax, node as AtRule, node.parent)
	})
}

/**
 * Puts the run in front of a block's closing brace back out of a blockless at-rule's params, into its own `raws.between` where the file spells it.
 *
 * An at-rule that closes its block with neither a block nor a semicolon of its own holds the run, `lastNodeHoldsTheBlockAfter` answers so where the block's final raw stands empty, and `getBlockAfter` and `setBlockAfter` read and write it in the at-rule's `raws.between`. The tokenizer filed it in the params instead, leaving `raws.between` empty, so the reader looks where there is none and the writer writes into the void. Every condition of that answer is asked of the container, which is where `lastNodeHoldsTheBlockAfter` asks it.
 * @param syntax - The syntax printing the at-rule back.
 * @param statement - The blockless at-rule holding the run.
 * @param container - The block the at-rule closes.
 */
function restoreParams (syntax: Syntax, statement: AtRule, container: Container): void {
	if (container.last !== statement || !lastNodeHoldsTheBlockAfter(container)) return

	let text = syntax.read(statement)
	let run = foldedRunAtEnd(text)

	if (run === ``) return

	syntax.write(statement, text.slice(0, text.length - run.length))
	statement.raws.between = `${run}${statement.raws.between ?? ``}`
}

/**
 * Puts the run in front of a statement's opening brace back into its `raws.between`, where the file spells it.
 * @param syntax - The syntax printing the statement back.
 * @param statement - The rule or at-rule carrying the brace.
 */
function restoreHead (syntax: Syntax, statement: AtRule | Rule): void {
	let text = syntax.read(statement)
	let run = foldedRunAtEnd(text)

	if (run === ``) return

	syntax.write(statement, text.slice(0, text.length - run.length))
	statement.raws.between = `${run}${statement.raws.between ?? ``}`
}

/**
 * Puts the run in front of a block's closing brace back into the block's final raw, where the file spells it.
 * @param syntax - The syntax printing the declaration back.
 * @param decl - The block's last declaration.
 * @param container - The block the declaration closes.
 */
function restoreValue (syntax: Syntax, decl: Declaration, container: Container): void {
	if (container.last !== decl || container.raws.semicolon || decl.important || isCustomProperty(decl.prop)) return

	let text = syntax.read(decl)
	let run = foldedRunAtEnd(text)

	if (run === ``) return

	syntax.write(decl, text.slice(0, text.length - run.length))
	container.raws.after = `${run}${container.raws.after ?? ``}`
}

/**
 * Returns the whitespace a text ends in where the hexadecimal escape before it has closed on its six digits, which the grammar reads as a name character of its own and the tokenizer swallows into the escape's word.
 *
 * Whichever whitespace it is, of however many characters: the tokenizer swallows one space and nothing else, and PostCSS hands the last whitespace token of a value back to the block, so a text that reaches here holds that one space and nothing behind it.
 * @param text - The head or the value.
 * @returns The run, empty where the text ends on none or on the closing whitespace of an escape.
 */
function foldedRunAtEnd (text: string): string {
	let run = (text.match(TRAILING_CSS_WHITESPACE) as RegExpMatchArray)[0]

	return run !== `` && TRAILING_HEX_ESCAPE_PAST_SIX_DIGITS.test(text.slice(0, text.length - run.length)) ? run : ``
}
