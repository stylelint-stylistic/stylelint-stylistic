---
name: engine-probes
description: Ask a real engine what a stylesheet means instead of reasoning about tokens — the Less compiler, lightningcss, dart-sass, and a custom syntax's own parser. Use when a fix rests on what a language accepts or refuses, when a probe has to see what a preprocessor makes of a fixture, or when a review asks for the evidence behind a claim about a grammar.
---

# Asking an engine

A parser is not a compiler, and this plugin holds parsers. Anything phrased as "is this text a valid X" is that language's grammar, and a guard carrying a piece of it carries a piece that will be wrong somewhere. Four readings of one Less question were written and measured, and the first three each leaked in the dangerous direction; the fourth stopped approximating and decided by the **shape of the node** — a mixin call by its mark, a detached-ruleset call by `params === "()"` with an empty `raws.afterName` — answering everything else the safe way. Zero dangerous rows over 74 spellings, at the price of 28 correct fixes out of 144 changed outputs.

**When a guard needs a language's judgement, look for a reading the parser already made** — a flag it set, a node kind, an exact string — and prefer it over any test of the text, even a much narrower answer. A guard that only ever declines a fix is safe to make too broad and never safe to make too narrow, so put every doubt on the declining side and measure the price with a sweep.

The same holds one layer down: whatever question is really "what will `postcss-value-parser` do with this text", **the parse is the only answer that cannot part from itself.** Two hand-written readings of what it pairs each leaked one review round apiece, one of them not knowing the url mode (`parse.js:177`, where a literal lower-case `url` before `(` with no mark behind it takes everything to the next unescaped `)` as one word). And both parsers export their tokenizers — `postcss/lib/tokenize` and `postcss-scss/lib/scss-tokenize` are entry points their `exports` name — so a question about what a raw's parser read is asked of the engine rather than modelled; six rounds of review each found the same class of defect in a hand-written reading of `raws.between`.

## Less

`postcss-less` settles **nothing** about a Less file: it round-trips output that Less refuses, and it reads `//` as code where Less does. `less.render(code)` settles it. Three measured answers, each the opposite of what the parser suggests:

- `a { color: pink // c}` — the parser reads the brace back out of the comment; Less fails with `Parse: Unrecognised input`.
- `a { @extend .b // c;}` — the parser keeps `.b // c` whole in `params`, and Less agrees: it renders the same with the brace on either line.
- `a { @x: 1 // c;}` — same `params`, but Less renders it as a variable declaration only while the brace stands on its own line.

Note *why* the second and third differ from what the prelude's value suggests: under Less whether a `//` opens a comment is answered by the tokenizer, not by the reader that produces the value. `entity()` runs first, `this.mixin.call(true)` matches with `elements()`, and the `skipWhitespace` behind that match carries `// …` to the end of the line into `parserInput.commentStore`; the attempt then fails and `restore()` puts the position back and leaves the comment store alone. The comment has been read. **Never conclude "the language reads no comment here" from what a prelude's value came back as** — ask the compiler with the write actually applied, and put something behind the closing brace on its line.

Install it outside the workspace: `pnpm add less --ignore-workspace` in a throwaway directory **outside** the repository (the session scratchpad works; there is no `npm` on the machine). A bare `pnpm add less` under `tmp/` is adopted into the workspace and writes a stray lock file at the repository root.

## lightningcss

Where a fix rewrites a value and the question is whether the output still means what the input did, `transform({ filename, code: Buffer.from(css), minify: true })` answers it: a calculation that folds is one it read, one that comes back unfolded is one it did not. It is what proved a `never` option was writing declarations a browser drops.

It is a **witness to what one engine reads, never an authority on the grammar** — css-values-4 asks for whitespace on both sides of a sum operator while lightningcss and Gecko ask only for the whitespace in front, so a reading taken from the specification alone would have taken a working calculation away from real browsers. Say which of the two a pull request followed, and where they part.

It is nobody's dependency here: `pnpm why lightningcss` puts it under `vite`, which vitest is built on. Reach it by path from a throwaway probe under `tmp/`, `node_modules/.pnpm/lightningcss@<version>/node_modules/lightningcss/node/index.mjs`, resolving the version rather than pasting one. Never import it from `lib/` or `scripts/`, and never add it to `package.json`.

`@csstools/css-tokenizer` is a different thing and not a borrowed oracle at all — it is a direct dependency of the plugin, and a probe may import it by name.

## A custom syntax

`postcss.parse` **is** the default CSS parser: it ignores `opts.syntax` and `opts.parser`, which only the processor pipeline reads. So `postcss.parse(code, { syntax: scss })` reports a plain-CSS AST while looking like an SCSS one, and the difference is quiet rather than loud — it showed `raws.value` as `undefined` with the inline comment left in `decl.value`, hiding the `{ raw, value, scss }` triple the SCSS parser actually builds, and sent a fix down the wrong branch.

Write `import scss from "postcss-scss"; scss.parse(code)` instead, or run the fixture through `stylelint.lint({ code, customSyntax })` and print the node from inside the rule.

## Where a probe lives

Node resolves `node_modules` from the script's own directory, so a probe that has to import `stylelint`, `postcss-scss` or the plugin lives **inside the repository** — under `tmp/`, which is the directory set aside for it and is git-ignored, or as a dotfile at the root deleted before `make verify`, which lints it otherwise. A probe that needs no dependencies of the repository (the Less one above) lives outside it. Keep a copy of anything worth keeping in the session scratchpad — a `git worktree remove` takes the repository copy with it.

## One claim worth having by heart

"Everything outside ASCII is a name character" is **false** for CSS. css-syntax-3 lists the non-ASCII ident code points explicitly, and `IDENTIFIER_CODE_POINT` in `lib/regexps.ts` spells exactly that list: U+00A0, U+2007, U+202F, U+3000, U+2028 and U+000B are **not** ident code points; U+00B7 and U+FEFF are. lightningcss is laxer — it reads every code point ≥ U+0080 as a name character. Before writing "non-ASCII, therefore a name character", run `IDENTIFIER_CODE_POINT.test(String.fromCodePoint(cp))` and ask lightningcss what it does with the declaration.
