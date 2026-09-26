import type { Container, Node } from "postcss"
import type { PostcssResult } from "stylelint"

import { ENABLE_COMMAND, EVERY_LINE_BREAK, EVERY_SEMICOLON, LEADING_CSS_WHITESPACE, LEADING_SPACES_AND_TABS, LINE_DISABLE_COMMAND, TRAILING_SPACES_AND_TABS } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { trailingSemicolonAsked } from "../closedBySemicolon/index.ts"
import { closingOffset } from "../closingOffset/index.ts"
import { extraSemicolonsAfter, extraSemicolonsBefore, extraSemicolonsOwn } from "../extraSemicolonsAfter/index.ts"
import { type DisabledRange, fixDisabledRanges } from "../fixDisabledOnLine/index.ts"
import { hasBlock } from "../hasBlock/index.ts"
import { lastNonCommentNode } from "../lastNonCommentNode/index.ts"
import { neighborCopies } from "../neighborSettings/index.ts"
import { lineInRaw, NO_EXTRA_SEMICOLONS, noExtraSemicolonsTaken, semicolonLine, takenByNoExtra } from "../noExtraSemicolonsTaken/index.ts"
import { runInFrontOf } from "../runInFrontOf/index.ts"
import { semicolonOffset } from "../semicolonOffset/index.ts"
import { semicolonsTakenAlreadyIn } from "../semicolonsTakenAlready/index.ts"
import { isAtRule, isComment, isDeclaration } from "../typeGuards/index.ts"

/**
 * Finds the stray semicolons of a block's `raws.after`, the run in front of its closing brace, that a neighbor takes out in the same run, so that a rule reading that run reads it as it will stand whichever side of the neighbor it is listed.
 *
 * Two rules take them. `declaration-block-trailing-semicolon` takes every one where it leaves no semicolon behind the node closing the block, a declaration or a bodiless at-rule, its disable comments read on the line it reports on, that of the last semicolon behind the node `no-extra-semicolons` leaves. `no-extra-semicolons` takes those {@link extraSemicolonsAfter} finds, each where no disable comment keeps its fix off the semicolon's line. A semicolon staying is a character of the run as much as its whitespace is.
 * @param statement - The node carrying the block.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns The semicolons' indices in the raw.
 */
export function straySemicolonsTaken (statement: Container, result: PostcssResult): Set<number> {
	let after = statement.raws.after
	let taken: Set<number> = new Set()

	if (typeof after !== `string` || !after.includes(`;`)) return taken

	let last = lastNonCommentNode(statement)

	// That rule reports on the last semicolon behind the node the other leaves, and a disable comment is read on that line
	if (last && (isDeclaration(last) || (isAtRule(last) && !hasBlock(last))) && trailingSemicolonAsked(last, result) === false) {
		for (let match of after.matchAll(EVERY_SEMICOLON)) taken.add(match.index)

		return taken
	}

	return noExtraSemicolonsTaken(statement, `after`, result)
}

/**
 * Returns a run with the characters at the given indices taken out.
 * @param run - The run.
 * @param taken - The indices.
 * @returns The rest.
 */
export function withoutTaken (run: string, taken: Set<number>): string {
	if (taken.size === 0) return run

	let rest = ``

	for (let index = 0; index < run.length; index += 1) if (!taken.has(index)) rest += run.charAt(index)

	return rest
}

/**
 * Writes a run as `no-extra-semicolons` leaves it, keeping the semicolons it takes out for it to take.
 *
 * The write is worked out on the run without them, so that it comes out the same whichever side of that rule this one is listed. Each stands behind as many breaks of the written whitespace as stood in front of it, as far as the whitespace holds, so that it keeps its line where the write keeps the breaks around it, and behind as many of the spaces and tabs opening that written line as stood in front of it on its own; taking them leaves the written run.
 * @param write - The write over a run.
 * @param run - The run as it stands.
 * @param taken - The indices of the semicolons the neighbor takes out.
 * @returns The run to write.
 */
