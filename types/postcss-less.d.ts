// `postcss-less` ships no declaration; what the plugin reads of it is declared here.
declare module "postcss-less" {
	import type { AtRule as PostcssAtRule, Comment as PostcssComment, Declaration as PostcssDeclaration, Parser, Rule as PostcssRule, Stringifier } from "postcss"

	/** A `//` comment carries `inline`. */
	interface Comment extends PostcssComment {
		inline?: boolean,
	}

	/** A variable, a mixin call and a detached-ruleset call are all at-rules, flagged; `important` is a mixin call's. */
	interface AtRule extends PostcssAtRule {
		"variable"?: boolean,

		/** A variable's text; the Less stringifier prints this copy, not `params`. */
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
