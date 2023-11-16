import stylelint from "stylelint"

const { utils: { report, ruleMessages, validateOptions } } = stylelint

export const ruleName = `no-missing-end-of-source-newline`

export const messages = ruleMessages(ruleName, {
	rejected: `Unexpected missing end-of-source newline`,
})

export const meta = {
	url: `https://github.com/firefoxic/stylelint-codeguide/blob/main/lib/rules/${ruleName}/README.md`,
	fixable: true,
}

/** @type {import('stylelint').Rule} */
const rule = (primary, _secondaryOptions, context) => (root, result) => {
	const validOptions = validateOptions(result, ruleName, { actual: primary })

	if (!validOptions) {
		return
	}

	if (root.source === null) {
		throw new Error(`The root node must have a source property`)
	}

	// @ts-expect-error -- TS2339: Property 'inline' does not exist on type 'Source'.
	if (root.source.inline || root.source.lang === `object-literal`) {
		return
	}

	const rootString = context.fix ? root.toString() : root.source.input.css

	if (!rootString.trim() || rootString.endsWith(`\n`)) {
		return
	}

	// Fix
	if (context.fix) {
		root.raws.after = context.newline

		return
	}

	report({
		message: messages.rejected,
		node: root,
		index: rootString.length - 1,
		result,
		ruleName,
	})
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta
export default rule