export function writtenAsLeft (write: (run: string) => string, run: string, taken: Set<number>): string {
	if (taken.size === 0) return write(run)

	let written = write(withoutTaken(run, taken))
	let opening = written.match(LEADING_CSS_WHITESPACE)?.[0] ?? ``
	let breakEnds = [0, ...[...opening.matchAll(EVERY_LINE_BREAK)].map((match) => match.index + match[0].length)]
	let placed = [...taken].map((index) => {
		let place = breakEnds[Math.min((run.slice(0, index).match(EVERY_LINE_BREAK) ?? []).length, breakEnds.length - 1)] ?? 0
		// Behind the spaces and tabs that stood in front of it on its line, as far as the written line holds them, so that a rule reading the line's end in between reads them where they stand
		let inFront = (run.slice(0, index).match(TRAILING_SPACES_AND_TABS)?.[0] ?? ``).length

		return place + Math.min(inFront, (written.slice(place).match(LEADING_SPACES_AND_TABS)?.[0] ?? ``).length)
	})

	// From the end, so that each insertion leaves the places in front of it where they stand
	for (let place of placed.toSorted((a, b) => b - a)) written = `${written.slice(0, place)};${written.slice(place)}`

	return written
}

/**
 * Finds the stray semicolons of a node's `raws.before` that a neighbor takes out in the same run, so that a rule reading that run reads it as it will stand whichever side of the neighbor it is listed: `no-extra-semicolons` each where no disable comment keeps its fix off the semicolon's line, and `declaration-block-trailing-semicolon` every one in front of a comment standing behind the node closing the block, where it leaves no semicolon behind that node.
 * @param node - The node.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns The semicolons' indices in the raw.
 */
export function straySemicolonsTakenBefore (node: Node, result: PostcssResult): Set<number> {
	let before = node.raws.before

	if (typeof before !== `string` || !before.includes(`;`)) return new Set()

	let parent = node.parent as Container | undefined
	let last = parent ? lastNonCommentNode(parent) : null

	if (parent && last && isComment(node) && parent.index(node) > parent.index(last) && (isDeclaration(last) || (isAtRule(last) && !hasBlock(last))) && trailingSemicolonAsked(last, result) === false) return new Set([...before.matchAll(EVERY_SEMICOLON)].map((match) => match.index))

	return noExtraSemicolonsTaken(node, `before`, result)
}

/**
 * Writes the run in front of a node as `no-extra-semicolons` leaves it, where that rule still takes every semicolon it took once the run is written.
 *
 * The line is read where the neighbor places it ({@link semicolonLine}), which a write leaves in place. Where the file does not answer, the line is read back from the node's start by the breaks behind it, so a write taking those breaks out moves it onto the node's line, where a disable comment may keep its fix off; the semicolon then stays, and the run is written as the check reads it with the semicolon standing, as it was before the neighbor was asked.
 * @param node - The node.
 * @param write - The write over a run.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns The run to write.
 */
export function writtenAsLeftBefore (node: Node, write: (run: string) => string, result: PostcssResult): string {
	let run = runInFrontOf(node)
	let taken = straySemicolonsTakenBefore(node, result)
	let written = writtenAsLeft(write, run, taken)

	if (taken.size === 0) return written

	let { raws } = node
	let hasRaw = Object.hasOwn(raws, `before`)
	let standing = raws.before

	raws.before = written

	let stillTaken = straySemicolonsTakenBefore(node, result).size

	if (hasRaw) raws.before = standing
	else delete raws.before

	return stillTaken === taken.size ? written : write(run)
}

/** A write's change to the breaks at one place of the file: `delta` breaks added at `offset`, which stands on `line`, taken out where negative. */
export type LineEdit = {
	offset: number,
	line: number,
	delta: number,
}

/**
 * Counts the lines what stands at an offset moves by: every edit in front of it or at it, since a break a write puts at an offset goes in front of what stands there.
 * @param edits - The write's edits.
 * @param offset - The offset in the file.
 * @returns The lines, negative for a move up.
 */
