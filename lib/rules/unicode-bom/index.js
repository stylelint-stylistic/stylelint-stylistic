import stylelint from "stylelint"

const { utils: { report, ruleMessages, validateOptions } } = stylelint

export const ruleName = `unicode-bom`

export const messages = ruleMessages(ruleName, {
	expected: `Expected Unicode BOM`,
	rejected: `Unexpected Unicode BOM`,
})

export const meta = {
	url: `https://github.com/firefoxic/stylelint-codeguide/blob/main/lib/rules/${ruleName}/README.md`,
}

/** @type {import('stylelint').Rule} */
const rule = (primary) => (root, result) => {
	const validOptions = validateOptions(result, ruleName, {
		actual: primary,
		possible: [`always`, `never`],
	})

	if (!validOptions || !root.source || root.source.inline || root.source.lang === `object-literal` || root.document !== undefined /* Ignore HTML documents */) {
		return
	}

	const { hasBOM } = root.source.input

	if (primary === `always` && !hasBOM) {
		report({
			result,
			ruleName,
			message: messages.expected,
			node: root,
			line: 1,
		})
	}

	if (primary === `never` && hasBOM) {
		report({
			result,
			ruleName,
			message: messages.rejected,
			node: root,
			line: 1,
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta
export default rule
