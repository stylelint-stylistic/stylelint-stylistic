import type { Declaration } from "postcss"
import type { PostcssResult } from "stylelint"

import { EVERY_LINE_BREAK, LEADING_CSS_WHITESPACE, OPENS_WITH_BLOCK_COMMENT, WHITESPACE_OR_NOTHING } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { addNamespace } from "../addNamespace/index.ts"
import { betweenTailAfterColon } from "../betweenTailAfterColon/index.ts"
import { blockString } from "../blockString/index.ts"
import { colonIndexInBetween } from "../colonIndexInBetween/index.ts"
import { defersToRunEnd } from "../defersToRunEnd/index.ts"
import { isCustomProperty } from "../isCustomProperty/index.ts"
import { isInlineStyleAttribute } from "../isInlineStyleAttribute/index.ts"
import { isLastNodeWithoutSemicolon } from "../isLastNodeWithoutSemicolon/index.ts"
import { isSingleLineString } from "../isSingleLineString/index.ts"
import { type NeighbourRule, neighbourSettings, speaksOf } from "../neighbourSettings/index.ts"
import { runPastDeclaration } from "../runPastDeclaration/index.ts"
import { isAtRule, isRule } from "../typeGuards/index.ts"

/** The rules a shared run is asked about: two reading it from the colon, two from the semicolon. */
type Participant = `colonSpace` | `colonNewline` | `semicolonSpace` | `semicolonNewline`

/** What a run of whitespace may be to one of those rules: a single space, a line break at the rule's end of it, or nothing at all. */
type Run = `space` | `newline` | `none`

/** The four rules, each with the whitespace its `always` options ask for. */
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

/** The two rules reading the run from the semicolon, which every shared run is read by. */
const FROM_THE_SEMICOLON: Participant[] = [`semicolonSpace`, `semicolonNewline`]

/** The runs of one declaration that more than one rule reads, each with the rules reading it: the run at the head of the text behind the colon, and the run in front of the semicolon. A set stands empty where no two rules share that run. */
type SharedRuns = {
	head: Set<Participant>,
	semicolon: Set<Participant>,
	semicolonRun: string,
}

/**
 * Finds the runs of a declaration that more than one rule is asked about, and the rules reading each.
 *
 * The run at the head of the text behind the colon is read by both `declaration-colon-space-after` and `declaration-colon-newline-after` on every standard declaration — a word, a flag or an inline comment further along parts them from the semicolon's run, never from each other's — save one shape: behind a block comment standing right on the colon, the newline rule asks about the run behind that comment instead, and the head run is the space rule's alone.
 *
 * The run in front of the semicolon is the two `declaration-block-semicolon-*-before` rules', and the colon rules join them only where their own run reaches it: where the text behind the colon down to the end of the printed value is nothing but whitespace, the one run is every one of the four's; where it is a block comment with nothing but whitespace behind, that tail is the newline rule's and the semicolon rules'. A flag parts the runs whatever the value holds, since the semicolon's run is then the end of the flag's raw; and a declaration the semicolon rules pass over — the last of its block where the file writes no semicolon behind it, or one standing outside a block and an inline style attribute — keeps its semicolon run to itself, whatever the value holds.
 * @param syntax - The syntax the rule is built over.
 * @param decl - The declaration.
 * @param result - The Stylelint result, which holds the syntax the file was opened with.
 * @returns The two runs with their readers.
 */