function shiftAt (edits: LineEdit[], offset: number): number {
	let shift = 0

	for (let edit of edits) if (edit.offset <= offset) shift += edit.delta

	return shift
}

/**
 * Counts the lines a line moves by where only the line is known: every edit on a line in front of it.
 * @param edits - The write's edits.
 * @param line - The line.
 * @returns The lines, negative for a move up.
 */
function shiftBeforeLine (edits: LineEdit[], line: number): number {
	let shift = 0

	for (let edit of edits) if (edit.line < line) shift += edit.delta

	return shift
}

/**
 * Asks whether a `stylelint-enable` comment closes a rule's range: it names the rule, or no rule at all.
 * @param text - The comment's text.
 * @param ruleName - The rule's registered name.
 * @returns True where it does.
 */
function enables (text: string, ruleName: string): boolean {
	let command = text.match(ENABLE_COMMAND)

	if (!command) return false

	let rules = (command[1] ?? ``).split(`,`).map((rule) => rule.trim()).filter(Boolean)

	return rules.length === 0 || rules.includes(ruleName)
}

/**
 * Finds the offset of the comment closing a rule's range: Stylelint keeps the line alone, so the one `stylelint-enable` comment on it closing that rule is taken, and none where the line holds another number of them. A comment Stylelint reads inside a node's raws is not a comment node, and a range Stylelint read off merged `//` comments carries a detached copy, so both are missed and the end falls back to the lines.
 * @param root - The root the ranges were read from.
 * @param line - The range's last line.
 * @param ruleName - The rule's registered name.
 * @returns The offset, or nothing.
 */
function enablingOffset (root: Node | undefined, line: number, ruleName: string): number | undefined {
	let offsets: number[] = []

	if (root && `walkComments` in root) {
		(root as Container).walkComments((comment) => {
			let start = comment.source?.start

			if (start?.line === line && start.offset !== undefined && enables(comment.text, ruleName)) offsets.push(start.offset)
		})
	}

	return offsets.length === 1 ? offsets[0] : undefined
}

/**
 * Moves a disabled range as the write moves the comments bounding it: its start with the node Stylelint files it with, the whole of a range a `-line` or `-next-line` comment opens with that comment, its end with the comment closing it where {@link enablingOffset} finds one, the whole of a one-line range none closes with its start, and else its end by the edits on the lines in front of it, which reads an edit on the end's own line as leaving the end where it is — a range read narrower than it may be.
 * @param range - The range.
 * @param edits - The write's edits.
 * @param ruleName - The rule's registered name.
 * @returns The range as the write leaves it.
 */
function movedRange (range: DisabledRange, edits: LineEdit[], ruleName: string): { start: number, end: number | undefined } {
	let opening = range.node?.source?.start?.offset
	let start = range.start + (opening === undefined ? shiftBeforeLine(edits, range.start) : shiftAt(edits, opening))

	if (range.end === undefined) return { start, end: undefined }

	if (range.node && isComment(range.node) && LINE_DISABLE_COMMAND.test(range.node.text)) return { start, end: start }

	let closing = enablingOffset(range.node?.root(), range.end, ruleName)

	// A `-line` comment Stylelint read inside a node's raws files the range with the node; with no comment closing a one-line range, it moves whole
	if (closing === undefined && range.end === range.start) return { start, end: start }

	return { start, end: range.end + (closing === undefined ? shiftBeforeLine(edits, range.end) : shiftAt(edits, closing)) }
}

/**
 * Asks whether a range reaches a line.
 * @param range - The range.
 * @param range.start - Its first line.
 * @param range.end - Its last, nothing where it runs to the end of the file.
 * @param line - The line.
 * @returns True where it does.
 */
function reaches ({ start, end }: { start: number, end?: number | undefined }, line: number): boolean {
	return start <= line && (end === undefined || end >= line)
}

/** A raw `no-extra-semicolons` takes semicolons out of. */
type SemicolonRaw = `before` | `after` | `ownSemicolon`

