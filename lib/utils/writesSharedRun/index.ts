import type { Declaration } from "postcss"
import type { PostcssResult } from "stylelint"

import { EVERY_LINE_BREAK, LEADING_CSS_WHITESPACE, OPENS_WITH_BLOCK_COMMENT, TRAILING_CSS_WHITESPACE, WHITESPACE_OR_NOTHING } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { addNamespace } from "../addNamespace/index.ts"
import { betweenTailAfterColon } from "../betweenTailAfterColon/index.ts"
import { blockString } from "../blockString/index.ts"
import { closedBySemicolon, valueAsClosed } from "../closedBySemicolon/index.ts"
import { colonIndexInBetween } from "../colonIndexInBetween/index.ts"
import { declarationValueAsSpelled } from "../declarationValueAsSpelled/index.ts"
import { defersToRunEnd } from "../defersToRunEnd/index.ts"
import { isCustomProperty } from "../isCustomProperty/index.ts"
import { isInlineStyleAttribute } from "../isInlineStyleAttribute/index.ts"
import { isSingleLineString } from "../isSingleLineString/index.ts"
import { type NeighbourRule, neighbourSettings, speaksOf } from "../neighbourSettings/index.ts"
import { runInDeclarationEndsTheStylesheet } from "../runInDeclarationEndsTheStylesheet/index.ts"
import { runPastDeclaration } from "../runPastDeclaration/index.ts"
import { isAtRule, isRule } from "../typeGuards/index.ts"

/** The four rules that read a shared run: two from the colon, two from the semicolon. */
type Participant = `colonSpace` | `colonNewline` | `semicolonSpace` | `semicolonNewline`

/** `other` (two spaces, a tab) is a spelling no option writes or accepts, so every option reports it ([#627](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/627)). */
type Run = `space` | `newline` | `none` | `other`

/** The four rules and the whitespace their `always` options write. */
const PARTICIPANTS: Record<Participant, NeighbourRule & { writes: Run }> = {
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
}

/** The semicolon rules read every shared run. */
const FROM_THE_SEMICOLON: Participant[] = [`semicolonSpace`, `semicolonNewline`]

/** The two runs and their readers; under two names a set settles nothing. `runIsTheText`: the semicolon's run is the whole text behind the colon ([#50](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/50)). */
type SharedRuns = {
	head: Set<Participant>,
	semicolon: Set<Participant>,
	semicolonRun: string,
	commentBehindHead: boolean,
	runIsTheText: boolean,
}

/**
 * Finds the runs of a declaration more than one rule reads, and their readers.
 *
 * Both colon rules read the head run, except that the newline rule reads past a block comment on the colon and the space rule passes over a run the stylesheet ends on ([#546](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/546)). `commentBehindHead`: a block comment behind the head run, which a space or nothing written there puts on the colon's line ([#590](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/590)).
 *
 * The semicolon rules read the semicolon's run, both colon rules too on a whitespace-only text, the newline rule on whitespace alone behind a block comment. A flag, a missing semicolon, or a parent the semicolon rules do not read (the root, unless an inline style attribute) empties that set.
 * @param syntax - The syntax the declaration is read under.
 * @param decl - The declaration.
 * @param result - The Stylelint result.
 * @returns The runs and their readers.
 */
