import { type Declaration, parse, type Rule } from "postcss"
import { parse as scssParse } from "postcss-scss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { css } from "../../syntaxes/css/index.ts"
import { namespaces, type Syntax } from "../../syntaxes/index.ts"
import { isDeclaration } from "../typeGuards/index.ts"

import { sharesRunWithSemicolon, writesSharedRun } from "./index.ts"

const COLON_SPACE = `@stylistic/declaration-colon-space-after`
const COLON_NEWLINE = `@stylistic/declaration-colon-newline-after`
const COMMA_SPACE = `@stylistic/value-list-comma-space-before`
const SCSS_COLON_SPACE = `@stylistic/scss/declaration-colon-space-after`
const SCSS_COMMA_SPACE = `@stylistic/scss/value-list-comma-space-before`
const SCSS_COLON_NEWLINE = `@stylistic/scss/declaration-colon-newline-after`
const LESS_COLON_SPACE = `@stylistic/less/declaration-colon-space-after`
const LESS_COMMA_SPACE = `@stylistic/less/value-list-comma-space-before`

// The core imports no namespace's syntax; the two are read off the list the plugin builds
const scssSyntax = namespaces.find((syntax) => syntax.namespace === `scss`) as Syntax
const lessSyntax = namespaces.find((syntax) => syntax.namespace === `less`) as Syntax
const COMMA_NEWLINE = `@stylistic/value-list-comma-newline-before`
const SEMICOLON_SPACE = `@stylistic/declaration-block-semicolon-space-before`
const SEMICOLON_NEWLINE = `@stylistic/declaration-block-semicolon-newline-before`
const BRACE_SPACE = `@stylistic/block-closing-brace-space-before`
const BRACE_NEWLINE = `@stylistic/block-closing-brace-newline-before`
const TRAILING_SEMICOLON = `@stylistic/declaration-block-trailing-semicolon`