/**
 * Places a raw in the file: the offset it starts at, and the line a semicolon of it stands on, read where `no-extra-semicolons` places its warning ({@link semicolonLine}) and back from the raw's end where the file does not answer. The offset counts characters back from the raw's end.
 * @param owner - The node whose `raws.before` or `raws.ownSemicolon`, or the container whose `raws.after`, it is.
 * @param key - Which of the raws.
 * @param raw - The raw.
 * @param result - The Stylelint result, which holds the file's syntax.
 * @returns The offset, and the line by index; nothing where the node has no place.
 */
function placeOf (owner: Node, key: SemicolonRaw, raw: string, result: PostcssResult): { rawStart: number | undefined, lineAt: (index: number) => number | undefined } {
	let { rawStart, lineAt } = placeByCharacters(owner, key, raw)
	let rootStart = owner.root().source?.start?.offset ?? 0
	// The nodes' offsets count from the document's start, the root's text from the root's
	let rawEnd = rawStart === undefined ? undefined : rawStart - rootStart + raw.length

	// A root's own tail ends that text
	if (owner.type === `root` && key === `after`) rawEnd = owner.source?.input.css.length

	return { rawStart, lineAt: (index) => semicolonLine(owner, key, index, rawEnd, result) ?? lineAt(index) }
}

/**
 * Places a raw in the file by characters counted back from its end: the offset it starts at, and the line a character of it stands on.
 * @param owner - The node whose `raws.before` or `raws.ownSemicolon`, or the container whose `raws.after`, it is.
 * @param key - Which of the raws.
 * @param raw - The raw.
 * @returns The offset, and the line by index; nothing where the node has no place.
 */
function placeByCharacters (owner: Node, key: SemicolonRaw, raw: string): { rawStart: number | undefined, lineAt: (index: number) => number | undefined } {
	if (key === `ownSemicolon`) {
		// PostCSS moves the rule's end behind the last semicolon it files there, so the raw ends where the node does
		let end = closingOffset(owner)

		return { rawStart: end === undefined ? undefined : end - raw.length, lineAt: (index) => lineInRaw(raw, index, owner.source?.end?.line) }
	}

	if (owner.type === `root` && key === `after`) {
		// The root's tail runs to the end of its text; a root a document holds counts its nodes from the document's start and has no place of its own here
		let text = owner.parent ? undefined : owner.source?.input.css

		if (text === undefined) return { rawStart: text, lineAt: (index) => lineInRaw(raw, index, text) }

		let start = text.length - raw.length

		return { rawStart: start, lineAt: (index) => (text.slice(0, start + index).match(EVERY_LINE_BREAK) ?? []).length + 1 }
	}

	if (key === `before`) {
		let start = owner.source?.start

		return { rawStart: start?.offset === undefined ? undefined : start.offset - raw.length, lineAt: (index) => lineInRaw(raw, index, start?.line) }
	}

	// A block's end stands behind its brace, and behind `raws.ownSemicolon` where PostCSS files one there
	let end = closingOffset(owner)
	let own = String(owner.raws.ownSemicolon ?? ``)
	let endLine = owner.source?.end?.line

	return { rawStart: end === undefined ? undefined : end - own.length - 1 - raw.length, lineAt: (index) => (endLine === undefined ? undefined : lineInRaw(raw, index, endLine - (own.match(EVERY_LINE_BREAK) ?? []).length)) }
}

/**
 * Finds the semicolons `no-extra-semicolons` finds extra in one raw of a node.
 * @param syntax - The syntax the copy reads through.
 * @param owner - The node.
 * @param key - Which of its raws.
 * @param result - The Stylelint result.
 * @returns The indices in the raw.
 */
function extraSemicolonsIn (syntax: Syntax, owner: Node, key: SemicolonRaw, result: PostcssResult): number[] {
	if (key === `before`) return extraSemicolonsBefore(syntax, owner, result)
	if (key === `after`) return extraSemicolonsAfter(syntax, owner, result)

	return extraSemicolonsOwn(syntax, owner)
}

