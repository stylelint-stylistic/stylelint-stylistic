import type { Declaration } from "postcss"
import styleSearch from "style-search"
import type { PostcssResult } from "stylelint"

import { EVERY_LINE_BREAK, LEADING_CSS_WHITESPACE, LEADING_LINE_BREAK, OPENS_WITH_BLOCK_COMMENT, TRAILING_CSS_WHITESPACE, TRAILING_LINE_BREAK_AND_INDENTATION, WHITESPACE_OR_NOTHING } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { addNamespace } from "../addNamespace/index.ts"
import { betweenTailAfterColon } from "../betweenTailAfterColon/index.ts"
import { blockString } from "../blockString/index.ts"
import { closedBySemicolon, valueAsClosed } from "../closedBySemicolon/index.ts"
import { colonIndexInBetween } from "../colonIndexInBetween/index.ts"
import { declarationString } from "../declarationString/index.ts"
import { declarationValueAsSpelled } from "../declarationValueAsSpelled/index.ts"
import { declarationValueIndex } from "../declarationValueIndex/index.ts"
import { isCustomProperty } from "../isCustomProperty/index.ts"
import { isInlineStyleAttribute } from "../isInlineStyleAttribute/index.ts"
import { isSingleLineString } from "../isSingleLineString/index.ts"
import { type NeighborRule, neighborSettings, speaksOf } from "../neighborSettings/index.ts"
import { runInDeclarationEndsTheStylesheet } from "../runInDeclarationEndsTheStylesheet/index.ts"
import { runPastDeclaration } from "../runPastDeclaration/index.ts"
import { isAtRule, isRule } from "../typeGuards/index.ts"

/** The eight rules that read a shared run: two from the colon, two from a comma opening the value, two from the semicolon, two from the closing brace. */
type Participant = `colonSpace` | `colonNewline` | `commaSpace` | `commaNewline` | `semicolonSpace` | `semicolonNewline` | `braceSpace` | `braceNewline`

/** `other` (two spaces, a tab) is a spelling no option writes or accepts, so every option reports it ([#627](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/627)). */
type Run = `space` | `newline` | `none` | `other`

/** The eight rules and the whitespace their `always` options write; `block-closing-brace-empty-line-before` reads the brace's run too, but its two options ask about an empty line, which no colon rule writes, and its pairs with the colon rules rest the same way in either order, so it stays out. */
const PARTICIPANTS: Record<Participant, NeighborRule & { writes: Run }> = {
	colonSpace: {
		name: `declaration-colon-space-after`,
		options: [`always`, `never`, `always-single-line`],
		writes: `space`,
	},
	colonNewline: {
		name: `declaration-colon-newline-after`,
		options: [`always`, `always-multi-line`],
		writes: `newline`,
	},
	commaSpace: {
		name: `value-list-comma-space-before`,
		options: [`always`, `never`, `always-single-line`, `never-single-line`],
		writes: `space`,
	},
	commaNewline: {
		name: `value-list-comma-newline-before`,
		options: [`always`, `always-multi-line`, `never-multi-line`],
		writes: `newline`,
	},
	semicolonSpace: {
		name: `declaration-block-semicolon-space-before`,
		options: [`always`, `never`, `always-single-line`, `never-single-line`],
		writes: `space`,
	},
	semicolonNewline: {
		name: `declaration-block-semicolon-newline-before`,
		options: [`always`, `always-multi-line`, `never-multi-line`],
		writes: `newline`,
	},
	braceSpace: {
		name: `block-closing-brace-space-before`,
		options: [`always`, `never`, `always-single-line`, `never-single-line`, `always-multi-line`, `never-multi-line`],
		writes: `space`,
	},
	braceNewline: {
		name: `block-closing-brace-newline-before`,
		options: [`always`, `always-multi-line`, `never-multi-line`],
		writes: `newline`,
	},
}

/** The semicolon rules read every shared run in front of a semicolon. */
const FROM_THE_SEMICOLON: Participant[] = [`semicolonSpace`, `semicolonNewline`]

/** The brace rules read the run in front of the closing brace. */
const FROM_THE_BRACE: Participant[] = [`braceSpace`, `braceNewline`]

/** The rules whose lineness is the block's. */
const FROM_THE_STATEMENT: Set<Participant> = new Set([...FROM_THE_SEMICOLON, ...FROM_THE_BRACE])

/** The comma rules read the head run where a comma opens the value; their lineness is the whole declaration's. */
const FROM_THE_COMMA: Set<Participant> = new Set([`commaSpace`, `commaNewline`])

