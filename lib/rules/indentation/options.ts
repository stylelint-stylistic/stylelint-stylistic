import { defineMessages } from "../../utils/defineRule/index.ts"

export const MESSAGES = defineMessages({
	expected: (x) => `Expected indentation of ${x}`,
})

/** A number of spaces, or `tab`. */
export type PrimaryOption = number | `tab`

/** The secondary options. */
export type SecondaryOptions = {

	/** The level the statements of an embedded stylesheet stand at; `auto`, and no value, reads it off the lines at that level. */
	baseIndentLevel?: number | `auto`,

	/** What is not indented: `block` the nested blocks, `value` the lines of a value, `param` the lines of an at-rule's params. */
	except?: (`block` | `value` | `param`)[],

	/** What is not checked: `value` the lines of a value, `param` the lines of an at-rule's params, `inside-parens` the lines inside parentheses. */
	ignore?: (`value` | `param` | `inside-parens`)[],

	/** How the lines inside parentheses are indented: one level by default, `twice`, or `once-at-root-twice-in-block`. */
	indentInsideParens?: `twice` | `once-at-root-twice-in-block`,

	/** Whether a closing brace stands at the level of the block's nodes; `false` by default. */
	indentClosingBrace?: boolean,
}
