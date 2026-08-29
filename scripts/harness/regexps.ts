/** The expressions the harness reads a text with, named the way `lib/regexps.ts` names its own. */

/** The first line break of a text as Stylelint reads one to fill `context.newline`: a line feed or a Windows pair, and nothing else — `lintPostcssResult.mjs` matches exactly this. */
const BREAK_AS_STYLELINT_READS_IT = /\r?\n/u

export { BREAK_AS_STYLELINT_READS_IT }