/** The four runs and their readers; under two names a set settles nothing. `runIsTheText`: the semicolon's or the brace's run is the whole text behind the colon ([#50](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/50)). `tail`: the run behind a block comment on the colon's line, in front of a comma opening the value (1790072055). */
type SharedRuns = {
	head: Set<Participant>,
	tail: Set<Participant>,
	tailRun: string,
	semicolon: Set<Participant>,
	semicolonRun: string,
	brace: Set<Participant>,
	braceRun: string,
	commentBehindHead: boolean,
	runIsTheText: boolean,
}

/**
 * Asks which rules outside the declaration read a run it shares: the semicolon rules where a semicolon closes it, as `declaration-block-trailing-semicolon` will leave it ([#536](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/536)); the brace rules where none does and the declaration is the block's last node.
 * @param decl - The declaration.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns Whether the semicolon rules read it, and whether the brace rules do.
 */
function readersOutsideTheDeclaration (decl: Declaration, result: PostcssResult): { readBySemicolonRules: boolean, readByBraceRules: boolean } {
	let { parent } = decl

	if (decl.important || parent === undefined || !(isAtRule(parent) || isRule(parent) || isInlineStyleAttribute(parent))) return { readBySemicolonRules: false, readByBraceRules: false }

	let closed = closedBySemicolon(decl, result)

	return { readBySemicolonRules: closed, readByBraceRules: !closed && !isInlineStyleAttribute(parent) && decl.next() === undefined }
}

/**
 * Reads what stands behind a block comment opening the text behind the colon, which the newline rule reads past; the parser returns no unclosed comment, and behind one both colon rules would read the head run.
 * @param text - The text behind the colon.
 * @returns The tail, or nothing where no closed comment opens the text.
 */
function tailBehindComment (text: string): string | undefined {
	if (!OPENS_WITH_BLOCK_COMMENT.test(text)) return undefined

	let commentEnd = text.indexOf(`*/`, text.indexOf(`/*`) + 2)

	return commentEnd === -1 ? undefined : text.slice(commentEnd + 2)
}

/**
 * Finds the runs of a declaration more than one rule reads, and their readers.
 *
 * Both colon rules read the head run, except that the newline rule reads past a block comment on the colon and the space rule passes over a run the stylesheet ends on ([#546](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/546)). `commentBehindHead`: a block comment behind the head run, which a space or nothing written there puts on the colon's line ([#590](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/590)). Where a comma opens the value of a property the comma rules read — not an interpolated one, nor a Less merge — the two `value-list-comma-*-before` rules read the head run as the comma's, and the parser files it in `raws.between` for them to write ([#166](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/166)); a comment between the colon and the comma parts the two runs (1789594574).
 *
 * The semicolon rules read the semicolon's run, both colon rules too on a whitespace-only text, the newline rule on whitespace alone behind a block comment. A flag, a missing semicolon, or a parent the semicolon rules do not read (the root, unless an inline style attribute) empties that set.
 *
 * Behind a block comment on the colon's line the newline rule reads the run in front of the first word, and where that word is a comma opening the value the two comma rules read the same run as the comma's, the parser keeping it at the end of `raws.between` for all three to write (1790072055). The head run in front of the comment is the space rule's alone there.
 *
 * The brace rules read the run in front of the closing brace the same way, where the declaration is the block's last node and no semicolon closes it or will: the parser files the run into the block's `raws.after` behind a plain property and keeps it in a custom property's value, and the colon rules write into either ([#387](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/387), [#689](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/689)). A comment behind a plain property is a sibling holding the run, so the set is the custom property's alone there.
 * @param syntax - The syntax the declaration is read under.
 * @param decl - The declaration.
 * @param result - The Stylelint result.
 * @returns The runs and their readers.
 */
