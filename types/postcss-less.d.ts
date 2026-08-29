// `postcss-less` ships no declaration and DefinitelyTyped carries none, so what the plugin reads of it is declared here: the syntax object, and the flags its parser hangs on a node beyond what PostCSS declares, as its README and `LessParser.js` spell them.
declare module "postcss-less" {
	import type { AtRule as PostcssAtRule, Comment as PostcssComment, Declaration as PostcssDeclaration, Parser, Rule as PostcssRule, Stringifier } from "postcss"

	/** A comment opened with a double slash carries `inline`. */
	interface Comment extends PostcssComment {
		inline?: boolean,
	}

	/** A variable, a mixin call and a detached-ruleset call are all read as at-rules, each flagged for what it is; a mixin call closed with `!important` carries that too. */
	interface AtRule extends PostcssAtRule {
		"variable"?: boolean,

		/** The text of a variable, kept beside `params`; the Less stringifier prints this copy. */
		"value"?: string,
		"mixin"?: boolean,
		"function"?: boolean,
		"important"?: boolean,
		"import"?: boolean,
		"filename"?: string,
		"options"?: string,
	}

	interface Declaration extends PostcssDeclaration {
		important: boolean,
	}

	type Rule = PostcssRule

	let parse: Parser
	let stringify: Stringifier
	let less: {
		parse: Parser,
		stringify: Stringifier,
	}

	export default less
	export { parse, stringify }
	export type { AtRule, Comment, Declaration, Rule }
}
