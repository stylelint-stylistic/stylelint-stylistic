import type { Declaration } from "postcss"
import styleSearch from "style-search"
import type { PostcssResult } from "stylelint"

import { EVERY_LINE_BREAK, OPENS_WITH_BLOCK_COMMENT, WHITESPACE_OR_NOTHING } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { addNamespace } from "../addNamespace/index.ts"
import { blockString } from "../blockString/index.ts"
import { isCustomProperty } from "../isCustomProperty/index.ts"
import { isInlineStyleAttribute } from "../isInlineStyleAttribute/index.ts"
import { isLastDeclarationWithoutSemicolon } from "../isLastDeclarationWithoutSemicolon/index.ts"
import { isSingleLineString } from "../isSingleLineString/index.ts"
import { type NeighbourRule, neighbourSettings, speaksOf } from "../neighbourSettings/index.ts"
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

/**
 * Finds the run behind a declaration's colon that is also the run in front of its semicolon, and the rules reading it.
 *
 * Where the value has a word of its own, the two runs are two: one ends at the word and the other begins behind it. Where it has none, the text behind the colon down to the end of the value is whitespace, and the one run is what both `declaration-colon-space-after` and `declaration-colon-newline-after` read behind the colon and what the two `declaration-block-semicolon-*-before` rules read in front of the semicolon. `declaration-colon-newline-after` reads one shape more: behind a block comment standing on the colon's own line it asks about the run behind that comment, and where nothing but whitespace follows it, that run is the semicolon's too. A flag parts the runs whatever the value holds, since the semicolon's run is then the end of the flag's raw. And a declaration one side passes over shares its run with nobody, whatever the value holds: the colon rules read the declarations of standard CSS alone, and the semicolon rules pass over the last of a block where the file writes no semicolon behind it and over one standing outside a block and an inline style attribute.
 * @param syntax - The syntax the rule is built over.
 * @param decl - The declaration.
 * @returns The run and the participants reading it, or no participants where the declaration has no such run.
 */
function sharedRunOf (syntax: Syntax, decl: Declaration): {
	run: string,
	readers: Set<Participant>,
} {
	let readers = new Set<Participant>()
	let run = ``
	let { parent } = decl

	if (decl.important || !syntax.isStandardDeclaration(decl)) return { run, readers }
	if (!parent || !(isAtRule(parent) || isRule(parent) || isInlineStyleAttribute(parent)) || isLastDeclarationWithoutSemicolon(decl)) return { run, readers }

	let between = decl.raws.between ?? ``
	let colonIndex = -1

	// The declaration's own colon is the first one standing outside a comment, as `declarationColonSpaceChecker` finds it
	styleSearch({ source: between, target: `:`, once: true }, ({ startIndex }) => {
		colonIndex = startIndex
	})

	if (colonIndex === -1) return { run, readers }

	let text = between.slice(colonIndex + 1) + syntax.read(decl)

	if (WHITESPACE_OR_NOTHING.test(text)) {
		run = text
		readers.add(`colonSpace`)
		readers.add(`colonNewline`)
	}
	else if (OPENS_WITH_BLOCK_COMMENT.test(text)) {
		// A comment closes at the first `*/` behind its own opening, as the rule finds it
		let commentEnd = text.indexOf(`*/`, text.indexOf(`/*`) + 2)

		if (commentEnd !== -1 && WHITESPACE_OR_NOTHING.test(text.slice(commentEnd + 2))) {
			run = text.slice(commentEnd + 2)
			readers.add(`colonNewline`)
		}
	}

	if (readers.size > 0) for (let participant of FROM_THE_SEMICOLON) readers.add(participant)

	return { run, readers }
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
 * What a rule writes is what the file is left with only where no rule listed behind it writes otherwise, since those run after it and rewrite what they are not content with. So a rule writes the run only where every rule listed behind it that speaks of the declaration either shares with it a spelling of the run both are content with, or writes what silences it; otherwise it reports the run and leaves it alone, so the file rests on what the rules behind it write and the warning of the rule the configuration contradicted stands. The rules ahead of it need no asking: every option is content with one spelling of the run, save the `never` options that leave a single space alone and are content with two, so wherever two acceptances meet there is a spelling both are content with, and the file comes to rest on it within a run of the fixer after the last write — the rule writing last either writes that spelling or is content with it once the rule ahead has written it back. The settings are read through `neighbourSettings`, under the names of the asking rule's namespace and in the order the run makes them.
 *
 * Whether a `-single-line` or `-multi-line` option speaks of the declaration is decided the way each rule decides it — over the declaration's own value for the colon rules, over the block for the semicolon rules — and as either text will stand when the option reads it. The rules behind are asked about the text as the asking rule's write leaves it within the pass, since that is what they run over: a break written anywhere into a block on one line is what wakes `never-multi-line` up, while the value of a custom property gains a break only from a semicolon rule, which writes into the value itself — one a colon rule writes stands in `raws.between` until the file is parsed again, so the other colon rule still reads the value as it was and acts on it. And the asking rule is asked about the text as a rule behind it leaves it for the run after, when the file has been parsed again and a break stands in the value whichever rule wrote it: where that write is what silences it — a break written into the block a `-single-line` option speaks of, or into the value of a custom property one reads — what it writes costs the file nothing, and it writes as it always did.
 * @param syntax - The syntax the asking rule is built over.
 * @param decl - The declaration.
 * @param result - The Stylelint result, which holds the configuration.
 * @param ruleName - The name the asking rule is registered under.
 * @returns True where the asking rule writes the run: it reads no shared run of this declaration, or every rule behind it is content with a spelling it is content with too, or silences it.
 */
export function writesSharedRun (syntax: Syntax, decl: Declaration, result: PostcssResult, ruleName: string): boolean {
	let asking = (Object.keys(PARTICIPANTS) as Participant[]).find((participant) => addNamespace(PARTICIPANTS[participant].name, syntax.namespace) === ruleName)

	if (!asking) return true

	let { run, readers } = sharedRunOf(syntax, decl)

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

	let [participant, option] = settings[position] as [Participant, string]
	let writes = writtenBy(participant, option)
	let accepted = accepts(participant, option, decl)
	let asksFromTheSemicolon = FROM_THE_SEMICOLON.includes(participant)

	return settings.slice(position + 1).every(([behind, behindOption]) => {
		if (!readers.has(behind) || !speaksAfter(behind, behindOption, writes, asksFromTheSemicolon)) return true

		let behindAccepts = accepts(behind, behindOption, decl)

		return accepted.some((candidate) => behindAccepts.includes(candidate)) || !speaksAfter(participant, option, writtenBy(behind, behindOption), true)
	})
}
