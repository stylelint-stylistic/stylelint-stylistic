import type { Root } from "postcss"
import type { PostcssResult } from "stylelint"

/**
 * How a family of the plugin's rules reads a stylesheet: the namespace the family is registered under, and the syntaxes it answers for.
 *
 * Every rule module exports a factory taking one of these, and `lib/index.ts` registers the factory's rule once per syntax listed below beside the core, under `@stylistic/<namespace>/<rule>`. What a syntax adds to this contract as the rules come to ask it more — where the comments of a text stand, what a construct of a preprocessor is — is added here, and answered for plain CSS by the core's own syntax.
 */
export type Syntax = {

	/** The segment between `@stylistic/` and the rule's name — `scss` for `@stylistic/scss/color-hex-case` — and nothing for the rules of the core. */
	namespace?: string,

	/**
	 * Asks whether the rules read the given root, by the shape its parser left on it and by the syntax the file was opened with.
	 * @param root - The root a check was handed.
	 * @param result - The Stylelint result, which holds the syntax the file was opened with.
	 * @returns True where the rules are written for it; a root refused here is answered by one warning naming the rule, and checked by nothing.
	 */
	accepts (root: Root, result: PostcssResult): boolean,
}

/** The syntaxes registered beside the core, each under a namespace of its own. A syntax is not registered until it is listed here. */
export let namespaces: Syntax[] = []
