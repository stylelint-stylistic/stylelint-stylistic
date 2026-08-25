#!/usr/bin/env node

import { readdirSync, readFileSync, writeFileSync } from "node:fs"
import { argv, exit, stdout } from "node:process"

const NBSP = `\u00A0`

/** Every name of a directory holding Markdown the repository does not carry: what a package manager put there, what a build wrote, and the two the working tree keeps for a session rather than for the project. A name rather than a path, so that it is refused wherever in the tree it stands. */
const SKIPPED_DIR_NAMES = new Set([`node_modules`, `dist`, `coverage`, `.git`, `.claude`, `tmp`])

/** The license text is quoted verbatim, so it is left exactly as its source has it. */
const SKIPPED_FILES = new Set([`LICENSE.md`])

/** Every word that binds to the one after it: articles, prepositions, conjunctions, particles and the numerals spelled out. */
const FUNCTION_WORDS = `
	a an the
	in of to into for from at on by with without under over via through across inside
	after before between against about per than as like unlike onto upon within during
	since until toward towards
	and but or so if that which when while because whereas though although unless nor
	not
	two three four five six seven eight nine ten eleven twelve
`.trim().split(/\s+/u)

const ALTERNATIVES = FUNCTION_WORDS.toSorted((a, b) => b.length - a.length).join(`|`)

/** A function word, keeping any emphasis markers glued to it (`**not**`). */
const FUNCTION_WORD = new RegExp(String.raw`\b(${ALTERNATIVES})([*_]{0,2}) (?=\S)`, `giu`)

/** `no` binds to nothing on its own, but never parts with `longer`. */
const NO_LONGER = /\bno longer\b/giu

/** Names of works stay whole, and no rule can tell them from ordinary prose. */
const PROPER_NAMES = [`Keep a Changelog`, `Semantic Versioning`]

/** A number binds to what it counts or measures. */
const NUMBER = /(?<![\w.-])(\d+(?:[.,]\d+)?) (?=\S)/gu

/** A number trailing its word — a date, a version — binds backwards instead. */
const TRAILING_NUMBER = /\b([A-Za-z]+) (\d+(?:[.,]\d+)?)(?=[,.;:)\]]|$)/gu

/** An inline code span of any backtick width, left untouched. */
const CODE_SPAN = /(`+)(?:(?!\1)[\s\S])*?\1/gu

/** Pairs the rules bind but the meaning does not: `that` as a pronoun in front of its verb, `on` as an adverb rather than a preposition. */
const EXCEPTIONS = [`that is`, `that says`, `on too`]

const EXCEPTION_PATTERNS = EXCEPTIONS.map((pair) => new RegExp(`\\b${pair.replace(` `, `[ \\u00A0]`)}\\b`, `giu`))

/**
 * Binds the function words of a single line of prose.
 *
 * @param {string} line - The line to bind, with plain spaces only.
 * @returns {string} The same line with non-breaking spaces in place.
 */
function bind (line) {
	let spans = []
	let masked = line.replaceAll(CODE_SPAN, (span) => `\uE000${spans.push(span) - 1}\uE000`)

	for (let name of PROPER_NAMES) {
		masked = masked.replaceAll(name, name.replaceAll(` `, NBSP))
	}

	masked = masked
		.replaceAll(NO_LONGER, (match) => match.replace(/ /u, NBSP))
		.replaceAll(FUNCTION_WORD, (_, word, emphasis) => `${word}${emphasis}${NBSP}`)
		.replaceAll(NUMBER, (_, number) => `${number}${NBSP}`)
		.replaceAll(TRAILING_NUMBER, (_, word, number) => `${word}${NBSP}${number}`)
		.replaceAll(` — `, `${NBSP}— `)

	for (let pattern of EXCEPTION_PATTERNS) {
		masked = masked.replaceAll(pattern, (match) => match.replaceAll(NBSP, ` `))
	}

	return masked.replaceAll(/\uE000(\d+)\uE000/gu, (_, index) => spans[Number(index)])
}

/**
 * Applies the convention to a whole document, leaving fenced code blocks alone.
 *
 * @param {string} source - The Markdown source.
 * @returns {string} The bound Markdown source.
 */
function bindDocument (source) {
	let isFenced = false

	return source.replaceAll(NBSP, ` `).split(`\n`).map((line) => {
		if (line.startsWith(`\`\`\``)) {
			isFenced = !isFenced

			return line
		}

		return isFenced ? line : bind(line)
	}).join(`\n`)
}

/**
 * Collects the Markdown of one directory and of everything under it, declining to descend into a skipped name.
 *
 * `readdirSync` takes no list of subtrees to leave unread, so a walk asking it for the whole tree at once reads `node_modules` and `tmp` in full before any filter over its result can drop them — and a single entry under either that cannot be read ends the run over a directory the repository does not carry. Reading one directory at a time is what lets the name be refused before it costs anything.
 *
 * @param {string} directory - The directory to read, relative to the current one, and empty for that one itself.
 * @param {string[]} paths - Where the Markdown found so far is collected.
 */
function collectMarkdownFrom (directory, paths) {
	for (let entry of readdirSync(directory || `.`, { withFileTypes: true })) {
		let path = directory ? `${directory}/${entry.name}` : entry.name

		if (entry.isDirectory()) {
			if (!SKIPPED_DIR_NAMES.has(entry.name)) collectMarkdownFrom(path, paths)
		}
		else if (path.endsWith(`.md`) && !SKIPPED_FILES.has(path)) paths.push(path)
	}
}

/**
 * Collects every Markdown file the convention applies to.
 *
 * @returns {string[]} The paths, relative to the current directory.
 */
function collectMarkdown () {
	let paths = []

	collectMarkdownFrom(``, paths)

	return paths.toSorted()
}

let isCheck = argv.includes(`--check`)
let paths = argv.slice(2).filter((argument) => argument !== `--check`)
let unbound = []

if (paths.length === 0) paths = collectMarkdown()

for (let path of paths) {
	let source = readFileSync(path, `utf8`)
	let bound = bindDocument(source)

	if (source === bound) continue

	if (isCheck) {
		unbound.push(path)
	}
	else {
		writeFileSync(path, bound)
		stdout.write(`\tbound ${path}\n`)
	}
}

if (unbound.length > 0) {
	stdout.write(`\tUnbound prose in:\n\t\t${unbound.join(`\n\t\t`)}\n\tRun \`make prose\` and review the result.\n`)
	exit(1)
}
