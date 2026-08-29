import stylelint from "stylelint"

import { TRAILING_LINE_BREAK, TRAILING_SPACES_AND_TABS } from "../../regexps.ts"
import { addNamespace } from "../../utils/addNamespace/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"

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
 * @type {import('stylelint').RuleBase<true>}
 */
function rule (primary, _secondaryOptions) {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, { actual: primary })

		if (!validOptions) return

		if (root.source === undefined) throw new Error(`The root node must have a source property`)

		/** @type {import('../../utils/typeGuards/index.ts').EmbeddedSource} */
		let source = root.source

		if (source.inline || source.lang === `object-literal`) return

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
				//
				// The run comes off only where the raw and the file agree that it is what the file ends on, and a break is written wherever they part. Each of the two answers a question the other cannot. The raw is the only place this fix can write, so where the run is not in it there is nothing to take off: a bare carriage return or a form feed behind a `//` comment is text of that comment, along with the whitespace after it, leaving the root's raw empty while the file ends on a run all the same, and taking a run out of an empty raw writes nothing at all. The file, for its part, is the text this warning was made about: Stylelint runs each rule once and in the order the configuration spells them, so a rule listed ahead of this one has written into the raw already — `no-extra-semicolons` takes the free semicolon out of it — and what is left ends on the break the file spells in front of that semicolon while the file itself ends on the semicolon still. Asked of the raw alone this rule writes a break in one of the two orders and nothing in the other; asked of the file alone it writes nothing where nothing can be written. Asked of both, it closes every file it reports on, and closes it the same way on either side of `no-extra-semicolons` and of `max-empty-lines`. Beside `linebreaks` the order still decides, and that is [#352](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/352) rather than anything this fix reads.
				let after = typeof root.raws.after === `string` ? root.raws.after : ``
				let ended = after.replace(TRAILING_SPACES_AND_TABS, ``)
				let endedInFile = rootString.replace(TRAILING_SPACES_AND_TABS, ``)
				let endsTheLine = TRAILING_LINE_BREAK.test(ended) && TRAILING_LINE_BREAK.test(endedInFile)

				// The file is closed with the break a written one is spelled with: as `linebreaks` asks, or as the file spells its lines
				root.raws.after = endsTheLine ? ended : after + getLineBreak(root, result)
			},
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
