import { blankComments } from "../blankComments/index.ts"
import { findCommentSpans } from "../findCommentSpans/index.ts"
import { hideFalseInlineComments } from "../hideFalseInlineComments/index.ts"
import { readsInlineComments } from "../readsInlineComments/index.ts"

type CommentSpan = import("../findCommentSpans/index.ts").CommentSpan

/**
 * Builds the copy of a node's text that a scan is handed in place of the text itself, and hands back the comments it was built from.
 *
 * `style-search` reads the comments of the text for itself, and by rules of its own: an inline comment ends on a line feed and on nothing else, a double slash opens one wherever it stands — the one in `url(http://x/y.png)` among them — and the `*\/` closing one block comment and the `/*` opening the next are read as the two slashes of a third. The copy has every comment blanked out of it and every false opening spelled out of harm's way, so that none of the three readings is left to make. It is as long as the text and spells it character for character everywhere else, so every position stands where it did, and the checks that follow are made against the text as it stands.
 *
 * A double slash spells a comment only where the syntax says one, and a file of plain CSS spells none: the pair in `myurl(//a)` is code there, and taking it for a comment would silence everything standing behind it on the line. The scan is told which syntax spelled the text, rather than asked to find the comments and have them taken away afterwards, since what it reads behind such a pair depends on the answer.
 * @param text - The text the search is to run over, a value or a set of parameters.
 * @param node - The node that text was read from.
 * @param result - The Stylelint result, which the syntax of the file is read from.
 * @returns The copy to hand the search, and the spans the comments occupy in the text it was made of.
 */
export function searchCopy (text: string, node: import("postcss").Node, result: import("stylelint").PostcssResult): { searchString: string, commentSpans: CommentSpan[] } {
	let commentSpans = findCommentSpans(text, readsInlineComments(node, result))

	// The masking is handed no spans because the blanking left it none to guard: every comment is gone from the copy, so every double slash still standing in it opens none
	return {
		searchString: hideFalseInlineComments(blankComments(text, commentSpans), []),
		commentSpans,
	}
}

export type { CommentSpan }