function sharedRunsOf (syntax: Syntax, decl: Declaration, result: PostcssResult): SharedRuns {
	let runs: SharedRuns = { head: new Set(), semicolon: new Set(), semicolonRun: `` }

	if (!syntax.isStandardDeclaration(decl)) return runs

	let between = decl.raws.between ?? ``
	let colonIndex = colonIndexInBetween(syntax, decl, result)

	if (colonIndex === -1) return runs

	let { parent } = decl
	let readBySemicolonRules = !decl.important && parent !== undefined && (isAtRule(parent) || isRule(parent) || isInlineStyleAttribute(parent)) && !isLastNodeWithoutSemicolon(decl)
	let text = between.slice(colonIndex + 1) + syntax.read(decl)

	if (WHITESPACE_OR_NOTHING.test(text)) {
		runs.head.add(`colonSpace`).add(`colonNewline`)

		if (readBySemicolonRules) {
			runs.semicolonRun = text
			for (let participant of [`colonSpace`, `colonNewline`, ...FROM_THE_SEMICOLON] as Participant[]) runs.semicolon.add(participant)
		}

		return runs
	}

	if (OPENS_WITH_BLOCK_COMMENT.test(text)) {
		// A comment closes at the first `*/` behind its own opening, as the newline rule finds it; one that never closes is no shape the parser hands over, and the rule then reads the head run like its neighbour
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

	runs.head.add(`colonSpace`).add(`colonNewline`)

	return runs
}

/**
 * Tells what a rule's option accepts of a shared run.
 *
 * An `always` option accepts the whitespace the rule writes and nothing else. A `never` option accepts nothing at all — save where the rule leaves a single space alone (#50): `declaration-block-semicolon-newline-before` does so on every declaration, `declaration-block-semicolon-space-before` on a custom property, and on such a declaration `none` and `space` both answer them.
 * @param participant - The rule.
 * @param option - Its primary option.
 * @param decl - The declaration whose run is asked about.
 * @returns What the option accepts.
 */
function accepts (participant: Participant, option: string, decl: Declaration): Run[] {
	if (option.startsWith(`always`)) return [PARTICIPANTS[participant].writes]
	if (participant === `semicolonNewline` || (participant === `semicolonSpace` && isCustomProperty(decl.prop))) return [`none`, `space`]

	return [`none`]
}

/**
 * Asks whether the run a rule reads of this declaration is the run in front of its semicolon.
 *
 * A rule that writes into a shared run answers to the semicolon's side of it as much as to its own, and this is the question it asks before finishing the run for the neighbour — `sharedRunsOf` above holds what counts as shared and for whom, and the head run the two colon rules share between themselves does not answer it.
 * @param syntax - The syntax the asking rule is built over.
 * @param decl - The declaration.
 * @param result - The Stylelint result, which holds the syntax the file was opened with.
 * @param ruleName - The name the asking rule is registered under.
 * @returns True where the asking rule is one of the four and its run is the semicolon's too.
 */
export function sharesRunWithSemicolon (syntax: Syntax, decl: Declaration, result: PostcssResult, ruleName: string): boolean {
	let asking = (Object.keys(PARTICIPANTS) as Participant[]).find((participant) => addNamespace(PARTICIPANTS[participant].name, syntax.namespace) === ruleName)

	return asking !== undefined && sharedRunsOf(syntax, decl, result).semicolon.has(asking)
}

/**
 * Counts the line breaks of a text.
 * @param text - The text.
 * @returns How many breaks it holds.
 */
function breaksOf (text: string): number {
	return text.match(EVERY_LINE_BREAK)?.length ?? 0
}

/**
 * Asks whether a rule about the whitespace behind a declaration's colon, or about the whitespace in front of its semicolon, is one to write that whitespace where the two are one and the same run.
 *
 * Where a declaration's value is nothing but whitespace, the run behind the colon is the run in front of the semicolon, and one character cannot answer to two options. Stylelint runs each rule once and in the order the configuration lists them, and the colon rules write into `raws.between` while the semicolon rules read the value, so a pair asked for two different things used to take the run in turns: on one run of `--fix` the semicolon rule took it away, on the next the colon rule put it back where the semicolon rule could not see it, and the file never came to rest (#416).
 *
 * What a rule writes is what the file is left with only where no rule listed behind it writes otherwise, since those run after it and rewrite what they are not content with. So a rule writes the run only where every rule listed behind it that speaks of the declaration and has its fix to write with either shares with it a spelling of the run both are content with, or writes what silences it — one whose fix the configuration turned off rewrites nothing and gates nothing, reporting whatever the run comes to; otherwise it reports the run and leaves it alone, so the file rests on what the rules behind it write and the warning of the rule the configuration contradicted stands. The rules ahead of a rule taking its turn where the configuration lists it need no asking: a rule ahead that was discontent has written its spelling or warned, and the asking rule either writes a spelling both are content with or is rewritten the run after. A rule whose check waits for the run's end (#355) runs after every rule ahead of it as well, and those have had their say already — so it also writes only where each of them accepts what the write leaves, freed by one that has warned already, whose warning stands over whatever the write makes, and by one the write itself silences; a turned-off fix exempts nothing there, since a rule that was silently content stays silently violated. The settings are read through `neighbourSettings`, under the names of the asking rule's namespace and in the order the run makes them.
 *
 * Whether a `-single-line` or `-multi-line` option speaks of the declaration is decided the way each rule decides it — over the declaration's own value for the colon rules, over the block for the semicolon rules — and as either text will stand when the option reads it. The rules behind are asked about the text as the asking rule's write leaves it within the pass, since that is what they run over: a break written anywhere into a block on one line is what wakes `never-multi-line` up, while the value of a custom property gains a break only from a semicolon rule, which writes into the value itself — one a colon rule writes stands in `raws.between` until the file is parsed again, so the other colon rule still reads the value as it was and acts on it. And the asking rule is asked about the text as a rule behind it leaves it for the run after, when the file has been parsed again and a break stands in the value whichever rule wrote it: where that write is what silences it — a break written into the block a `-single-line` option speaks of, or into the value of a custom property one reads — what it writes costs the file nothing, and it writes as it always did.
 * @param syntax - The syntax the asking rule is built over.
 * @param decl - The declaration.
 * @param result - The Stylelint result, which holds the configuration.
 * @param ruleName - The name the asking rule is registered under.
 * @returns True where the asking rule writes the run: it reads no shared run of this declaration, or every rule behind it is content with a spelling it is content with too or silences it — and, where its check waits for the run's end, every rule ahead accepts what the write leaves, has warned already, or is silenced by it.
 */
export function writesSharedRun (syntax: Syntax, decl: Declaration, result: PostcssResult, ruleName: string): boolean {
	let asking = (Object.keys(PARTICIPANTS) as Participant[]).find((participant) => addNamespace(PARTICIPANTS[participant].name, syntax.namespace) === ruleName)

	if (!asking) return true

	let { head, semicolon, semicolonRun } = sharedRunsOf(syntax, decl, result)
	// The semicolon's group holds the colon rules only where the head run reaches the semicolon, so wherever the asking rule stands in it, that group is the head's readers too
	let readers = semicolon.has(asking) ? semicolon : head
	let run = semicolonRun

	if (!readers.has(asking)) return true

	let settings = neighbourSettings(syntax, result, PARTICIPANTS)
	let position = settings.findIndex(([participant]) => participant === asking)

	if (position === -1) return true

	let { parent } = decl

	if (!parent) throw new Error(`A parent node must be present`)

	// Held under a name of its own, since the narrowing above does not reach into the function below
	let block = parent
	let breaksOutsideTheRun: number | undefined

	/**
	 * Tells what a participant's option writes over the run: the whitespace of its `always` options, and nothing under a `never` one — or the single space a `never` option of a semicolon rule writes over a custom property's run of spaces and tabs, which is one and the same to `speaksAfter`, since neither holds a break.
	 * @param participant - The rule.
	 * @param option - Its primary option.
	 * @returns What it writes.
	 */
	function writtenBy (participant: Participant, option: string): Run {
		return option.startsWith(`always`) ? PARTICIPANTS[participant].writes : `none`
	}

	/**
	 * Asks whether a participant's option speaks of the declaration once a run has been written over the shared one.
	 *
	 * A semicolon rule counts the lines of the block, which a written break puts over several wherever it lands, and which otherwise stands on one line where it holds no break outside the run. A colon rule counts the lines of the declaration's own value: on a custom property that is the run itself, so it is over several lines where a break has reached it and on one otherwise — and a break a colon rule writes stands in `raws.between` until the file is parsed again, so it reaches the value within the pass only from a semicolon rule, and on the run after from either; on any other property the parser keeps the value's trailing whitespace out of it, so the run is no part of what is counted and the value stands as it stands.
	 * @param participant - The rule.
	 * @param option - Its primary option.
	 * @param written - The run written over the shared one.
	 * @param breakReachesValue - Whether a written break stands in the value when the option reads it: within the pass only a semicolon rule's does, and on the run after any rule's.
	 * @returns True where the option speaks.
	 */
	function speaksAfter (participant: Participant, option: string, written: Run, breakReachesValue: boolean): boolean {
		return speaksOf(option, () => {
			if (FROM_THE_SEMICOLON.includes(participant)) {
				if (written === `newline`) return false

				breaksOutsideTheRun ??= breaksOf(blockString(block, result)) - breaksOf(run)

				return breaksOutsideTheRun === 0
			}

			return isCustomProperty(decl.prop) ? !(written === `newline` && breakReachesValue) : isSingleLineString(decl.value)
		})
	}

	let [participant, option] = settings[position] as [Participant, string, boolean]
	let writes = writtenBy(participant, option)
	let accepted = accepts(participant, option, decl)
	let asksFromTheSemicolon = FROM_THE_SEMICOLON.includes(participant)

	let restsBehind = settings.slice(position + 1).every(([behind, behindOption, behindFixTurnedOff]) => {
		// A rule whose fix the configuration turned off speaks of the run and reports it, but cannot write: it will not rewrite what the asking rule leaves, and its warning stands over a violation whichever way the run is spelled, so it gates nothing — deferring to it left the run unwritten with two warnings where the configuration asked for a report and one write (#485)
		if (behindFixTurnedOff || !readers.has(behind) || !speaksAfter(behind, behindOption, writes, asksFromTheSemicolon)) return true

		let behindAccepts = accepts(behind, behindOption, decl)

		return accepted.some((candidate) => behindAccepts.includes(candidate)) || !speaksAfter(participant, option, writtenBy(behind, behindOption), true)
	})

	// The spelling the run stands in when the asking rule takes its turn, for asking whether a rule ahead has already reported it. The run is the one the asking rule's group reads: the trailing run in front of the semicolon for the semicolon's group, and for the head group the whitespace behind the colon — what the parser trimmed onto `raws.between`, what a fix ahead wrote onto its tail, the run a custom property's value opens with, and the run that ran on past the declaration into the raw of what stands next (#387), together
	let standingRun = readers === semicolon ? run : betweenTailAfterColon(syntax, decl, result) + (syntax.read(decl).match(LEADING_CSS_WHITESPACE) as RegExpMatchArray)[0] + (runPastDeclaration(syntax, decl, result) ?? ``)
	let standing: Run = standingRun === `` ? `none` : (breaksOf(standingRun) > 0 ? `newline` : `space`)

	// A lineness-conditioned asker runs after every rule ahead of it as well (#355), and those have had their say already: a write one of them would not accept leaves the file violating a rule that reported nothing, and the next run rewriting — the swing of #416 across runs. So a rule ahead gates the write unless it accepts what the write leaves, judged over the file as it rests — reparsed, a break in the value whoever wrote it. Two things free it: a rule ahead that has warned already — it spoke of the run as it stands and did not accept it, so its warning stands over whatever the write makes and nothing is silent — and one the write itself silences. A turned-off fix exempts nothing here, unlike behind: a rule behind still speaks after the write and reports what it sees, while a rule ahead judged the run before the write and stands silent over what the write made of it
	let restsAhead = !defersToRunEnd(option) || settings.slice(0, position).every(([ahead, aheadOption]) => {
		if (!readers.has(ahead)) return true

		let aheadAccepts = accepts(ahead, aheadOption, decl)

		if (speaksAfter(ahead, aheadOption, standing, true) && !aheadAccepts.includes(standing)) return true

		if (!speaksAfter(ahead, aheadOption, writes, true)) return true

		return aheadAccepts.includes(writes)
	})

	return restsBehind && restsAhead
}