describe(`writesSharedRun`, () => {
	it(`a declaration whose value has a word of its own, whose two runs are two`, () => {
		let rules = { [COLON_SPACE]: `always`, [SEMICOLON_SPACE]: `never` }

		expect(ask(`a { b: c ; }`, rules, COLON_SPACE)).toBe(true)
		expect(ask(`a { b: c ; }`, rules, SEMICOLON_SPACE)).toBe(true)
	})

	it(`a declaration carrying a flag, whose semicolon's run is the end of the flag's raw`, () => {
		let rules = { [COLON_SPACE]: `always`, [SEMICOLON_SPACE]: `never` }

		expect(ask(`a { b: !important ; }`, rules, COLON_SPACE)).toBe(true)
		expect(ask(`a { b: !important ; }`, rules, SEMICOLON_SPACE)).toBe(true)
	})

	it(`the last declaration of a block where the file writes no semicolon behind it, which the semicolon rules pass over`, () => {
		expect(ask(`a { b: }`, { [COLON_SPACE]: `always`, [SEMICOLON_SPACE]: `never` }, COLON_SPACE)).toBe(true)
	})

	it(`a configuration listing the asking rule alone, or none of the four`, () => {
		expect(ask(`a { b: ; }`, { [COLON_SPACE]: `always` }, COLON_SPACE)).toBe(true)
		expect(ask(`a { b: ; }`, { "@stylistic/color-hex-case": `lower` }, SEMICOLON_SPACE)).toBe(true)
		expect(ask(`a { b: ; }`, {}, SEMICOLON_NEWLINE)).toBe(true)
	})

	it(`a rule that is none of the four`, () => {
		expect(ask(`a { b: ; }`, { [COLON_SPACE]: `always`, [SEMICOLON_SPACE]: `never` }, `@stylistic/color-hex-case`)).toBe(true)
	})

	it(`neither rule of a pair asking for different things of one run: the earlier-listed one is held by the rule behind it, the later-listed one by the rule ahead that stayed content, and only a rule ahead that has warned frees the write`, () => {
		let colonFirst = { [COLON_SPACE]: `always`, [SEMICOLON_SPACE]: `never` }
		let semicolonFirst = { [SEMICOLON_SPACE]: `never`, [COLON_SPACE]: `always` }

		expect(ask(`a { b: ; }`, colonFirst, COLON_SPACE)).toBe(false)
		expect(ask(`a { b: ; }`, colonFirst, SEMICOLON_SPACE)).toBe(false)
		expect(ask(`a { b: ; }`, semicolonFirst, COLON_SPACE)).toBe(true)
		expect(ask(`a { b: ; }`, semicolonFirst, SEMICOLON_SPACE)).toBe(false)
	})

	it(`both rules, where the two ask for the same thing`, () => {
		expect(ask(`a { b:; }`, { [COLON_SPACE]: `always`, [SEMICOLON_SPACE]: `always` }, COLON_SPACE)).toBe(true)
		expect(ask(`a { b:; }`, { [COLON_SPACE]: `always`, [SEMICOLON_SPACE]: `always` }, SEMICOLON_SPACE)).toBe(true)
		expect(ask(`a { b: ; }`, { [COLON_NEWLINE]: `always`, [SEMICOLON_NEWLINE]: `always` }, COLON_NEWLINE)).toBe(true)
		expect(ask(`a { b: ; }`, { [COLON_NEWLINE]: `always`, [SEMICOLON_NEWLINE]: `always` }, SEMICOLON_NEWLINE)).toBe(true)
		expect(ask(`a {\n\tb: ;\n}`, { [COLON_SPACE]: `never`, [SEMICOLON_NEWLINE]: `never-multi-line` }, COLON_SPACE)).toBe(true)
		expect(ask(`a {\n\tb: ;\n}`, { [COLON_SPACE]: `never`, [SEMICOLON_NEWLINE]: `never-multi-line` }, SEMICOLON_NEWLINE)).toBe(true)
	})

	it(`the space rule and the newline rule of one end, which ask for different things`, () => {
		expect(ask(`a { b: ; }`, { [COLON_NEWLINE]: `always`, [SEMICOLON_SPACE]: `always` }, COLON_NEWLINE)).toBe(false)
		expect(ask(`a { b: ; }`, { [COLON_NEWLINE]: `always`, [SEMICOLON_SPACE]: `always` }, SEMICOLON_SPACE)).toBe(true)
		expect(ask(`a { b: ; }`, { [SEMICOLON_NEWLINE]: `always`, [COLON_SPACE]: `always` }, SEMICOLON_NEWLINE)).toBe(false)
		expect(ask(`a { b: ; }`, { [SEMICOLON_NEWLINE]: `always`, [COLON_SPACE]: `always` }, COLON_SPACE)).toBe(true)
	})

	it(`the run a declaration the stylesheet ends on prints behind its colon, which the newline rule of the colon reads and the space rule does not`, () => {
		expect(ask(`--b: \n`, { [COLON_NEWLINE]: `always`, [COLON_SPACE]: `never` }, COLON_NEWLINE)).toBe(true)
		expect(ask(`a { --b: }`, { [COLON_NEWLINE]: `always`, [COLON_SPACE]: `never` }, COLON_NEWLINE)).toBe(false)
	})

	it(`a block comment behind a head run holding a break, which a space or nothing written over the run puts on the colon's line, where the newline rule reads the run behind the comment instead`, () => {
		expect(ask(`a { b:\n/*c*/\nx; }`, { [COLON_SPACE]: `always`, [COLON_NEWLINE]: `always-multi-line` }, COLON_SPACE)).toBe(true)
		expect(ask(`a { b:\n/*c*/\nx; }`, { [COLON_SPACE]: `never`, [COLON_NEWLINE]: `always-multi-line` }, COLON_SPACE)).toBe(true)
		expect(ask(`a { b:\n/*c*/\nx; }`, { [COLON_SPACE]: `always`, [COLON_NEWLINE]: `always` }, COLON_SPACE)).toBe(true)
		expect(ask(`a { --b:\n/*c\n*/ ; }`, { [COLON_SPACE]: `always`, [COLON_NEWLINE]: `always-multi-line` }, COLON_SPACE)).toBe(true)
	})

	it(`the same comment where the asking rule's check waits for the run's end and the newline rule ahead was content with the break, which the write takes off the head run — the break the newline rule then writes behind the comment is its own, on the run after`, () => {
		expect(ask(`a { b:\n/*c*/ x; }`, { [COLON_NEWLINE]: `always`, [COLON_SPACE]: `always-single-line` }, COLON_SPACE)).toBe(true)
	})

	it(`a break the newline rule writes over that run, which leaves the comment off the colon's line and the space rule behind a reader of the run`, () => {
		expect(ask(`a { b:\n/*c*/\nx; }`, { [COLON_NEWLINE]: `always`, [COLON_SPACE]: `always` }, COLON_NEWLINE)).toBe(false)
	})

	it(`a value over several lines with no comment behind the head run, which the two colon rules contradict each other over`, () => {
		expect(ask(`a { b:\nx\ny; }`, { [COLON_SPACE]: `always`, [COLON_NEWLINE]: `always-multi-line` }, COLON_SPACE)).toBe(false)
	})

	it(`the run behind a comment on the colon's line, which the newline rule of the colon reads and the space rule does not`, () => {
		expect(ask(`a { b: /*c*/ ; }`, { [COLON_NEWLINE]: `always`, [SEMICOLON_SPACE]: `never` }, COLON_NEWLINE)).toBe(false)
		expect(ask(`a { b: /*c*/ ; }`, { [COLON_NEWLINE]: `always`, [SEMICOLON_SPACE]: `never` }, SEMICOLON_SPACE)).toBe(true)
		expect(ask(`a { b: /*c*/ ; }`, { [COLON_SPACE]: `always`, [SEMICOLON_SPACE]: `never` }, COLON_SPACE)).toBe(true)
		expect(ask(`a { b: /*c*/ ; }`, { [SEMICOLON_SPACE]: `never`, [COLON_SPACE]: `always` }, SEMICOLON_SPACE)).toBe(true)
	})

	it(`a comment holding a colon of its own in front of the colon, which is no colon of the declaration, so the run behind the real one is every rule's`, () => {
		expect(ask(`a { b /*x:y*/: ; }`, { [COLON_NEWLINE]: `always`, [SEMICOLON_SPACE]: `always` }, COLON_NEWLINE)).toBe(false)
		expect(ask(`a { b /*x:y*/: ; }`, { [COLON_NEWLINE]: `always`, [SEMICOLON_SPACE]: `always` }, SEMICOLON_SPACE)).toBe(true)
	})

	it(`a value holding two comments, or a word behind the comment, whose run behind the first comment is nobody else's`, () => {
		expect(ask(`a { b: /*c*/ /*d*/ ; }`, { [COLON_NEWLINE]: `always`, [SEMICOLON_SPACE]: `never` }, COLON_NEWLINE)).toBe(true)
		expect(ask(`a { b: /*c*/ d ; }`, { [COLON_NEWLINE]: `always`, [SEMICOLON_SPACE]: `never` }, COLON_NEWLINE)).toBe(true)
	})

	it(`a never option of the semicolon space rule on a custom property, which leaves a single space alone and so accepts the space rule of the colon`, () => {
		expect(ask(`a { --b:; }`, { [COLON_SPACE]: `always`, [SEMICOLON_SPACE]: `never` }, COLON_SPACE)).toBe(true)
		expect(ask(`a { b:; }`, { [COLON_SPACE]: `always`, [SEMICOLON_SPACE]: `never` }, COLON_SPACE)).toBe(false)
		expect(ask(`a { --b:; }`, { [COLON_NEWLINE]: `always`, [SEMICOLON_SPACE]: `never` }, COLON_NEWLINE)).toBe(false)
		expect(ask(`a { --b:  ; }`, { [SEMICOLON_SPACE]: `never`, [COLON_SPACE]: `always` }, SEMICOLON_SPACE)).toBe(true)
	})

	it(`the tail behind a comment on the colon's line of a custom property, which the never option of the semicolon space rule reports like any other run, so that a newline rule deferred behind it — the colon's, or the semicolon's own — is freed by that warning`, () => {
		expect(ask(`a { --b: /*c\n*/ ; }`, { [SEMICOLON_SPACE]: `never`, [COLON_NEWLINE]: `always-multi-line` }, COLON_NEWLINE)).toBe(true)
		expect(ask(`a { --b: /*c\n*/ ; }`, { [COLON_NEWLINE]: `always-multi-line`, [SEMICOLON_SPACE]: `never` }, COLON_NEWLINE)).toBe(true)
		expect(ask(`a { --b: /*c\n*/ ; }`, { [SEMICOLON_SPACE]: `never`, [SEMICOLON_NEWLINE]: `always-multi-line` }, SEMICOLON_NEWLINE)).toBe(true)
	})

	it(`the same tail in a block over several lines, which the never option of the semicolon newline rule reports like any other run, so the space rule ahead of it does not write the space the newline rule would report`, () => {
		expect(ask(`a {\n\tb: /*c*/\n;\n}`, { [SEMICOLON_SPACE]: `always`, [SEMICOLON_NEWLINE]: `never-multi-line` }, SEMICOLON_SPACE)).toBe(false)
		expect(ask(`a {\n\tb:\n;\n}`, { [SEMICOLON_SPACE]: `always`, [SEMICOLON_NEWLINE]: `never-multi-line` }, SEMICOLON_SPACE)).toBe(true)
	})

	it(`a run of two spaces or a tab, which no option accepts, so a rule ahead that speaks of it has reported it and frees the deferred rule behind`, () => {
		expect(ask(`a {\n\tb: /*c*/  ;\n}`, { [SEMICOLON_SPACE]: `always`, [SEMICOLON_NEWLINE]: `never-multi-line` }, SEMICOLON_NEWLINE)).toBe(true)
		expect(ask(`a {\n\t--b:\t;\n}`, { [SEMICOLON_SPACE]: `never`, [SEMICOLON_NEWLINE]: `always-multi-line` }, SEMICOLON_NEWLINE)).toBe(true)
		expect(ask(`a {\n\t--b: ;\n}`, { [SEMICOLON_SPACE]: `never`, [SEMICOLON_NEWLINE]: `always-multi-line` }, SEMICOLON_NEWLINE)).toBe(false)
	})

	it(`the same tail where the newline rule of the colon is listed ahead with its always option and asks about the semicolon rule behind, which the two contradict each other over`, () => {
		expect(ask(`a { --b: /*c\n*/ ; }`, { [COLON_NEWLINE]: `always`, [SEMICOLON_SPACE]: `never` }, COLON_NEWLINE)).toBe(false)
		expect(ask(`a { --b: /*c\n*/ ; }`, { [COLON_NEWLINE]: `always`, [SEMICOLON_SPACE]: `never` }, SEMICOLON_SPACE)).toBe(true)
	})

	it(`the never option of the semicolon newline rule, which leaves a single space alone on every declaration`, () => {
		expect(ask(`a {\n\tb:;\n}`, { [COLON_SPACE]: `always`, [SEMICOLON_NEWLINE]: `never-multi-line` }, COLON_SPACE)).toBe(true)
		expect(ask(`a {\n\t--b:;\n}`, { [COLON_SPACE]: `always`, [SEMICOLON_NEWLINE]: `never-multi-line` }, COLON_SPACE)).toBe(true)
		expect(ask(`a {\n\tb:;\n}`, { [COLON_NEWLINE]: `always`, [SEMICOLON_NEWLINE]: `never-multi-line` }, COLON_NEWLINE)).toBe(false)
	})

	it(`a value holding a vertical tab or a no-break space, which the tokenizer reads as a word, so the run is the head group's and not the semicolon's`, () => {
		expect(ask(`a { b:\v; }`, { [COLON_SPACE]: `always`, [SEMICOLON_SPACE]: `never` }, COLON_SPACE)).toBe(true)
		expect(ask(`a { b:\u00A0; }`, { [COLON_SPACE]: `always`, [SEMICOLON_SPACE]: `never` }, COLON_SPACE)).toBe(true)
		expect(ask(`a { b:\v; }`, { [COLON_NEWLINE]: `always`, [COLON_SPACE]: `always` }, COLON_NEWLINE)).toBe(false)
	})

	it(`a declaration the colon rules do not read, which shares its run with nobody`, () => {
		expect(ask(`a { $x: ; }`, { [SEMICOLON_SPACE]: `never`, [COLON_SPACE]: `always` }, SEMICOLON_SPACE)).toBe(true)
		expect(ask(`a { b: ; }`, { [SEMICOLON_SPACE]: `never`, [COLON_SPACE]: `always` }, SEMICOLON_SPACE, { ...css, isStandardDeclaration: () => false })).toBe(true)
	})

	it(`a block the asking rule's break puts over several lines, which wakes the neighbor's multi-line option — a neighbor behind the asker in either spelling, since a lineness-conditioned check waits for the run's writers`, () => {
		expect(ask(`a { b:; }`, { [COLON_NEWLINE]: `always`, [SEMICOLON_NEWLINE]: `never-multi-line` }, COLON_NEWLINE)).toBe(false)
		expect(ask(`a { b:; }`, { [SEMICOLON_NEWLINE]: `never-multi-line`, [COLON_NEWLINE]: `always` }, COLON_NEWLINE)).toBe(false)
	})

	it(`the rule taking the last turn, which still does not write over a rule ahead that was content with the run as it stood — that one has spoken by staying silent, and a write it would not accept leaves the file violating a rule that reported nothing`, () => {
		expect(ask(`a { b:\n; }`, { [COLON_NEWLINE]: `always`, [SEMICOLON_NEWLINE]: `never-multi-line` }, SEMICOLON_NEWLINE)).toBe(false)
		expect(ask(`a {\n\tb:\n;\n}`, { [COLON_NEWLINE]: `always`, [SEMICOLON_NEWLINE]: `never-multi-line` }, SEMICOLON_NEWLINE)).toBe(false)
	})

	it(`three rules, where a rule ahead of two contradicting ones writes only what both accept, and a rule behind one content with the run writes nothing either`, () => {
		let rules = { [COLON_SPACE]: `always`, [SEMICOLON_SPACE]: `never`, [SEMICOLON_NEWLINE]: `never-multi-line` }

		expect(ask(`a {\n\tb: ;\n}`, rules, COLON_SPACE)).toBe(false)
		expect(ask(`a {\n\tb: ;\n}`, rules, SEMICOLON_SPACE)).toBe(false)
		expect(ask(`a {\n\tb:;\n}`, { [COLON_SPACE]: `always`, [SEMICOLON_NEWLINE]: `never-multi-line`, [SEMICOLON_SPACE]: `never` }, COLON_SPACE)).toBe(false)
	})

	it(`four rules, where each is asked about every rule behind it — and a lineness-conditioned one about a rule ahead that was content with the run as it stood, whose silence a write must not turn into a violation`, () => {
		let rules = { [SEMICOLON_SPACE]: `never-single-line`, [COLON_NEWLINE]: `always`, [COLON_SPACE]: `always-single-line`, [SEMICOLON_NEWLINE]: `always-multi-line` }

		expect(ask(`a { b: ; }`, rules, SEMICOLON_SPACE)).toBe(false)
		expect(ask(`a { b: ; }`, rules, COLON_NEWLINE)).toBe(false)
		expect(ask(`a { b:; }`, rules, COLON_SPACE)).toBe(false)
	})

	it(`a single-line option the break of the rule behind silences, whose write costs the file nothing`, () => {
		expect(ask(`a { b: ; }`, { [SEMICOLON_SPACE]: `never-single-line`, [COLON_NEWLINE]: `always` }, SEMICOLON_SPACE)).toBe(true)
		expect(ask(`a { b:; }`, { [SEMICOLON_SPACE]: `always-single-line`, [COLON_NEWLINE]: `always` }, SEMICOLON_SPACE)).toBe(true)
		expect(ask(`a { b: ; }`, { [SEMICOLON_SPACE]: `never`, [COLON_NEWLINE]: `always` }, SEMICOLON_SPACE)).toBe(false)
	})

	it(`the value of a custom property, which the semicolon rule's break puts over several lines and the colon's single-line option falls silent about`, () => {
		expect(ask(`a { --b: ; }`, { [SEMICOLON_NEWLINE]: `always`, [COLON_SPACE]: `always-single-line` }, SEMICOLON_NEWLINE)).toBe(true)
		expect(ask(`a { b: ; }`, { [SEMICOLON_NEWLINE]: `always`, [COLON_SPACE]: `always-single-line` }, SEMICOLON_NEWLINE)).toBe(false)
		expect(ask(`a { --b: ; }`, { [SEMICOLON_NEWLINE]: `always`, [COLON_SPACE]: `always` }, SEMICOLON_NEWLINE)).toBe(false)
	})

	it(`the same value under the break of the other colon rule, which lands in the raw between and not in the value, so the single-line option behind still speaks and the break is not written`, () => {
		expect(ask(`a { --b: ; }`, { [COLON_NEWLINE]: `always`, [COLON_SPACE]: `always-single-line` }, COLON_NEWLINE)).toBe(false)
		expect(ask(`a { --b: ; }`, { [COLON_SPACE]: `always-single-line`, [COLON_NEWLINE]: `always` }, COLON_SPACE)).toBe(true)
	})

	it(`a value holding a word and a break, inside a comment or between two words, which is over several lines as the file spells it, so the single-line option behind is silent and the break is written — on a custom property as on an ordinary one`, () => {
		expect(ask(`a { --b: x /*c\n*/; }`, { [COLON_NEWLINE]: `always`, [COLON_SPACE]: `always-single-line` }, COLON_NEWLINE)).toBe(true)
		expect(ask(`a { b: x /*c\n*/; }`, { [COLON_NEWLINE]: `always`, [COLON_SPACE]: `always-single-line` }, COLON_NEWLINE)).toBe(true)
		expect(ask(`a { --b: x\n b; }`, { [COLON_NEWLINE]: `always`, [COLON_SPACE]: `always-single-line` }, COLON_NEWLINE)).toBe(true)
	})

	it(`a value holding a comment beside the shared run, which is counted without that run — the run the write replaces — so a neighbor's multi-line option is silent about what the write leaves: the run in front of a custom property's semicolon, and the run at the head of a wordless value of either kind`, () => {
		expect(ask(`a { --b: /*c*/\n; }`, { [SEMICOLON_SPACE]: `always`, [COLON_NEWLINE]: `always-multi-line` }, SEMICOLON_SPACE)).toBe(true)
		expect(ask(`a { --b:\n/*c*/; }`, { [COLON_SPACE]: `always`, [COLON_NEWLINE]: `always-multi-line` }, COLON_SPACE)).toBe(true)
		expect(ask(`a { b:\n/*c*/; }`, { [COLON_SPACE]: `always`, [COLON_NEWLINE]: `always-multi-line` }, COLON_SPACE)).toBe(true)
	})

	it(`a neighbor silent about the block as the asking rule leaves it`, () => {
		expect(ask(`a { b:\n; }`, { [COLON_SPACE]: `always`, [SEMICOLON_SPACE]: `never-single-line` }, COLON_SPACE)).toBe(false)
		expect(ask(`a { b:\n; top: 0;\n}`, { [COLON_SPACE]: `always`, [SEMICOLON_SPACE]: `never-single-line` }, COLON_SPACE)).toBe(true)
	})

	it(`the run at the head of a value carrying a flag, which the two colon rules share between themselves and the semicolon rules do not`, () => {
		expect(ask(`a { b: !important ; }`, { [COLON_NEWLINE]: `always`, [COLON_SPACE]: `always` }, COLON_NEWLINE)).toBe(false)
		expect(ask(`a { b: !important ; }`, { [COLON_NEWLINE]: `always`, [COLON_SPACE]: `always` }, COLON_SPACE)).toBe(true)
		expect(ask(`a { b: !important ; }`, { [COLON_SPACE]: `always`, [COLON_NEWLINE]: `always` }, COLON_SPACE)).toBe(false)
		expect(ask(`a { b: !important ; }`, { [COLON_SPACE]: `always`, [COLON_NEWLINE]: `always` }, COLON_NEWLINE)).toBe(false)
	})

	it(`the same head run on a value carrying a word, and a semicolon rule listed among the two, which reads no run of theirs`, () => {
		expect(ask(`a { b:  c; }`, { [COLON_NEWLINE]: `always`, [COLON_SPACE]: `always` }, COLON_NEWLINE)).toBe(false)
		expect(ask(`a { b:  c; }`, { [COLON_NEWLINE]: `always`, [SEMICOLON_SPACE]: `never`, [COLON_SPACE]: `always` }, COLON_NEWLINE)).toBe(false)
		expect(ask(`a { b:  c ; }`, { [COLON_SPACE]: `always`, [SEMICOLON_SPACE]: `never` }, COLON_SPACE)).toBe(true)
		expect(ask(`a { b: // c\n; }`, { [COLON_NEWLINE]: `always`, [COLON_SPACE]: `always` }, COLON_NEWLINE)).toBe(false)
	})

	it(`a block comment standing right on the colon, which parts the two colon rules' runs`, () => {
		expect(ask(`a { b: /*c*/ x; }`, { [COLON_NEWLINE]: `always`, [COLON_SPACE]: `never` }, COLON_SPACE)).toBe(true)
		expect(ask(`a { b: /*c*/ x; }`, { [COLON_NEWLINE]: `always`, [COLON_SPACE]: `never` }, COLON_NEWLINE)).toBe(true)
	})

	it(`a rule behind whose fix the configuration turned off, which reports the run and cannot rewrite it, so it gates nothing`, () => {
		expect(ask(`a { b:\n; }`, { [COLON_SPACE]: `always`, [SEMICOLON_SPACE]: [`never`, { disableFix: true }] }, COLON_SPACE)).toBe(true)
		expect(ask(`a { b:\n; }`, { [COLON_SPACE]: `always`, [SEMICOLON_SPACE]: `never` }, COLON_SPACE)).toBe(false)
		expect(ask(`a { b: !important ; }`, { [COLON_NEWLINE]: `always`, [COLON_SPACE]: [`always`, { disableFix: true }] }, COLON_NEWLINE)).toBe(true)
	})

	it(`the rules of the asking rule's own namespace`, () => {
		let scss: Syntax = { ...css, namespace: `scss` }

		expect(ask(`a { b: ; }`, { "@stylistic/scss/declaration-colon-space-after": `always`, "@stylistic/scss/declaration-block-semicolon-space-before": `never` }, `@stylistic/scss/declaration-colon-space-after`, scss)).toBe(false)
	})

	it(`a rule listed under another namespace that reads the same plain CSS root, which yields to the core's copy where one is configured`, () => {
		let scss: Syntax = { ...css, namespace: `scss` }
		let scssSemicolonSpace = `@stylistic/scss/declaration-block-semicolon-space-before`
		let scssColonSpace = `@stylistic/scss/declaration-colon-space-after`

		expect(ask(`a { b: ; }`, { [COLON_SPACE]: `always`, [scssSemicolonSpace]: `never` }, COLON_SPACE)).toBe(false)
		expect(ask(`a { b: ; }`, { [COLON_SPACE]: `always`, [scssSemicolonSpace]: `never` }, scssSemicolonSpace, scss)).toBe(false)
		expect(ask(`a { b: ; }`, { [COLON_SPACE]: `always`, [scssColonSpace]: `never` }, COLON_SPACE)).toBe(true)
		expect(ask(`a { b:; }`, { [COLON_SPACE]: `always`, [scssColonSpace]: `always` }, COLON_SPACE)).toBe(true)
	})

	it(`a wordless declaration the brace alone closes, whose run behind the colon is the run in front of the brace, which the earlier-listed rule of a contradicting pair never writes`, () => {
		for (let code of [`a {\n\tx:\n}`, `a {\n\t--x:\n}`, `a { x: }`, `a { --x:}`]) {
			expect(ask(code, { [COLON_SPACE]: `always`, [BRACE_NEWLINE]: `always` }, COLON_SPACE)).toBe(false)
			expect(ask(code, { [BRACE_NEWLINE]: `always`, [COLON_SPACE]: `always` }, BRACE_NEWLINE)).toBe(false)
			expect(ask(code, { [COLON_NEWLINE]: `always`, [BRACE_SPACE]: `never` }, COLON_NEWLINE)).toBe(false)
		}
	})

	it(`the later-listed rule of such a pair, which writes only over a run the rule ahead has warned about and never over one it accepts`, () => {
		for (let code of [`a {\n\tx:\n}`, `a {\n\t--x:\n}`]) {
			expect(ask(code, { [COLON_SPACE]: `always`, [BRACE_NEWLINE]: `always` }, BRACE_NEWLINE)).toBe(true)
			expect(ask(code, { [BRACE_NEWLINE]: `always`, [COLON_SPACE]: `always` }, COLON_SPACE)).toBe(false)
			expect(ask(code, { [COLON_NEWLINE]: `always`, [BRACE_SPACE]: `never` }, BRACE_SPACE)).toBe(false)
		}

		expect(ask(`a { x: }`, { [COLON_SPACE]: `always`, [BRACE_NEWLINE]: `always` }, BRACE_NEWLINE)).toBe(false)
		expect(ask(`a { x: }`, { [BRACE_NEWLINE]: `always`, [COLON_SPACE]: `always` }, COLON_SPACE)).toBe(true)
		expect(ask(`a { x: }`, { [COLON_NEWLINE]: `always`, [BRACE_SPACE]: `never` }, BRACE_SPACE)).toBe(true)
		expect(ask(`a { --x:}`, { [COLON_SPACE]: `always`, [BRACE_NEWLINE]: `always` }, BRACE_NEWLINE)).toBe(true)
		expect(ask(`a { --x:}`, { [BRACE_NEWLINE]: `always`, [COLON_SPACE]: `always` }, COLON_SPACE)).toBe(true)
		expect(ask(`a { --x:}`, { [COLON_NEWLINE]: `always`, [BRACE_SPACE]: `never` }, BRACE_SPACE)).toBe(true)
	})

	it(`the same declaration where the two ask for the same thing, so both write`, () => {
		expect(ask(`a {\n\tx:\n}`, { [COLON_SPACE]: `always`, [BRACE_SPACE]: `always` }, COLON_SPACE)).toBe(true)
		expect(ask(`a {\n\tx:\n}`, { [COLON_SPACE]: `always`, [BRACE_SPACE]: `always` }, BRACE_SPACE)).toBe(true)
		expect(ask(`a {\n\t--x: }`, { [COLON_NEWLINE]: `always`, [BRACE_NEWLINE]: `always` }, COLON_NEWLINE)).toBe(true)
		expect(ask(`a {\n\t--x: }`, { [COLON_NEWLINE]: `always`, [BRACE_NEWLINE]: `always` }, BRACE_NEWLINE)).toBe(true)
	})

	it(`a rule the colon rule ahead of it in run order gates, where that one accepts the run as it stands and not what the write leaves`, () => {
		expect(ask(`a {\n\tx: }`, { [COLON_SPACE]: `always`, [BRACE_NEWLINE]: `always-multi-line` }, BRACE_NEWLINE)).toBe(false)
		expect(ask(`a {\n\tx: }`, { [COLON_SPACE]: `always`, [BRACE_NEWLINE]: `always-multi-line` }, COLON_SPACE)).toBe(false)
		expect(ask(`a {\n\tx:\n}`, { [COLON_NEWLINE]: `always`, [BRACE_SPACE]: `never-multi-line` }, BRACE_SPACE)).toBe(false)
	})

	it(`a space in front of the break, which is a break to the semicolon newline rule and none to the colon's and the brace's, so a deferred colon rule behind the brace rule is freed by the brace rule's warning`, () => {
		expect(ask(`a {\n\tx: \n}`, { [COLON_SPACE]: `always-single-line`, [BRACE_NEWLINE]: `always` }, COLON_SPACE)).toBe(true)
		expect(ask(`a {\n\tx: \n}`, { [BRACE_NEWLINE]: `always`, [COLON_SPACE]: `always-single-line` }, COLON_SPACE)).toBe(true)
		expect(ask(`a {\n\tx: \n}`, { [COLON_NEWLINE]: `always`, [BRACE_SPACE]: `never-multi-line` }, BRACE_SPACE)).toBe(true)
		expect(ask(`a {\n\tx: \n;\n}`, { [SEMICOLON_NEWLINE]: `always`, [COLON_SPACE]: `always-single-line` }, COLON_SPACE)).toBe(false)
	})

	it(`the tail behind a comment on the colon's line of a custom property closing the block, which the newline rule of the colon shares with the brace rules and the space rule does not`, () => {
		expect(ask(`a {\n\t--x: /*c*/\n}`, { [COLON_NEWLINE]: `always`, [BRACE_SPACE]: `always` }, COLON_NEWLINE)).toBe(false)
		expect(ask(`a {\n\t--x: /*c*/\n}`, { [COLON_NEWLINE]: `always`, [BRACE_SPACE]: `always` }, BRACE_SPACE)).toBe(false)
		expect(ask(`a {\n\t--x: /*c*/\n}`, { [COLON_SPACE]: `never`, [BRACE_SPACE]: `always` }, COLON_SPACE)).toBe(true)
	})

	it(`a run that is not the brace's: a worded value, a semicolon standing or to come, a comment behind a plain property, which the parser makes a sibling`, () => {
		expect(ask(`a {\n\t--x: pink\n}`, { [COLON_SPACE]: `never`, [BRACE_NEWLINE]: `always` }, COLON_SPACE)).toBe(true)
		expect(ask(`a {\n\tx:\n;\n}`, { [COLON_SPACE]: `always`, [BRACE_NEWLINE]: `always` }, COLON_SPACE)).toBe(true)
		expect(ask(`a {\n\tx:\n}`, { [TRAILING_SEMICOLON]: `always`, [COLON_SPACE]: `always`, [BRACE_NEWLINE]: `always` }, COLON_SPACE)).toBe(true)
		expect(ask(`a {\n\tx:\n}`, { [TRAILING_SEMICOLON]: `always`, [COLON_SPACE]: `always`, [BRACE_NEWLINE]: `always` }, BRACE_NEWLINE)).toBe(true)
		expect(ask(`a {\n\tx: /*c*/\n}`, { [COLON_NEWLINE]: `always`, [BRACE_SPACE]: `always` }, COLON_NEWLINE)).toBe(true)
	})
})