function sharedRunsOf (syntax: Syntax, decl: Declaration, result: PostcssResult): SharedRuns {
	let runs: SharedRuns = { head: new Set(), tail: new Set(), tailRun: ``, semicolon: new Set(), semicolonRun: ``, brace: new Set(), braceRun: ``, commentBehindHead: false, runIsTheText: false }

	if (!syntax.isStandardDeclaration(decl)) return runs

	let between = decl.raws.between ?? ``
	let colonIndex = colonIndexInBetween(syntax, decl, result)

	if (colonIndex === -1) return runs

	let { readBySemicolonRules, readByBraceRules } = readersOutsideTheDeclaration(decl, result)
	let text = between.slice(colonIndex + 1) + valueAsClosed(syntax, decl, result)

	if (WHITESPACE_OR_NOTHING.test(text)) {
		// Not the space rule's where the stylesheet ends on it (#546), or it would gate an `always` neighbor for good; a run that left the declaration is neither rule's (#537)
		if (!runInDeclarationEndsTheStylesheet(syntax, decl, result)) runs.head.add(`colonSpace`)

		runs.head.add(`colonNewline`)

		if (readBySemicolonRules) {
			runs.semicolonRun = text
			runs.runIsTheText = true
			for (let participant of [`colonSpace`, `colonNewline`, ...FROM_THE_SEMICOLON] as Participant[]) runs.semicolon.add(participant)
		}

		if (readByBraceRules) {
			// The run is the text a custom property keeps, or the block's raw behind a plain one
			runs.braceRun = text + (runPastDeclaration(syntax, decl, result) ?? ``)
			runs.runIsTheText = true
			for (let participant of [...runs.head, ...FROM_THE_BRACE]) runs.brace.add(participant)
		}

		return runs
	}

	let tail = tailBehindComment(text)

	if (tail !== undefined) return readersBehindComment(syntax, decl, result, runs, tail, readBySemicolonRules, readByBraceRules)

	// A space rule's write puts this on the colon's line, where a closed block comment moves the newline rule behind it
	let behindHead = text.replace(LEADING_CSS_WHITESPACE, ``)

	runs.commentBehindHead = tailBehindComment(behindHead) !== undefined
	for (let participant of readersOfTheHeadRun(syntax, decl, behindHead)) runs.head.add(participant)

	return runs
}

/**
 * Fills in the readers of the runs behind a block comment on the colon's line, which the newline rule of the colon reads past: the semicolon's or the brace's run where nothing but whitespace follows, the comma's where a comma opening the value does.
 * @param syntax - The syntax the declaration is read under.
 * @param decl - The declaration.
 * @param result - The Stylelint result.
 * @param runs - The runs found so far, filled in place.
 * @param tail - The text behind the comment.
 * @param readBySemicolonRules - Whether the semicolon rules read the declaration's end.
 * @param readByBraceRules - Whether the brace rules do.
 * @returns The runs.
 */
function readersBehindComment (syntax: Syntax, decl: Declaration, result: PostcssResult, runs: SharedRuns, tail: string, readBySemicolonRules: boolean, readByBraceRules: boolean): SharedRuns {
	if (WHITESPACE_OR_NOTHING.test(tail) && readBySemicolonRules) {
		runs.semicolonRun = tail
		for (let participant of [`colonNewline`, ...FROM_THE_SEMICOLON] as Participant[]) runs.semicolon.add(participant)
	}

	if (WHITESPACE_OR_NOTHING.test(tail) && readByBraceRules) {
		runs.braceRun = tail + (runPastDeclaration(syntax, decl, result) ?? ``)
		for (let participant of [`colonNewline`, ...FROM_THE_BRACE] as Participant[]) runs.brace.add(participant)
	}

	let runInFrontOfComma = runInFrontOfCommaOpeningTheValue(syntax, decl, tail)

	if (runInFrontOfComma !== undefined) {
		runs.tailRun = runInFrontOfComma
		for (let participant of [`colonNewline`, ...FROM_THE_COMMA] as Participant[]) runs.tail.add(participant)
	}

	return runs
}

/**
 * Reads the run in front of a comma opening the value behind a block comment on the colon's line, which the comma rules read as the comma's where they read the property at all.
 * @param syntax - The syntax the declaration is read under.
 * @param decl - The declaration.
 * @param tail - The text behind the comment.
 * @returns The run, or nothing where no comma opens the value there or the comma rules pass the property over.
 */
function runInFrontOfCommaOpeningTheValue (syntax: Syntax, decl: Declaration, tail: string): string | undefined {
	let run = (tail.match(LEADING_CSS_WHITESPACE) as RegExpMatchArray)[0]

	return tail.slice(run.length).startsWith(`,`) && syntax.isStandardProperty(decl.prop) ? run : undefined
}

/**
 * The readers of a head run a word follows: both colon rules, and the two comma rules where the word is a comma opening the value ([#166](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/166)) of a property they read — `valueListCommaWhitespaceChecker` passes over an interpolated property and a Less merge, which the colon rules read.
 * @param syntax - The syntax the declaration is read under.
 * @param decl - The declaration.
 * @param behindHead - The text behind the head run.
 * @returns The readers.
 */
