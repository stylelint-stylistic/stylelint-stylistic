import stylelint from "stylelint"

import { TRAILING_LINE_BREAK, TRAILING_SPACES_AND_TABS } from "../../regexps.js"
import { addNamespace } from "../../utils/addNamespace/index.js"
import { getLineEnding } from "../../utils/getLineEnding/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `no-missing-end-of-source-newline`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	rejected: `Unexpected missing end-of-source newline`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Disallows missing end-of-source newlines.
 * @type {import('stylelint').Rule}
 */
function rule (primary, _secondaryOptions, context) {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, { actual: primary })

		if (!validOptions) return

		if (root.source === null) throw new Error(`The root node must have a source property`)

		if (root.source.inline || root.source.lang === `object-literal`) return

		let rootString = root.source.input.css

		if (!rootString.trim() || TRAILING_LINE_BREAK.test(rootString)) return

		let problemIndex = rootString.length - 1

		report({
			message: messages.rejected,
			node: root,
			index: problemIndex,
			endIndex: problemIndex,
			result,
			ruleName,
			fix () {
				// The break is written behind what the raw holds rather than in place of it. The file that ends on no break of its own may still end on a free semicolon, which PostCSS parks in this raw along with the whitespace around it, or on an empty line — whether such a semicolon belongs in a stylesheet is what `no-extra-semicolons` answers, and how many empty lines a file may end on is what `max-empty-lines` answers, so neither is this rule's to take away.
				//
				// What does go is a run of spaces and tabs standing on its own behind the file's last break. The check reads the file as it was parsed, so it reports such a file although the break is there, and that run is all that stands between the break and the end of the file; a second break written behind the run would leave the file an empty line it never had, and set this rule and `no-eol-whitespace` disagreeing over the two orders a configuration can list them in. Behind anything the file spells the run is kept and the break is written behind it in turn: that line is a line, and the whitespace at the end of it is `no-eol-whitespace`'s to take.
				let after = typeof root.raws.after === `string` ? root.raws.after : ``
				let ended = after.replace(TRAILING_SPACES_AND_TABS, ``)

				// The file is closed with the break it spells its lines with. `context.newline` is left for the file that ends no line at all, since it reads a line feed and a Windows pair and knows neither of the two other breaks a stylesheet is written with
				root.raws.after = TRAILING_LINE_BREAK.test(ended) ? ended : after + (getLineEnding(root) ?? context.newline)
			},
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