describe(`writesSharedRun over a comma opening the value`, () => {
	// The head run is the comma's too, so the colon rules and the comma rules settle it the way the colon and semicolon rules settle a wordless value
	it(`a pair asking for different things of the head run: the earlier-listed one is held by the rule behind it, and the later-listed one by a rule ahead that stayed content`, () => {
		expect(ask(`a { b: ,c }`, { [COLON_SPACE]: `never`, [COMMA_SPACE]: `always` }, COLON_SPACE)).toBe(false)
		expect(ask(`a { b: ,c }`, { [COLON_SPACE]: `never`, [COMMA_SPACE]: `always` }, COMMA_SPACE)).toBe(true)
		expect(ask(`a { b: ,c }`, { [COMMA_SPACE]: `always`, [COLON_SPACE]: `never` }, COLON_SPACE)).toBe(false)
		expect(ask(`a { b:,c }`, { [COMMA_SPACE]: `always`, [COLON_SPACE]: `never` }, COMMA_SPACE)).toBe(false)
		expect(ask(`a { b:,c }`, { [COLON_NEWLINE]: `always`, [COMMA_SPACE]: `never` }, COLON_NEWLINE)).toBe(false)
		expect(ask(`a { b:,c }`, { [COLON_NEWLINE]: `always`, [COMMA_SPACE]: `never` }, COMMA_SPACE)).toBe(true)
	})

	it(`a pair asking for the same thing, where both write`, () => {
		expect(ask(`a { b:,c }`, { [COLON_SPACE]: `always`, [COMMA_SPACE]: `always` }, COLON_SPACE)).toBe(true)
		expect(ask(`a { b:,c }`, { [COLON_SPACE]: `always`, [COMMA_SPACE]: `always` }, COMMA_SPACE)).toBe(true)
		expect(ask(`a { b: ,c }`, { [COLON_NEWLINE]: `always`, [COMMA_NEWLINE]: `always` }, COLON_NEWLINE)).toBe(true)
		expect(ask(`a { b: ,c }`, { [COLON_NEWLINE]: `always`, [COMMA_NEWLINE]: `always` }, COMMA_NEWLINE)).toBe(true)
		expect(ask(`a { --b: ,c }`, { [COLON_SPACE]: `never`, [COMMA_SPACE]: `never` }, COMMA_SPACE)).toBe(true)
	})

	it(`a break with indentation or a space in front of it, which is a break to the comma newline rule and none to the colon's, so the content comma rule ahead holds the colon rule`, () => {
		expect(ask(`a { b:\n\t,c }`, { [COMMA_NEWLINE]: `always`, [COLON_SPACE]: `never` }, COLON_SPACE)).toBe(false)
		expect(ask(`a { b: \n,c }`, { [COMMA_NEWLINE]: `always`, [COLON_SPACE]: `never` }, COLON_SPACE)).toBe(false)
		expect(ask(`a { b: \n,c }`, { [COMMA_NEWLINE]: `always`, [COLON_NEWLINE]: `always` }, COLON_NEWLINE)).toBe(true)
	})

	it(`a lineness option of a comma rule, which reads the whole declaration with the head run as written`, () => {
		expect(ask(`a { b: ,c }`, { [COLON_NEWLINE]: `always`, [COMMA_SPACE]: `never-single-line` }, COLON_NEWLINE)).toBe(true)
		expect(ask(`a { b:,c }`, { [COLON_NEWLINE]: `always`, [COMMA_NEWLINE]: `never-multi-line` }, COLON_NEWLINE)).toBe(false)
		expect(ask(`a { b:\n,c }`, { [COLON_NEWLINE]: `always`, [COMMA_NEWLINE]: `never-multi-line` }, COMMA_NEWLINE)).toBe(false)
		expect(ask(`a { b: ,c,\nd }`, { [COLON_SPACE]: `never`, [COMMA_SPACE]: `always-single-line` }, COLON_SPACE)).toBe(true)
		expect(ask(`a { b: ,c }`, { [COLON_SPACE]: `never`, [COMMA_SPACE]: `always-single-line` }, COLON_SPACE)).toBe(false)
	})

	it(`a list with another comma behind the one opening the value, in front of which the comma newline rule writes a break in the same pass, so a deferred colon rule behind it reads a multi-line value and says nothing`, () => {
		expect(ask(`a { b:,c,d }`, { [COLON_SPACE]: `always-single-line`, [COMMA_NEWLINE]: `always` }, COMMA_NEWLINE)).toBe(true)
		expect(ask(`a { b:,c,d }`, { [COMMA_NEWLINE]: `always`, [COLON_SPACE]: `always-single-line` }, COMMA_NEWLINE)).toBe(true)
		expect(ask(`a { b:,c }`, { [COLON_SPACE]: `always-single-line`, [COMMA_NEWLINE]: `always` }, COMMA_NEWLINE)).toBe(false)
		expect(ask(`a { b:,f(c,d) }`, { [COLON_SPACE]: `always-single-line`, [COMMA_NEWLINE]: `always` }, COMMA_NEWLINE)).toBe(false)
		expect(ask(`a { b:,c,d }`, { [COLON_SPACE]: `always-single-line`, [COMMA_SPACE]: `always` }, COMMA_SPACE)).toBe(true)
	})

	it(`a property the comma rules pass over, whose head run is the colon rules' alone`, () => {
		expect(ask(`a { #{$p}: ,c }`, { [SCSS_COLON_SPACE]: `never`, [SCSS_COMMA_SPACE]: `always` }, SCSS_COLON_SPACE, scssSyntax, scssParse as typeof parse)).toBe(true)
		expect(ask(`a { b+: ,c }`, { [LESS_COLON_SPACE]: `never`, [LESS_COMMA_SPACE]: `always` }, LESS_COLON_SPACE, lessSyntax)).toBe(true)
		expect(ask(`a { b: ,c }`, { [SCSS_COLON_SPACE]: `never`, [SCSS_COMMA_SPACE]: `always` }, SCSS_COLON_SPACE, scssSyntax)).toBe(false)
	})

	it(`a comma that does not open the value, or a comment between the colon and the comma, whose runs are two`, () => {
		expect(ask(`a { b: c ,d }`, { [COLON_SPACE]: `never`, [COMMA_SPACE]: `always` }, COLON_SPACE)).toBe(true)
		expect(ask(`a { b: c ,d }`, { [COLON_SPACE]: `never`, [COMMA_SPACE]: `always` }, COMMA_SPACE)).toBe(true)
		expect(ask(`a { b: /*c*/ ,d }`, { [COLON_SPACE]: `never`, [COMMA_SPACE]: `always` }, COLON_SPACE)).toBe(true)
		expect(ask(`a { b: /*c*/ ,d }`, { [COLON_SPACE]: `never`, [COMMA_SPACE]: `always` }, COMMA_SPACE)).toBe(true)
	})

	// The run behind a block comment on the colon's line, which the newline rule of the colon reads past the comment and the comma rules read as the comma's
	it(`a comma opening the value behind a comment on the colon's line, whose run the colon newline rule shares with the comma rules: a pair asking for different things is held as over the head run, and a rule ahead that has warned frees the write`, () => {
		expect(ask(`a { b: /*c*/ ,d }`, { [COLON_NEWLINE]: `always`, [COMMA_SPACE]: `always` }, COLON_NEWLINE)).toBe(false)
		expect(ask(`a { b: /*c*/ ,d }`, { [COLON_NEWLINE]: `always`, [COMMA_SPACE]: `never` }, COLON_NEWLINE)).toBe(false)
		expect(ask(`a { b: /*c*/ ,d }`, { [COLON_NEWLINE]: `always`, [COMMA_SPACE]: `never` }, COMMA_SPACE)).toBe(true)
		expect(ask(`a { b: /*c*/ ,d }`, { [COMMA_SPACE]: `never`, [COLON_NEWLINE]: `always` }, COMMA_SPACE)).toBe(false)
		expect(ask(`a { b: /*c*/ ,d }`, { [COMMA_SPACE]: `never`, [COLON_NEWLINE]: `always` }, COLON_NEWLINE)).toBe(true)
		expect(ask(`a { b:/*c*/,d }`, { [COLON_NEWLINE]: `always`, [COMMA_NEWLINE]: `never-multi-line` }, COLON_NEWLINE)).toBe(false)
	})

	it(`the same, where the two ask for the same thing or the standing run satisfies one, so both write or the content one holds nothing`, () => {
		expect(ask(`a { b: /*c*/ ,d }`, { [COLON_NEWLINE]: `always`, [COMMA_NEWLINE]: `always` }, COLON_NEWLINE)).toBe(true)
		expect(ask(`a { b: /*c*/ ,d }`, { [COLON_NEWLINE]: `always`, [COMMA_NEWLINE]: `always` }, COMMA_NEWLINE)).toBe(true)
		expect(ask(`a { b: /*c*/\n,d }`, { [COMMA_NEWLINE]: `always`, [COLON_NEWLINE]: `always` }, COLON_NEWLINE)).toBe(true)
		expect(ask(`a { b: /*c*/ ,d }`, { [COLON_SPACE]: `never`, [COMMA_SPACE]: `never` }, COMMA_SPACE)).toBe(true)
	})

	it(`a comment the head run's break keeps off the colon's line, behind which the colon newline rule does not read, and a comment in front of a word that is no comma`, () => {
		expect(ask(`a { b:\n/*c*/ ,d }`, { [COLON_NEWLINE]: `always`, [COMMA_SPACE]: `never` }, COMMA_SPACE)).toBe(true)
		expect(ask(`a { b:\n/*c*/ ,d }`, { [COLON_NEWLINE]: `always`, [COMMA_SPACE]: `never` }, COLON_NEWLINE)).toBe(true)
		expect(ask(`a { b: /*c*/ d }`, { [COLON_NEWLINE]: `always`, [COMMA_SPACE]: `never` }, COLON_NEWLINE)).toBe(true)
		expect(ask(`a { #{$p}: /*c*/ ,d }`, { [SCSS_COLON_NEWLINE]: `always`, [SCSS_COMMA_SPACE]: `never` }, SCSS_COLON_NEWLINE, scssSyntax, scssParse as typeof parse)).toBe(true)
	})
})