function readersOfTheHeadRun (syntax: Syntax, decl: Declaration, behindHead: string): Participant[] {
	return behindHead.startsWith(`,`) && syntax.isStandardProperty(decl.prop) ? [`colonSpace`, `colonNewline`, ...FROM_THE_COMMA] : [`colonSpace`, `colonNewline`]
}

/**
 * Asks whether the value holds a comma of the list behind the one opening it, read as `valueListCommaWhitespaceChecker` reads them: over the search copy, a function's arguments skipped.
 * @param syntax - The syntax the declaration is read under.
 * @param decl - The declaration.
 * @param result - The Stylelint result.
 * @returns True where another comma of the list stands in the value.
 */
function listHasAnotherComma (syntax: Syntax, decl: Declaration, result: PostcssResult): boolean {
	let { searchString } = syntax.searchCopy(declarationString(syntax, decl), decl, result)
	let valueIndex = declarationValueIndex(decl)
	let found = false

	styleSearch({ source: searchString, target: `,`, functionArguments: `skip` }, (match) => {
		if (match.startIndex > valueIndex) found = true
	})

	return found
}

/**
 * The spellings a rule's option accepts of a shared run.
 *
 * `always` accepts what the rule writes. `never` accepts only the single space a rule leaves alone ([#50](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/50)), the semicolon newline rule always and the semicolon space rule on a custom property, and only where that space is the whole text behind the colon; wider, a pair sat on two warnings ([#627](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/627)).
 * @param participant - The rule.
 * @param option - The rule's primary option, `always` or `never` with any line suffix.
 * @param decl - The declaration.
 * @param runIsTheText - Whether the run is the whole text behind the colon.
 * @returns The accepted spellings.
 */
function accepts (participant: Participant, option: string, decl: Declaration, runIsTheText: boolean): Run[] {
	if (option.startsWith(`always`)) return [PARTICIPANTS[participant].writes]
	if (runIsTheText && (participant === `semicolonNewline` || (participant === `semicolonSpace` && isCustomProperty(decl.prop)))) return [`none`, `space`]

	return [`none`]
}

/**
 * Asks whether the run a rule reads of this declaration is the one in front of its semicolon; the head run alone does not count.
 * @param syntax - The syntax the asking rule is built over.
 * @param decl - The declaration.
 * @param result - The Stylelint result.
 * @param ruleName - The asking rule's registered name.
 * @returns True where the asking rule reads the semicolon's run.
 */
export function sharesRunWithSemicolon (syntax: Syntax, decl: Declaration, result: PostcssResult, ruleName: string): boolean {
	let asking = (Object.keys(PARTICIPANTS) as Participant[]).find((participant) => addNamespace(PARTICIPANTS[participant].name, syntax.namespace) === ruleName)

	return asking !== undefined && sharedRunsOf(syntax, decl, result).semicolon.has(asking)
}

/**
 * Asks whether an option accepts the run as it stands. The classes of `accepts` answer for every run but one holding a break, which a rule reads at its own end: the semicolon and comma newline rules take indentation behind the break, the colon and brace newline rules want the break in front of everything else, so ` \n` is a break to the ones and none to the others.
 * @param participant - The rule.
 * @param option - The rule's primary option, `always` or `never` with any line suffix.
 * @param run - The whitespace standing in the shared run before any write.
 * @param decl - The declaration.
 * @param runIsTheText - Whether the run is the whole text behind the colon.
 * @returns True where the option accepts the run.
 */
function acceptsStanding (participant: Participant, option: string, run: string, decl: Declaration, runIsTheText: boolean): boolean {
	let accepted = accepts(participant, option, decl, runIsTheText)
	let spelling = spellingOf(run)

	if (spelling !== `newline`) return accepted.includes(spelling)
	if (!accepted.includes(`newline`)) return false

	return participant === `semicolonNewline` || participant === `commaNewline` ? TRAILING_LINE_BREAK_AND_INDENTATION.test(run) : LEADING_LINE_BREAK.test(run)
}

/**
 * Counts the line breaks of a text.
 * @param text - The run or block text whose line breaks are counted.
 * @returns The count.
 */
function breaksOf (text: string): number {
	return text.match(EVERY_LINE_BREAK)?.length ?? 0
}

/**
 * Reads a run's spelling. Two spaces or a tab is `other`, the single space being the one breakless run an option accepts; read as a space it held a deferred rule on a second warning ([#627](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/627)).
 * @param run - The whitespace standing in the shared run before any write.
 * @returns Its spelling.
 */
