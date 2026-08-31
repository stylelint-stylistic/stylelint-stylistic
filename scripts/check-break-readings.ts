#!/usr/bin/env node

/**
 * Accounts for every line of `lib/` that spells a line break, and refuses one nobody has classified.
 *
 * [AGENTS.md](../AGENTS.md) asks that every regular expression the plugin reads a stylesheet with live in [lib/regexps.ts](../lib/regexps.ts) under a name, so that a question is asked once and in the same words wherever it is asked. A comparison is not a regular expression, though, and a `===` against a break character, an `includes` of one, a `style-search` target and a pattern built out of a template literal all slip past that convention — which is where #246 stood, and where half the readings of a break in this plugin still stand. `oxlint` has no `no-restricted-syntax`, so the check is written here.
 *
 * The first draft of it looked for the shapes a reading is written in, and missed thirteen of them, one being the very line #247 is about. Looking for shapes cannot work: a reading can be spelled in as many ways as JavaScript has syntax, and every list of those is a list of the ones somebody thought of. So the question is turned around. **Every line spelling a break is a finding until it is classified**, and the two lists below are the classification — which cannot leak, since a line matching neither is what the check fails on.
 *
 * `ALLOWED` is a line that puts a break into a text, or spells a stylesheet as data. It asks nothing, so it may stand anywhere and stay for ever: a fixer has to be free to write the character the file is spelled with.
 *
 * `DEBT` is a line that reads one. Each is a place the next bug of the class can be, and the list is meant to shrink: taking a line off it means either asking the question through a name in `lib/regexps.ts`, or — where the narrow reading is the right one — moving it behind a name of its own that says so. Nothing here says a listed reading is wrong. Several are right and say why in a comment beside them, `whitespaceChecker`'s own three-character test among them. What the list says is that they stand outside the one place this question is meant to be answered from.
 *
 * A line is matched by its text rather than by its number, so moving one leaves it classified while changing one asks for the classification again, and the two lists are counted rather than looked up, or a second copy of a listed line would grow the debt without the list saying so.
 *
 * Two spellings are still outside this, and both are worth naming rather than pretending about, since neither can be seen by a check that reads the text of a file at all. A break named by its code point rather than written, `charCodeAt(0) === 10` for one, spells nothing to find. And a template literal holding a real line break rather than an escape spells it across two lines of source, neither of which shows it. Nothing in `lib/` is written either way today.
 *
 * One line is skipped that need not be: a statement continued under a leading operator, `* b.indexOf(\`\\n\`)` for one, is read as the middle of a block comment. Nothing in `lib/` is written in that style, and telling the two apart by text alone cannot be done.
 */

import { readdirSync, readFileSync } from "node:fs"
import { exit, stdout } from "node:process"
import { fileURLToPath } from "node:url"

/** The directory read, resolved from this file rather than from the working one, so that the check answers the same from any directory. */
const LIB = fileURLToPath(new URL(`../lib`, import.meta.url))

/** A line break spelled as an escape, in any of the spellings JavaScript reads one by: the three short ones, the two numeric ones, the braced Unicode one, and the control escape a pattern may carry. */
const MENTIONS = /\\(?:[nrf]|u000[acd]|x0[acd]|u\{0*[acd]\}|c[jlm])/iu

/** A line that is nothing but prose about the code, where a break may be quoted rather than spelled. A line carrying either delimiter of a block comment counts only where the comment runs to that end of it, so that code written before the opening one or after the closing one is still read. */
const COMMENT_ONLY = /^(?:\/\/|\*(?!\/\s*\S))|^\/\*(?:(?!\*\/)[\s\S])*(?:\*\/\s*)?$/u

/** The file the answers are meant to come from, and the tests, whose fixtures are stylesheets rather than readings of one. */
const SKIPPED = /(?:^|\/)regexps\.ts$|\.test\.ts$/u