/**
 * Finds the stray semicolons of a raw that `no-extra-semicolons` finds extra but a disable comment keeps from its fix, and that a write moves out of every such comment's reach, the comments moving with the text around them; such a write would hand them to that rule after all. Where the raw has no place in the file, every one a comment keeps is counted.
 * @param owner - The node whose `raws.before` or `raws.ownSemicolon`, or the container whose `raws.after`, is read.
 * @param key - Which of the raws.
 * @param result - The Stylelint result, which holds the configuration.
 * @param edits - The write's edits.
 * @returns The semicolons' indices in the raw.
 */
export function straySemicolonsReleased (owner: Node, key: SemicolonRaw, result: PostcssResult, edits: LineEdit[]): Set<number> {
	let raw = owner.raws[key]
	let released: Set<number> = new Set()

	if (typeof raw !== `string` || !raw.includes(`;`) || edits.every((edit) => edit.delta === 0)) return released

	let { rawStart, lineAt } = placeOf(owner, key, raw, result)
	let taken: Set<number> = new Set()

	for (let { fixDisabled, name, syntax } of neighborCopies(owner, result, NO_EXTRA_SEMICOLONS)) {
		if (fixDisabled) continue

		let ranges = fixDisabledRanges(result, name)

		for (let index of extraSemicolonsIn(syntax, owner, key, result)) {
			let line = lineAt(index)

			if (line === undefined || !ranges.some((range) => reaches(range, line))) taken.add(index)
			else if (rawStart === undefined || !ranges.some((range) => reaches(movedRange(range, edits, name), line + shiftAt(edits, rawStart + index)))) released.add(index)
		}
	}

	for (let index of taken) released.delete(index)

	return released
}

/**
 * Asks whether a raw holds a semicolon `no-extra-semicolons` finds extra but a disable comment on its line keeps from every live copy's fix.
 * @param owner - The node whose raw it is.
 * @param key - Which of its raws.
 * @param raw - The raw.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns True where it does.
 */
function holdsAKeptSemicolon (owner: Node, key: SemicolonRaw, raw: string, result: PostcssResult): boolean {
	let { lineAt } = placeOf(owner, key, raw, result)
	let held: Set<number> = new Set()
	let taken: Set<number> = new Set()

	for (let { fixDisabled, name, syntax } of neighborCopies(owner, result, NO_EXTRA_SEMICOLONS)) {
		if (fixDisabled) continue

		let ranges = fixDisabledRanges(result, name)

		for (let index of extraSemicolonsIn(syntax, owner, key, result)) {
			let line = lineAt(index)

			if (line !== undefined && ranges.some((range) => reaches(range, line))) held.add(index)
			else taken.add(index)
		}
	}

	return [...held].some((index) => !taken.has(index))
}

/** The raws holding a semicolon a disable comment keeps from `no-extra-semicolons`, per result, gathered once: a write never adds such a semicolon, so a raw holding none keeps holding none. */
let keptRawsByResult: WeakMap<PostcssResult, [Node, SemicolonRaw][]> = new WeakMap()

/**
 * Gathers the raws of a stylesheet holding a semicolon a disable comment keeps from `no-extra-semicolons`.
 * @param root - The stylesheet.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns The owners and their raws.
 */
function keptRaws (root: Container, result: PostcssResult): [Node, SemicolonRaw][] {
	let known = keptRawsByResult.get(result)

	if (known) return known

	let raws: [Node, SemicolonRaw][] = []

	/**
	 * Files one node's raws holding a kept semicolon.
	 * @param node - The node.
	 */
	function file (node: Node): void {
		for (let key of [`before`, `after`, `ownSemicolon`] as const) {
			let raw: unknown = node.raws[key]

			if (typeof raw === `string` && raw.includes(`;`) && holdsAKeptSemicolon(node, key, raw, result)) raws.push([node, key])
		}
	}

	root.walk(file)
	file(root)
	keptRawsByResult.set(result, raws)

	return raws
}