describe(`sharesRunWithSemicolon`, () => {
	it(`the run of a value that is nothing but whitespace, which both colon rules share with the semicolon`, () => {
		expect(shares(`a { b: ; }`, COLON_SPACE)).toBe(true)
		expect(shares(`a { b: ; }`, COLON_NEWLINE)).toBe(true)
		expect(shares(`a { b:; }`, COLON_NEWLINE)).toBe(true)
		expect(shares(`a { --b: ; }`, COLON_NEWLINE)).toBe(true)
	})

	it(`the run behind a comment on the colon's line, which the newline rule shares and the space rule does not`, () => {
		expect(shares(`a { b: /*c*/ ; }`, COLON_NEWLINE)).toBe(true)
		expect(shares(`a { b: /*c*/ ; }`, COLON_SPACE)).toBe(false)
	})

	it(`a declaration whose runs are two, or one a side passes over`, () => {
		expect(shares(`a { b: c ; }`, COLON_NEWLINE)).toBe(false)
		expect(shares(`a { b: !important ; }`, COLON_NEWLINE)).toBe(false)
		expect(shares(`a { b: }`, COLON_NEWLINE)).toBe(false)
	})

	it(`a rule that is none of the four, and the names of the asking rule's own namespace`, () => {
		expect(shares(`a { b: ; }`, `@stylistic/color-hex-case`)).toBe(false)
		expect(shares(`a { b: ; }`, `@stylistic/scss/declaration-colon-newline-after`)).toBe(false)
		expect(sharesRunWithSemicolon({ ...css, namespace: `scss` }, lastDeclarationOf(`a { b: ; }`), result({}), `@stylistic/scss/declaration-colon-newline-after`)).toBe(true)
	})
})