/** Every line that puts a break into a text, or spells one inside a stylesheet written as data. None of them asks whether anything is a break, so none is debt. */
const ALLOWED: Record<string, string[]> = {
	"lib/rules/function-max-empty-lines/index.ts": [
		`let allowedLFNewLinesString = \`\\n\`.repeat(maxAdjacentNewlines)`,
		`let allowedCRLFNewLinesString = \`\\r\\n\`.repeat(maxAdjacentNewlines)`,
	],
	"lib/rules/linebreaks/index.ts": [`if (data) return data.replaceAll(EVERY_LINE_BREAK, shouldHaveCR ? \`\\r\\n\` : \`\\n\`)`],
	"lib/rules/max-empty-lines/index.ts": [
		`let emptyLFLines = \`\\n\`.repeat(repeatTimes)`,
		`let emptyCRLFLines = \`\\r\\n\`.repeat(repeatTimes)`,
	],
	"lib/rules/selector-max-empty-lines/index.ts": [
		`let allowedLFNewLinesString = \`\\n\`.repeat(maxAdjacentNewlines)`,
		`let allowedCRLFNewLinesString = \`\\r\\n\`.repeat(maxAdjacentNewlines)`,
	],
	"lib/rules/value-list-max-empty-lines/index.ts": [
		`let allowedLFNewLinesString = \`\\n\`.repeat(maxAdjacentNewlines)`,
		`let allowedCRLFNewLinesString = \`\\r\\n\`.repeat(maxAdjacentNewlines)`,
	],
	"lib/utils/getLineBreak/index.ts": [
		`const BREAK_OF_OPTION = { unix: \`\\n\`, windows: \`\\r\\n\` }`,
		`return lineBreakOfFile(node) ?? \`\\n\``,
	],
	"lib/utils/readsInlineComments/index.ts": [`const INLINE_COMMENT_PROBE = \`a {}\\n// comment\\na { b: 'x', // comment\\n  'y'; }\\n\``],
}

/** Every line that reads a break without asking `lib/regexps.ts` what one is. */
const DEBT: Record<string, string[]> = {
	"lib/rules/block-closing-brace-empty-line-before/index.ts": [`if (statementString[index - 1] === \`\\r\`) index -= 1`],
	"lib/rules/block-closing-brace-newline-before/index.ts": [`if (statementString[index - 1] === \`\\r\`) index -= 1`],
	"lib/rules/block-closing-brace-space-before/index.ts": [`if (statementString[index - 1] === \`\\r\`) index -= 1`],
	"lib/rules/block-opening-brace-newline-before/index.ts": [`if (beforeBraceNoRaw[index - 1] === \`\\r\`) index -= 1`],
	"lib/rules/block-opening-brace-space-before/index.ts": [`if (beforeBraceNoRaw[index - 1] === \`\\r\`) index -= 1`],
	"lib/rules/function-max-empty-lines/index.ts": [
		`let violatedCRLFNewLinesRegex = new RegExp(\`(?:\\r\\n){\${maxAdjacentNewlines + 1},}\`, \`u\`)`,
		`let violatedLFNewLinesRegex = new RegExp(\`\\n{\${maxAdjacentNewlines + 1},}\`, \`u\`)`,
	],
	"lib/rules/function-whitespace-after/index.ts": [
		`if (nextChar === \`\\n\`) return`,
		`if (source.slice(index, index + 2) === \`\\r\\n\`) return`,
	],
	"lib/rules/indentation/index.ts": [`target: \`\\n\`,`],
	"lib/syntaxes/styled/index.ts": [`let found = text.split(\`\\n\`)[line - 1]`],
	"lib/rules/max-empty-lines/index.ts": [`target: CRLF.test(rootString) ? \`\\r\\n\` : \`\\n\`,`],
	"lib/rules/max-line-length/index.ts": [
		`styleSearch({ source: rootString, target: [\`\\n\`], comments: \`check\` }, (match) => checkNewline(match))`,
		`let nextNewlineIndex = rootString.indexOf(\`\\n\`, match.endIndex)`,
		`if (rootString[nextNewlineIndex - 1] === \`\\r\`) nextNewlineIndex -= 1`,
	],
	"lib/rules/named-grid-areas-alignment/index.ts": [`let isMultilineDeclaration = declarationValue.includes(\`\\n\`)`],
	"lib/rules/no-eol-whitespace/index.ts": [
		`const LINE_BREAK_CHARACTERS = [\`\\n\`]`,
		`if (string.charAt(eolWhitespaceIndex) === \`\\r\`) eolWhitespaceIndex -= 1`,
	],
	"lib/rules/no-extra-semicolons/index.ts": [`if (string[i] === \`\\n\`) {`],
	"lib/rules/no-multiple-whitespaces/index.ts": [`return char === \`\\n\` || char === \`\\r\``],
	"lib/rules/selector-max-empty-lines/index.ts": [
		`let violatedCRLFNewLinesRegex = new RegExp(\`(?:\\r\\n){\${maxAdjacentNewlines + 1},}\`, \`u\`)`,
		`let violatedLFNewLinesRegex = new RegExp(\`\\n{\${maxAdjacentNewlines + 1},}\`, \`u\`)`,
	],
	"lib/rules/string-quotes/index.ts": [
		`let lineBreakIndex = spelled.indexOf(\`\\n\`, spelledIndex)`,
		`let rewrittenLineBreakIndex = rewritten.indexOf(\`\\n\`, rewrittenIndex)`,
	],
	"lib/rules/value-list-max-empty-lines/index.ts": [
		`let violatedCRLFNewLinesRegex = new RegExp(\`(?:\\r\\n){\${maxAdjacentNewlines + 1},}\`, \`u\`)`,
		`let violatedLFNewLinesRegex = new RegExp(\`\\n{\${maxAdjacentNewlines + 1},}\`, \`u\`)`,
	],
	"lib/utils/findCommentSpans/index.ts": [
		`let index = text.indexOf(\`\\n\`, openIndex)`,
		`return text[index - 1] === \`\\r\` ? index - 1 : index`,
	],
	"lib/utils/isWhitespace/index.ts": [`return [\` \`, \`\\n\`, \`\\t\`, \`\\r\`, \`\\f\`].includes(char)`],
	"lib/utils/whitespaceChecker/index.ts": [
		`return char === \`\\n\``,
		`if (oneCharAfter === \`\\r\` && twoCharsAfter === \`\\n\` && (activeArgs.onlyOneChar || isNullish(threeCharsAfter) || !isWhitespace(threeCharsAfter))) return`,
	],
}