function spellingOf (run: string): Run {
	if (run === ``) return `none`
	if (breaksOf(run) > 0) return `newline`

	return run === ` ` ? `space` : `other`
}

/**
 * Asks whether the asking rule is the one to write a run more than one of the eight reads: the head run, the run behind a comment on the colon's line in front of a comma opening the value, the semicolon's run or the brace's.
 *
 * On a whitespace-only value the run behind the colon is the one in front of the semicolon; the colon rules write `raws.between` and the semicolon rules the value, so a pair took it in turns across runs of `--fix` ([#416](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/416)).
 *
 * A rule writes only where every rule behind it (in `neighborSettings` order) that speaks with its fix on accepts a spelling it accepts too or is silenced by the write; otherwise it reports and leaves the run. It also needs each rule ahead of it in run order — a deferred rule waits behind every undeferred one ([#355](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/355)) — to accept what the write leaves, to have warned, or to be silenced; a turned-off fix exempts nothing there.
 *
 * A `-single-line` or `-multi-line` option speaks as its rule judges over the text as it sees it: a colon rule's break stays in `raws.between` within the pass and reaches the value on the reparsed run after; a comma rule reads the whole declaration, `raws.between` included, so a break written into the head run is its line at once.
 *
 * The readers asked are those of the run as the write leaves it, since a write can move a block comment onto the colon's line ([#400](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/400), [#590](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/590)).
 * @param syntax - The syntax the asking rule is built over.
 * @param decl - The declaration.
 * @param result - The Stylelint result, which holds the configuration.
 * @param ruleName - The asking rule's registered name.
 * @returns True where the asking rule writes the run.
 */
