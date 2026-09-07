#!/usr/bin/env node

/**
 * Accounts for every line of `lib/` that spells a line break, and refuses one nobody has classified.
 *
 * [AGENTS.md](../AGENTS.md) wants every stylesheet-reading pattern under a name in [lib/regexps.ts](../lib/regexps.ts); a `===` against a break, an `includes`, a `style-search` target and a template-literal pattern slip past that ([#246](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/246)), and `oxlint` has no `no-restricted-syntax`. Matching the shapes of a reading cannot work (the first draft missed the line of [#247](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/247)), so every line spelling a break is a finding until a list classifies it.
 *
 * `ALLOWED` puts a break into a text or spells a stylesheet as data; it asks nothing and may stand for ever. `DEBT` reads one and is meant to shrink: a line leaves it through a name in `lib/regexps.ts`, or a name of its own where the narrow reading is right.
 *
 * A line is matched by its text and counted, so moving one keeps it classified, changing one asks again, and a copy is reported. Invisible to a text check: a break named by code point, `charCodeAt(0) === 10`, a template literal holding a real break, and a statement continued under a leading `*`, read as a comment's middle; `lib/` writes none.
 */

import { readdirSync, readFileSync } from "node:fs"
import { exit, stdout } from "node:process"
import { fileURLToPath } from "node:url"

/** The directory read, resolved from this file. */
const LIB = fileURLToPath(new URL(`../lib`, import.meta.url))

/** A line break spelled as an escape, in every spelling JavaScript reads. */
const MENTIONS = /\\(?:[nrf]|u000[acd]|x0[acd]|u\{0*[acd]\}|c[jlm])/iu

/** A line that is prose alone; a delimiter counts only where the comment runs to that end of the line. */
const COMMENT_ONLY = /^(?:\/\/|\*(?!\/\s*\S))|^\/\*(?:(?!\*\/)[\s\S])*(?:\*\/\s*)?$/u

/** The file the answers come from, and the tests, whose fixtures are stylesheets. */
const SKIPPED = /(?:^|\/)regexps\.ts$|\.test\.ts$/u

/** Lines that write a break or spell one in a stylesheet written as data. */
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
	"lib/preprocessor/readsInlineComments/index.ts": [`const INLINE_COMMENT_PROBE = \`a {}\\n// comment\\na { b: 'x', // comment\\n  'y'; }\\n\``],
}

/** Lines that read a break without asking `lib/regexps.ts`. */
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
	"lib/rules/max-empty-lines/index.ts": [`target: CRLF.test(rootString) ? \`\\r\\n\` : \`\\n\`,`],
	"lib/preprocessor/findRewrittenCommentSpans/index.ts": [
		`let lineBreakIndex = spelled.indexOf(\`\\n\`, spelledIndex)`,
		`let rewrittenLineBreakIndex = rewritten.indexOf(\`\\n\`, rewrittenIndex)`,
	],
	"lib/rules/max-line-length/index.ts": [
		`styleSearch({ source: rootString, target: [\`\\n\`], comments: \`check\` }, (match) => checkNewline(match))`,
		`let nextNewlineIndex = rootString.indexOf(\`\\n\`, match.endIndex)`,
		`if (rootString[nextNewlineIndex - 1] === \`\\r\`) nextNewlineIndex -= 1`,
	],
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
 * Every TypeScript file of `lib/` a break could be spelled in.
 * @returns The paths from the repository root.
 */
function collectSources (): string[] {
	return readdirSync(LIB, { recursive: true, encoding: `utf8` })
		.filter((path) => path.endsWith(`.ts`))
		.map((path) => `lib/${path}`)
		.filter((path) => !SKIPPED.test(path))
		.toSorted()
}

/**
 * Counts each line of a list.
 * @param lines - The classified lines of one file.
 * @returns Line to expected count.
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

// A file named by a list and gone from `lib/` is never reached above
for (let path of [...Object.keys(ALLOWED), ...Object.keys(DEBT)]) {
	if (!seen.has(path)) stale.push(`${path}\t(the file itself is gone)`)
}

if (unclassified.length > 0) stdout.write(`\tA line spells a line break and neither list accounts for it:\n\t\t${unclassified.join(`\n\t\t`)}\n\tIf it reads a break, ask the question through a name in lib/regexps.ts or add the line to DEBT in scripts/check-break-readings.ts. If it only writes one, add it to ALLOWED.\n`)

if (stale.length > 0) stdout.write(`\tA list names a line the file no longer holds:\n\t\t${stale.join(`\n\t\t`)}\n\tTake it out of scripts/check-break-readings.ts — a list that lags behind the code says nothing about either.\n`)

if (unclassified.length > 0 || stale.length > 0) exit(1)