/**
 * Every JavaScript file of `lib/` a break could be spelled in.
 * @returns The paths, relative to the repository root.
 */
function collectSources (): string[] {
	return readdirSync(LIB, { recursive: true, encoding: `utf8` })
		.filter((path) => path.endsWith(`.ts`))
		.map((path) => `lib/${path}`)
		.filter((path) => !SKIPPED.test(path))
		.toSorted()
}

/**
 * Counts how many times each line of a list stands in it.
 * @param lines - The classified lines of one file.
 * @returns Each line against the number of times it is expected.
 */
function tally (lines: string[]): Map<string, number> {
	let counts = new Map()

	for (let line of lines) counts.set(line, (counts.get(line) ?? 0) + 1)

	return counts
}

let unclassified = []
let stale = []
let seen = new Set()

for (let path of collectSources()) {
	seen.add(path)

	let found = readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), `utf8`)
		.split(`\n`)
		.map((line, index) => ({ line: line.trim(), number: index + 1 }))
		.filter(({ line }) => !COMMENT_ONLY.test(line) && MENTIONS.test(line))
	let expected = tally([...ALLOWED[path] ?? [], ...DEBT[path] ?? []])

	for (let { line, number } of found) {
		let left = expected.get(line) ?? 0

		if (left === 0) unclassified.push(`${path}:${number}\t${line}`)
		else expected.set(line, left - 1)
	}

	for (let [line, left] of expected) {
		for (let count = 0; count < left; count += 1) stale.push(`${path}\t${line}`)
	}
}

// A file named by either list and no longer in `lib/` is never reached by the loop above, so its lines would go unanswered for rather than be reported
for (let path of [...Object.keys(ALLOWED), ...Object.keys(DEBT)]) {
	if (!seen.has(path)) stale.push(`${path}\t(the file itself is gone)`)
}

if (unclassified.length > 0) stdout.write(`\tA line spells a line break and neither list accounts for it:\n\t\t${unclassified.join(`\n\t\t`)}\n\tIf it reads a break, ask the question through a name in lib/regexps.ts or add the line to DEBT in scripts/check-break-readings.ts. If it only writes one, add it to ALLOWED.\n`)

if (stale.length > 0) stdout.write(`\tA list names a line the file no longer holds:\n\t\t${stale.join(`\n\t\t`)}\n\tTake it out of scripts/check-break-readings.ts — a list that lags behind the code says nothing about either.\n`)

if (unclassified.length > 0 || stale.length > 0) exit(1)
