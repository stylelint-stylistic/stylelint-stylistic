// `style-search` ships no declaration; what the plugin reads of it is declared here, as its README says.
declare module "style-search" {

	/** Skip matches inside the feature, check them too, or check only them. */
	type StyleSearchMode = `skip` | `check` | `only`

	interface StyleSearchOptions {

		/** The text. */
		source: string,

		/** One target or several. */
		target: string | string[],

		/** Stop after the first match. */
		once?: boolean,

		/** Block and `//` comments; skipped by default. */
		comments?: StyleSearchMode,

		/** Skipped by default. */
		strings?: StyleSearchMode,

		/** The name before a call's `(`; skipped by default. */
		functionNames?: StyleSearchMode,

		/** A call's arguments, parentheses included; checked by default. */
		functionArguments?: StyleSearchMode,

		/** Inside any parentheses; checked by default. */
		parentheticals?: StyleSearchMode,
	}

	interface StyleSearchMatch {

		/** Where the match opens. */
		startIndex: number,

		/** One past the last character. */
		endIndex: number,

		/** The target matched. */
		target: string,
		insideFunctionArguments: boolean,
		insideComment: boolean,
		insideString: boolean,
		insideParens: boolean,
	}

	/**
	 * Calls back on every match.
	 * @param options - What to search and pass over.
	 * @param callback - Gets each match and the count so far.
	 */
	function styleSearch (options: StyleSearchOptions, callback: (match: StyleSearchMatch, count: number) => void): void

	export default styleSearch
	export type { StyleSearchMatch, StyleSearchMode, StyleSearchOptions }
}