/**
 * Asks whether the named rule's run of the last declaration of a stylesheet's first rule is the semicolon's too.
 * @param code - The stylesheet.
 * @param ruleName - The name of the asking rule.
 * @returns What `sharesRunWithSemicolon` answers.
 */
function shares (code: string, ruleName: string): boolean {
	return sharesRunWithSemicolon(css, lastDeclarationOf(code), result({}), ruleName)
}

/**
 * Asks whether a rule writes the run of the last declaration of a stylesheet's first rule.
 * @param code - The stylesheet.
 * @param rules - The rules the configuration lists, in the order it lists them.
 * @param ruleName - The name of the asking rule.
 * @param syntax - The syntax the asking rule is built over.
 * @param parser - The parser to read the stylesheet with, PostCSS's by default.
 * @returns What `writesSharedRun` answers.
 */
function ask (code: string, rules: Record<string, unknown>, ruleName: string, syntax: Syntax = css, parser: typeof parse = parse): boolean {
	return writesSharedRun(syntax, lastDeclarationOf(code, parser), result(rules), ruleName)
}

/**
 * Parses a stylesheet and picks the last declaration of its first node, behind any comment, or that node where it is a top-level declaration.
 * @param code - The stylesheet.
 * @param parser - The parser to read it with, PostCSS's by default.
 * @returns The declaration.
 */
function lastDeclarationOf (code: string, parser: typeof parse = parse): Declaration {
	let first = parser(code).first as Rule | Declaration

	return isDeclaration(first) ? first : first.nodes.findLast(isDeclaration) as Declaration
}

/**
 * Builds the least of a Stylelint result that holds a configuration.
 * @param rules - The rules the configuration lists.
 * @returns The result.
 */
function result (rules: Record<string, unknown>): PostcssResult {
	return { stylelint: { config: { rules } } } as unknown as PostcssResult
}