function sharedRunsOf (syntax: Syntax, decl: Declaration, result: PostcssResult): SharedRuns {
	let runs: SharedRuns = { head: new Set(), semicolon: new Set(), semicolonRun: ``, commentBehindHead: false, runIsTheText: false }

	if (!syntax.isStandardDeclaration(decl)) return runs

	let between = decl.raws.between ?? ``
	let colonIndex = colonIndexInBetween(syntax, decl, result)

	if (colonIndex === -1) return runs

	let { parent } = decl
	// Read as `declaration-block-trailing-semicolon` will leave them (#536)
	let readBySemicolonRules = !decl.important && parent !== undefined && (isAtRule(parent) || isRule(parent) || isInlineStyleAttribute(parent)) && closedBySemicolon(syntax, decl, result)
	let text = between.slice(colonIndex + 1) + valueAsClosed(syntax, decl, result)

	if (WHITESPACE_OR_NOTHING.test(text)) {
		// Not the space rule's where the stylesheet ends on it (#546), or it would gate an `always` neighbour for good; a run that left the declaration is neither rule's (#537)
		if (!runInDeclarationEndsTheStylesheet(syntax, decl, result)) runs.head.add(`colonSpace`)

		runs.head.add(`colonNewline`)

		if (readBySemicolonRules) {
			runs.semicolonRun = text
			runs.runIsTheText = true
			for (let participant of [`colonSpace`, `colonNewline`, ...FROM_THE_SEMICOLON] as Participant[]) runs.semicolon.add(participant)
		}

		return runs
	}

	if (OPENS_WITH_BLOCK_COMMENT.test(text)) {
		// The parser returns no unclosed comment; behind one both colon rules would read the head run
		let commentEnd = text.indexOf(`*/`, text.indexOf(`/*`) + 2)

		if (commentEnd !== -1) {
			let tail = text.slice(commentEnd + 2)

			if (WHITESPACE_OR_NOTHING.test(tail) && readBySemicolonRules) {
				runs.semicolonRun = tail
				for (let participant of [`colonNewline`, ...FROM_THE_SEMICOLON] as Participant[]) runs.semicolon.add(participant)
			}

			return runs
		}
	}

	// A space rule's write puts this on the colon's line, where a closed block comment moves the newline rule behind it
	let behindHead = text.replace(LEADING_CSS_WHITESPACE, ``)

	runs.commentBehindHead = OPENS_WITH_BLOCK_COMMENT.test(behindHead) && behindHead.indexOf(`*/`, behindHead.indexOf(`/*`) + 2) !== -1
	runs.head.add(`colonSpace`).add(`colonNewline`)

	return runs
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
 * Asks whether the asking rule is the one to write a run more than one of the four reads.
 *
 * On a whitespace-only value the run behind the colon is the one in front of the semicolon; the colon rules write `raws.between` and the semicolon rules the value, so a pair took it in turns across runs of `--fix` ([#416](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/416)).
 *
 * A rule writes only where every rule behind it (in `neighbourSettings` order) that speaks with its fix on accepts a spelling it accepts too or is silenced by the write; otherwise it reports and leaves the run. A rule deferred to the run's end ([#355](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/355)) also needs each rule ahead to accept what the write leaves, to have warned, or to be silenced; a turned-off fix exempts nothing there.
 *
 * A `-single-line` or `-multi-line` option speaks as its rule judges over the text as it sees it: a colon rule's break stays in `raws.between` within the pass and reaches the value on the reparsed run after.
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

	let { head, semicolon, semicolonRun, commentBehindHead, runIsTheText } = sharedRunsOf(syntax, decl, result)
	// The semicolon's group holds a colon rule only where the head run reaches it, so it is the head's readers too
	let readers = semicolon.has(asking) ? semicolon : head
	let run = semicolonRun

	if (!readers.has(asking)) return true

	let settings = neighbourSettings(syntax, result, PARTICIPANTS)
	let position = settings.findIndex(([participant]) => participant === asking)

	if (position === -1) return true

	let { parent } = decl

	if (!parent) throw new Error(`A parent node must be present`)

	// The narrowing does not reach into the function below
	let block = parent
	let breaksOutsideTheRun: number | undefined

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
	 * A semicolon rule counts the block's lines. A colon rule counts the value's lines as spelled ([#389](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/389)) less the shared run wherever the parser keeps it in the value (a custom property's semicolon run, a wordless value's head run unless it is also an ordinary property's trailing run), plus a written break once it reaches the value.
	 * @param participant - The rule.
	 * @param option - The rule's primary option, `always` or `never` with any line suffix.
	 * @param written - The run written over the shared one.
	 * @param breakReachesValue - Whether a written break is in the value as the option reads it: within the pass a semicolon rule's only, on the run after any rule's.
	 * @returns True where the option speaks.
	 */
	function speaksAfter (participant: Participant, option: string, written: Run, breakReachesValue: boolean): boolean {
		return speaksOf(option, () => {
			if (FROM_THE_SEMICOLON.includes(participant)) {
				if (written === `newline`) return false

				breaksOutsideTheRun ??= breaksOf(blockString(block, result)) - breaksOf(run)

				return breaksOutsideTheRun === 0
			}

			let value = declarationValueAsSpelled(syntax, decl, result)
			let fromTheSemicolon = readers === semicolon
			let counted = fromTheSemicolon ? (isCustomProperty(decl.prop) ? value.replace(TRAILING_CSS_WHITESPACE, ``) : value) : value.replace(LEADING_CSS_WHITESPACE, ``)
			// A wordless value keeps the head run, save an ordinary property's that is the trailing run too; `decl.value` drops comments, so it is whitespace-only there
			let runInValue = fromTheSemicolon ? isCustomProperty(decl.prop) : WHITESPACE_OR_NOTHING.test(decl.value) && (isCustomProperty(decl.prop) || counted !== ``)

			return isSingleLineString(counted) && !(written === `newline` && breakReachesValue && runInValue)
		})
	}

	let [participant, option] = settings[position] as [Participant, string, boolean]
	let writes = writtenBy(participant, option)
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

	// The head group's run: `raws.between`'s tail, the run a custom property's value opens with, and the run that ran past the declaration (#387)
	let standingRun = readers === semicolon ? run : betweenTailAfterColon(syntax, decl, result) + (valueAsClosed(syntax, decl, result).match(LEADING_CSS_WHITESPACE) as RegExpMatchArray)[0] + (runPastDeclaration(syntax, decl, result) ?? ``)
	let standing = spellingOf(standingRun)

	// A rule ahead judged the run before the write (#355), so it gates the write unless it accepts what the write leaves, has warned already, or is silenced; a rejected write is a silent violation rewritten next run (#416)
	let restsAhead = !defersToRunEnd(option) || settings.slice(0, position).every(([ahead, aheadOption]) => {
		if (!readersAfterTheWrite.has(ahead)) return true

		let aheadAccepts = accepts(ahead, aheadOption, decl, runIsTheText)

		if (speaksAfter(ahead, aheadOption, standing, true) && !aheadAccepts.includes(standing)) return true

		if (!speaksAfter(ahead, aheadOption, writes, true)) return true

		return aheadAccepts.includes(writes)
	})

	return restsBehind && restsAhead
}
