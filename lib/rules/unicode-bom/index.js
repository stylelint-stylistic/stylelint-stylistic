import report from '../../utils/report'
import ruleMessages from '../../utils/ruleMessages'
import validateOptions from '../../utils/validateOptions'

export const ruleName = `unicode-bom`

export const messages = ruleMessages(ruleName, {
	expected: `Expected Unicode BOM`,
	rejected: `Unexpected Unicode BOM`
})

export const meta = {
	url: `https://github.com/firefoxic/stylelint-codeguide/blob/main/lib/rules/unicode-bom/README.md`
}

/** @type {import('stylelint').Rule} */
const rule = (primary) => (root, result) => {
	const validOptions = validateOptions(result, ruleName, {
		actual: primary,
		possible: [`always`, `never`]
	})

	if (
		!validOptions ||
			!root.source ||
			// @ts-expect-error -- TS2339: Property 'inline' does not exist on type 'Source'.
			root.source.inline ||
			// @ts-expect-error -- TS2339: Property 'lang' does not exist on type 'Source'.
			root.source.lang === `object-literal` ||
			// Ignore HTML documents
			// @ts-expect-error -- TS2339: Property 'document' does not exist on type 'Root'.
			root.document !== undefined
	) {
		return
	}

	const { hasBOM } = root.source.input

	if (primary === `always` && !hasBOM) {
		report({
			result,
			ruleName,
			message: messages.expected,
			node: root,
			line: 1
		})
	}

	if (primary === `never` && hasBOM) {
		report({
			result,
			ruleName,
			message: messages.rejected,
			node: root,
			line: 1
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta
export default rule
