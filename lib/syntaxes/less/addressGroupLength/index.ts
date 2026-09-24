import { findCommentSpans } from "../../../utils/findCommentSpans/index.ts"
import { LESS_IMPORT_OPTION, LESS_LEADING_WHITESPACE, LESS_PLUGIN_ARGUMENTS, LESS_SKIPPED_WHITESPACE } from "../regexps.ts"

/**
 * Steps over what Less's `skipWhitespace` steps over: spaces, tabs, line feeds, carriage returns and comments.
 * @param text - The text.
 * @param index - Where the step opens.
 * @param comments - The ends of the text's comments, by where each opens.
 * @returns Where the code resumes.
 */
function skipWhitespace (text: string, index: number, comments: Map<number, number>): number {
	let at = index

	while (at < text.length) {
		let commentEnd = comments.get(at)

		if (commentEnd !== undefined) at = commentEnd
		else if (LESS_SKIPPED_WHITESPACE.test(text.charAt(at))) at += 1
		else break
	}

	return at
}

/**
 * Finds the end of an `@import`'s options, as Less's `importOptions` reads them: options separated by commas, the list empty or ending on a comma, and the closing parenthesis.
 * @param text - The text behind the name.
 * @param index - Behind the opening parenthesis.
 * @param comments - The ends of the text's comments, by where each opens.
 * @returns Behind the closing parenthesis, or nothing where Less refuses the group.
 */
function importOptionsEnd (text: string, index: number, comments: Map<number, number>): number | undefined {
	let at = skipWhitespace(text, index, comments)

	for (let option = text.slice(at).match(LESS_IMPORT_OPTION)?.[0]; option; option = text.slice(at).match(LESS_IMPORT_OPTION)?.[0]) {
		at = skipWhitespace(text, at + option.length, comments)

		if (text[at] !== `,`) break

		at = skipWhitespace(text, at + 1, comments)
	}

	return text[at] === `)` ? at + 1 : undefined
}

/**
 * Measures the group Less reads between the name of an `@import` or a `@plugin` and its address: `(reference, optional)`, `(args)`.
 *
 * Less takes the at-rule for an import or a plugin only with whitespace right behind the name, and steps over whitespace and comments between the tokens behind it; an import's group holds the options its `importOption` names, a plugin's anything up to the closing parenthesis but a semicolon.
 * @param text - The text behind the name.
 * @param name - The name, `import` or `plugin`.
 * @returns The group's length with the whitespace and comments in front of it, or 0 where Less reads none there.
 */
export function addressGroupLength (text: string, name: string): number {
	if (!LESS_LEADING_WHITESPACE.test(text)) return 0

	let comments = new Map(findCommentSpans(text).map((span) => [span.start, span.end]))
	let open = skipWhitespace(text, 0, comments)

	if (text[open] !== `(`) return 0

	if (name === `plugin`) {
		let behindOpen = skipWhitespace(text, open + 1, comments)
		let argumentsText = text.slice(behindOpen).match(LESS_PLUGIN_ARGUMENTS)?.[0]

		return argumentsText ? behindOpen + argumentsText.length : 0
	}

	return importOptionsEnd(text, open + 1, comments) ?? 0
}