export function writesSharedRun (syntax: Syntax, decl: Declaration, result: PostcssResult, ruleName: string): boolean {
	let asking = (Object.keys(PARTICIPANTS) as Participant[]).find((participant) => addNamespace(PARTICIPANTS[participant].name, syntax.namespace) === ruleName)

	if (!asking) return true

	let { head, tail, tailRun, semicolon, semicolonRun, brace, braceRun, commentBehindHead, runIsTheText } = sharedRunsOf(syntax, decl, result)
	// The semicolon's and the brace's groups hold a colon rule only where the head run reaches it, so either is the head's readers too; the tail's group stands where the head's is empty
	let groups: [Set<Participant>, string][] = [[semicolon, semicolonRun], [brace, braceRun], [tail, tailRun], [head, semicolonRun]]
	let [readers, run] = groups.find(([group]) => group.has(asking)) ?? [head, semicolonRun]

	if (!readers.has(asking)) return true

	let settings = neighborSettings(decl, result, PARTICIPANTS)
	let position = settings.findIndex(([, , , name]) => name === ruleName)

	if (position === -1) return true

	let { parent } = decl

	if (!parent) throw new Error(`A parent node must be present`)

	// The narrowing does not reach into the function below
	let block = parent
	let breaksOutsideTheRun: number | undefined
	let breaksInTheDeclarationOutsideTheRun: number | undefined
	// The comma newline rule breaks the value in front of every other comma of the list in the same pass, so a deferred colon rule reads a multi-line value behind it whatever the head run holds (1789594574); read once the asker is known
	let askerBreaksTheList = false

	// The head group's run: `raws.between`'s tail, the run a custom property's value opens with, and the run that ran past the declaration (#387)
	let standingRun = readers === head ? betweenTailAfterColon(syntax, decl, result) + (valueAsClosed(syntax, decl, result).match(LEADING_CSS_WHITESPACE) as RegExpMatchArray)[0] + (runPastDeclaration(syntax, decl, result) ?? ``) : run

	/**
	 * What an option writes; the space a semicolon rule's `never` leaves on a custom property is nothing here, holding no break.
	 * @param participant - The rule.
	 * @param option - The rule's primary option, `always` or `never` with any line suffix.
	 * @returns The written spelling.
	 */
	function writtenBy (participant: Participant, option: string): Run {
		return option.startsWith(`always`) ? PARTICIPANTS[participant].writes : `none`
	}

	/**
	 * Asks whether an option speaks of the declaration once `written` stands over the shared run.
	 *
	 * A semicolon or brace rule counts the block's lines. A comma rule counts the declaration's, the head run written over. A colon rule counts the value's lines as spelled, with the breaks a comma newline asker writes in front of the list's other commas, and with the tail run behind a comment on the colon's line as written ([#389](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/389)) less the shared run wherever the parser keeps it in the value (a custom property's semicolon run, a wordless value's head run unless it is also an ordinary property's trailing run), plus a written break once it reaches the value; the brace's run is never a line of the declaration ([#689](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/689)).
	 * @param participant - The rule.
	 * @param option - The rule's primary option, `always` or `never` with any line suffix.
	 * @param written - The run written over the shared one.
	 * @param breakReachesValue - Whether a written break is in the value as the option reads it: within the pass a semicolon rule's only, on the run after any rule's.
	 * @returns True where the option speaks.
	 */
	function speaksAfter (participant: Participant, option: string, written: Run, breakReachesValue: boolean): boolean {
		return speaksOf(option, () => {
			if (FROM_THE_STATEMENT.has(participant)) {
				if (written === `newline`) return false

				breaksOutsideTheRun ??= breaksOf(blockString(block, result)) - breaksOf(run)

				return breaksOutsideTheRun === 0
			}

			if (FROM_THE_COMMA.has(participant)) {
				if (written === `newline`) return false

				breaksInTheDeclarationOutsideTheRun ??= breaksOf(declarationString(syntax, decl)) - breaksOf(standingRun)

				return breaksInTheDeclarationOutsideTheRun === 0
			}

			let value = declarationValueAsSpelled(syntax, decl, result)

			// The tail run behind a comment on the colon's line is in the value as spelled, comment and all, so its breaks are the standing run's, and the written run stands in their place at once (1790072055)
			if (readers === tail) return breaksOf(value) - breaksOf(run) + (written === `newline` ? 1 : 0) === 0 && !askerBreaksTheList

			let fromTheSemicolon = readers === semicolon
			let counted = fromTheSemicolon ? (isCustomProperty(decl.prop) ? value.replace(TRAILING_CSS_WHITESPACE, ``) : value) : value.replace(LEADING_CSS_WHITESPACE, ``)
			// A wordless value keeps the head run, save an ordinary property's that is the trailing run too; `decl.value` drops comments, so it is whitespace-only there
			let runInValue = fromTheSemicolon ? isCustomProperty(decl.prop) : readers !== brace && WHITESPACE_OR_NOTHING.test(decl.value) && (isCustomProperty(decl.prop) || counted !== ``)

			return isSingleLineString(counted) && !askerBreaksTheList && !(written === `newline` && breakReachesValue && runInValue)
		})
	}

	let [participant, option] = settings[position] as [Participant, string, boolean, string]
	let writes = writtenBy(participant, option)

	askerBreaksTheList = participant === `commaNewline` && option.startsWith(`always`) && listHasAnotherComma(syntax, decl, result)
	let accepted = accepts(participant, option, decl, runIsTheText)
	let asksFromTheSemicolon = FROM_THE_SEMICOLON.includes(participant)
	// A space or nothing written over a head run with a block comment behind puts the comment on the colon's line, moving the newline rule behind it (#590)
	let readersAfterTheWrite = readers === head && writes !== `newline` && commentBehindHead ? new Set([...head].filter((reader) => reader !== `colonNewline`)) : readers

	let restsBehind = settings.slice(position + 1).every(([behind, behindOption, behindFixTurnedOff]) => {
		// A turned-off fix rewrites nothing, so it gates nothing; deferring to it left the run unwritten with two warnings (#485)
		if (behindFixTurnedOff || !readersAfterTheWrite.has(behind) || !speaksAfter(behind, behindOption, writes, asksFromTheSemicolon)) return true

		let behindAccepts = accepts(behind, behindOption, decl, runIsTheText)

		return accepted.some((candidate) => behindAccepts.includes(candidate)) || !speaksAfter(participant, option, writtenBy(behind, behindOption), true)
	})

	let standing = spellingOf(standingRun)

	// Every rule ahead in run order judged the run before the write, deferred or not, so it gates the write unless it accepts what the write leaves, has warned already, or is silenced; a rejected write is a silent violation rewritten next run (#416)
	let restsAhead = settings.slice(0, position).every(([ahead, aheadOption]) => {
		if (!readersAfterTheWrite.has(ahead)) return true

		let aheadAccepts = accepts(ahead, aheadOption, decl, runIsTheText)

		if (speaksAfter(ahead, aheadOption, standing, true) && !acceptsStanding(ahead, aheadOption, standingRun, decl, runIsTheText)) return true

		if (!speaksAfter(ahead, aheadOption, writes, true)) return true

		return aheadAccepts.includes(writes)
	})

	return restsBehind && restsAhead
}