/**
 * Asks whether a write releases any stray semicolon a disable comment keeps from `no-extra-semicolons`, anywhere in the stylesheet: the write moves everything behind it, the raws of the nodes behind the edited one, nested blocks and the root's next statements included, and a semicolon on a line a `-next-line` comment covers moves off it wherever it stands. The semicolons `no-extra-semicolons` reads in the text of a Less `//` comment are not asked about.
 *
 * The raws holding such semicolons are gathered once per stylesheet, and only where a live copy of that rule has a range its fix is kept off, so a file without such comments costs nothing and one with them a walk.
 * @param root - The stylesheet.
 * @param result - The Stylelint result, which holds the configuration.
 * @param edits - The write's edits.
 * @returns True where it does.
 */
export function releasesAKeptSemicolon (root: Container, result: PostcssResult, edits: LineEdit[]): boolean {
	if (edits.every((edit) => edit.delta === 0)) return false

	if (!neighborCopies(root, result, NO_EXTRA_SEMICOLONS).some(({ fixDisabled, name }) => !fixDisabled && fixDisabledRanges(result, name).length > 0)) return false

	return keptRaws(root, result).some(([node, key]) => straySemicolonsReleased(node, key, result, edits).size > 0)
}

/**
 * Finds the stray semicolons of a rule's `raws.ownSemicolon` that `no-extra-semicolons` takes out in the same run: every one where no disable comment keeps its fix off the semicolon's line.
 * @param node - The rule.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns The semicolons' indices in the raw.
 */
export function straySemicolonsTakenOwn (node: Node, result: PostcssResult): Set<number> {
	let own = node.raws.ownSemicolon

	if (typeof own !== `string` || !own.includes(`;`)) return new Set()

	let closing = closingOffset(node)

	return takenByNoExtra(node, `ownSemicolon`, result, node.source?.end?.line, closing === undefined ? undefined : closing - (node.root().source?.start?.offset ?? 0), (syntax) => extraSemicolonsOwn(syntax, node))
}

/**
 * Finds the offsets in a stylesheet's text of every stray semicolon a neighbor takes out in the same run — `no-extra-semicolons` from any raw it reads, `declaration-block-trailing-semicolon: never` from a block's tail and the comments behind the node closing it — so that a rule reading the text reads it as the neighbors leave it. A semicolon whose raw has no place in the text is left out.
 * @param root - The stylesheet.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns The offsets, counted from the start of the root's text.
 */
export function straySemicolonOffsetsTaken (root: Container, result: PostcssResult): Set<number> {
	let offsets: Set<number> = new Set()
	let rootStart = root.source?.start?.offset ?? 0
	let text = root.source?.input.css ?? ``

	/**
	 * Files the taken semicolons of one raw.
	 * @param owner - The node whose raw it is.
	 * @param key - Which of its raws.
	 * @param taken - The indices taken.
	 */
	function file (owner: Node, key: SemicolonRaw, taken: Set<number>): void {
		let raw = owner.raws[key]

		if (taken.size === 0 || typeof raw !== `string`) return

		let { rawStart } = placeOf(owner, key, raw, result)

		if (rawStart === undefined) return

		// The root's own tail is placed in its text already
		let base = owner === root ? rawStart : rawStart - rootStart
		// A rule listed earlier may have rewritten the raw, which stays where it ends while its start moves; the semicolon is placed where the neighbor places its warning, past those already taken out of the raw, and by characters where the file holds too few
		let passed = semicolonsTakenAlreadyIn(owner, key, text, result)

		for (let index of taken) offsets.add(semicolonOffset(text, base + raw.length, raw, index, passed) ?? base + index)
	}

	root.walk((node) => {
		file(node, `before`, straySemicolonsTakenBefore(node, result))
		if (`nodes` in node) file(node, `after`, straySemicolonsTaken(node as Container, result))
		file(node, `ownSemicolon`, straySemicolonsTakenOwn(node, result))
	})
	file(root, `after`, straySemicolonsTaken(root, result))

	return offsets
}
