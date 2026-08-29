// `style-search` ships no declaration and DefinitelyTyped carries none, so what the plugin reads of it is declared here: the options the calls of `lib/` pass and the fields of a match they read, as its README describes them.
declare module "style-search" {

	/** How the search treats one syntactic feature: pass over matches inside it, report them along with the rest, or report nothing else. */
	type StyleSearchMode = `skip` | `check` | `only`

	interface StyleSearchOptions {

		/** The text to search. */
		source: string,

		/** What to look for: one string, or several that all count as a match. */
		target: string | string[],

		/** Stop after the first match. */
		once?: boolean,

		/** Comments, both block ones and the `//` kind; skipped by default. */
		comments?: StyleSearchMode,

		/** Quoted strings; skipped by default. */
		strings?: StyleSearchMode,

		/** The name in front of a call's parenthesis; skipped by default. */
		functionNames?: StyleSearchMode,

		/** The inside of a call's parentheses, the parentheses included; checked by default. */
		functionArguments?: StyleSearchMode,

		/** The inside of any parentheses, a call's or not; checked by default. */
		parentheticals?: StyleSearchMode,
	}

	interface StyleSearchMatch {

		/** Where the match opens. */
		startIndex: number,

		/** Where the match closes, one past its last character. */
		endIndex: number,

		/** Which of the targets was matched. */
		target: string,
		insideFunctionArguments: boolean,
		insideComment: boolean,
		insideString: boolean,
		insideParens: boolean,
	}

	/**
	 * Calls back on every match of the target in the source.
	 * @param options - What to search and what to pass over.
	 * @param callback - Called with each match and the count of matches so far.
	 */
	function styleSearch (options: StyleSearchOptions, callback: (match: StyleSearchMatch, count: number) => void): void

	export default styleSearch
	export type { StyleSearchMatch, StyleSearchMode, StyleSearchOptions }
}
