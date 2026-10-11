/**
 * An address whose comma's run a fix may not take, standing in a media query list whose comma opens the parameters.
 *
 * A break written into parentheses PostCSS holds as one plain token would make them code, so `writesKeepingAddresses` refuses the fix before the comma inside them there and the node keeps that break, however the rule's other writes leave the rest: `never-multi-line` reads the list as the writes given leave it and writes a space at the edge only where the list is on one line once they are given, so a space is not written into a list its own refusal keeps multi-line and the warning stands without a write. Every run the options distinguish stands in front of the comma opening the parameters and in front of the comma inside the address, and a list whose every run in front of a comma is writable is the control.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The run in front of each comma. */
const RUN: Record<string, string> = {
	"none": ``,
	"space": ` `,
	"twoSpaces": `  `,
	"tab": `\t`,
	"break": `\n`,
}

const name: Sweep[`name`] = `media-list-edge-run`

let addressForm = multiply({ edge: RUN, run: RUN }, ({ edge = ``, run = `` }) => `@media${edge}, url a (y${run},z)(b"c)d") { b { c: "d" } }`).map(([key, text]): [string, string] => [`address|${key}`, text])
// The same list without an address, every run writable
let plainForm = multiply({ edge: RUN, run: RUN }, ({ edge = ``, run = `` }) => `@media${edge},a${run},b { b { c: "d" } }`).map(([key, text]): [string, string] => [`plain|${key}`, text])

const corpus: Sweep[`corpus`] = [...addressForm, ...plainForm]

/** The media list's comma family under every option, the two writes before a comma and the two behind it around the same shape. */
const configs: Sweep[`configs`] = [
	{ rule: `media-query-list-comma-newline-before`, primary: `always` },
	{ rule: `media-query-list-comma-newline-before`, primary: `always-multi-line` },
	{ rule: `media-query-list-comma-newline-before`, primary: `never-multi-line` },
	{ rule: `media-query-list-comma-newline-after`, primary: `always` },
	{ rule: `media-query-list-comma-newline-after`, primary: `always-multi-line` },
	{ rule: `media-query-list-comma-newline-after`, primary: `never-multi-line` },
	{ rule: `media-query-list-comma-space-before`, primary: `always` },
	{ rule: `media-query-list-comma-space-before`, primary: `never` },
	{ rule: `media-query-list-comma-space-after`, primary: `always` },
	{ rule: `media-query-list-comma-space-after`, primary: `never` },
]

export { configs, corpus, name }
