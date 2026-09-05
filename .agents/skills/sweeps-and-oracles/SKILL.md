---
name: sweeps-and-oracles
description: Build a corpus that can see the change, and read what the oracles and sweeps report without over-reading it. Use when writing a sweep, running `make oracles` or `make sweep`, quoting a row count in a spec, commit body or PR, or concluding that a branch moved nothing.
---

# Sweeping, and reading what a sweep says

The corpus is the oracle. Everything below is a way a run came back clean over a defect that was standing right there.

## What the instruments cannot see

- **`make oracles` runs css, `postcss-scss` and `postcss-less` only** (`scripts/oracles/runs.mjs`), and so does `scripts/sweeps/run.ts`. `postcss-styled-syntax` and `postcss-html` are reached by no oracle at all: a branch can come back "0 rows added" while corrupting every file of those two. Any change touching `indentation`, or turning on what a `Root` is, sweeps those two by hand and puts the numbers in the PR — and enumerates all four roots, a whole file's, a `<style>` element's, a styled template's and an inline `style` attribute's, saying which of them move. Since the syntax split `lib/rules/index.ts` builds every rule for `styled` too, so `@stylistic/styled/<any rule>` exists and a change to any rule reaches a styled template. Note that a twin is not a twin there — the host language is JavaScript, whose line terminators are LF, CR and U+2028/U+2029 and **not** a form feed, so respelling `\n` as `\f` changes the JavaScript rather than only the CSS.
- **Which break character a fix writes is invisible to all five.** `twins.mjs` respells every fixture into one break and normalises both outputs back to a line feed before comparing, so the character a fix wrote is exactly what it takes out; the other four never ask about spelling. For a branch on that axis, do not promise an oracle row will move — say in the PR *why* the journal row repeats the one above it.
- **`converge.mjs` builds a config of one rule at a time**, and `testRule` lints one rule at a time, so every interaction between two rules is invisible to both.
- **A rule the base's registry lacks** makes `converge` report one `broke` row per fixture and syntax over the base (120 on one new-rule branch), and the diff reads them as rows the branch removed. Name the count and its cause, and read the other five oracles for the real answer.

## A clean run over a shape no fixture carries

`+0 −0 ~0` on all six boards proves nothing when no fixture holds the shape the branch is about. Before writing "the boards do not move", say **why** they cannot; then sweep the shape across the whole registry — `RULE_OPTIONS` from `scripts/oracles/options.ts`, three syntaxes, the fixer run to a fixed point, a row wherever the output cycles, never settles, stops parsing, or still carries a warning. 1 872 runs took under a minute and turned up a defect standing on the base. (`unicode-bom: always` reports on every file and is not a row.)

Likewise, **"base and branch are byte-identical over N runs" is evidence of nothing on its own** — a corpus that never reaches the changed lines answers the same way. Break the code in one place and re-run: the rows that move are the corpus's reading of that line. One mutant per line the change rests on, the counts in the commit body beside the identity claim, and the mutants named in the same order as the numbers. **A mutant that moves nought rows is a hole in the corpus, not a dead line** — on one branch two of five mutants moved nothing until the corpus was widened from 14 400 runs to 75 456, and those two were the lines no test pinned either.

## Every spelling, and cross the axes

A form has to appear in **every spelling the options distinguish**: a single space, a line break, and a run of two or more spaces or tabs. One spelling measures that spelling, not the form — a corpus holding `f(1 / ,2)` alone could not see two runaway-growth rows, because a single space already satisfies `always`.

Five more ways a corpus goes blind, each of which cost a review round:

- **A position beside a container is not a position inside it.** A comment in every position *beside* a node and none inside a call missed two defects. A tail written in a nested declaration rather than inside the at-rule's parentheses meant no rule of the media family could reach it, and "no row moves in at-rule parameters" was the corpus talking about itself.
- **A spelling whose value depends on the rest of the form is an axis of its own**, and a constant string never reaches it. Four literal spellings of an empty grid row answered "0 warnings taken away"; a spelling derived from the neighbouring rows' width turned that into 48.
- **A corpus that puts the subject into every form it generates is blind to what the branch does where the subject is absent** — which is where a narrowing guard does its harm. Carry a **control set**: values spelling the subject's characters where they mean nothing, expected not to move.
- **The part of the form the branch is not about is an axis too.** A corpus holding the property to `b` and `--b` across 2 160 forms hid a defect that lived in the property, and six oracles, three sweeps and a compiler check over 671 moved forms all passed.
- **A corpus varying one axis is blind at that axis's edges, and its silence reads like a measurement.** Fourteen spellings of a `url()` name all put the escape at the front; the class that mattered put it at the boundary. Put a fixture in where the feature sits at each **end** of its run and at the join with its neighbour, and read the direction of the moved rows: if every row moves one way, ask what shape would move the other and build it by hand.

**Cross the axes rather than laying them beside each other.** A corpus spelling the comment inside a `url()`'s parentheses on one axis and the parenthesis's spacing on another never crossed them, so it held `url("a" // c)` and `url( "a" )` but never `url( "a" // c)` — which is where the corruption lived. Spelling a comment's line breaks and a call's with one axis made a mutant three times weaker than it read.

Two shapes specific to this plugin:

- **A closing brace alone on its line hides every harm a brace-moving fix does.** `block-closing-brace-space-before` and `-newline-before` pull the brace onto the previous line and whatever stood behind it comes along; where that line ends in an inline comment, the neighbour is commented out. Put a rule or a declaration behind that brace in at least one fixture, and compile both files.
- **Sweeping for a fixer that writes into a `//` comment** means fixing each fixture twice — once as written, once with each `// c` replaced by a block comment of the **same width** — so both stylesheets hold the same code in the same lines and any difference is the comment's doing. Compare code tokens (drop `comment` and `space` tokens, strip whitespace, lowercase, normalise quotes, join) and compare the fixed file's comment texts against the **original's**. Put the comment in every position a fixer writes at, not only where it reads naturally. Beware a template that moves a character outside the comment in the control — that is a different stylesheet, not a control, and it produced 1 024 false findings.

**After the sweep, enumerate the matrix of (form or position) × (rule, primary option) that actually moves, and check that each cell has a test.** Counting moved rows cannot show a cell that never moved because no fixture reached it.

## Reading the output

- **Diff the rows, never the number.** A row can change shape without leaving: one branch left all five oracle numbers untouched and had still moved two `control` rows from "the twin is silent" to "both twins speak and disagree by a column". Load both JSON files and compare keyed on `(rule, primary, syntaxName, name)`, printing gone / new / changed separately.
- **A key is not a row.** `twins.mjs` reports a fixture once per break spelling, so the key collapses two, three or four rows into one — 15 keys, 21 rows on one branch. Diff on the key to see *what* moved; count `list.length` to write the number down.
- **`tmp/sweeps/<name>.md` lists at most 200 changed rows** and nothing in it says the listing was cut. A 222-row sweep listed 200, and the missing 22 were all of one syntax and one option, which read as a real difference between Less and the rest. Over 200 rows, derive the expected count from the corpus matrix or read the rows out of the store by key.
- **Passes only mean something at equal warnings.** `head.passes > base.passes` marked 26 of 288 runs "worse" where every one was `base 0p/1w` against `head 1p/0w` — the base wrote nothing and left the warning standing. Worse is `!parses`, or more warnings, or, at the same warning count, more passes.

## Measure the cost, not only the fix

A guard that turns a node away costs a false negative by construction, and the run that justifies the guard is built around the harm it removes. One branch counted writes into a comment's text — 460 before, 0 after — and the question the sweep never put was how many *warnings* go: **920**, half of them about a parenthesis the file really spells.

Whenever a change makes a rule report **less**, run a second sweep over the same corpus with `fix: false` and diff the warning lists rather than the outputs. Report the count and the split by message, then argue the trade rather than hiding it, and put one sentence of it in the changelog.

For a **narrowing**, counting the rows where the warning count fell measures another thing: on one branch that number was 180 while the shape the sentence described stood on 510 rows, and the example given was in the 510. Measure the cost in the output — tokenize both sides' fixed text with `@csstools/css-tokenizer` and count the tokens still wrong by the rule's own contract, then count the rows where the branch has such a token and the base does not. Pair it with the opposite check: over every row, take the names the base's warnings carry that the branch's carry nowhere, and assert that none of them is real.

For a **widening**, the new form is judged by the bytes `--fix` writes, never by whether a warning appears. A fixer's guards rest on invariants of the containers it was written against, and a container class it has never met keeps none of them: two rows that looked fine as warnings came back with a comment erased and a semicolon behind a closing brace. List every newly reached form in the spec and run each through `--fix`, printing the output.

And when a change removes a cut, a guard or a filter, **list what stood downstream of it** and ask of each, on the branch rather than on the base, what it now sees. The reasoning that clears a neighbouring reading is always done against the base, where the thing being removed is still in place.

## The sweep store

`~/.cache/stylelint-stylistic/sweeps/<name>/` keeps `<key>.json` (the rows), `<key>.digest.json` and `<key>.meta.json` per measured tree — **one entry per tree the branch ever measured**, so "any non-base entry" is not the head. Select the base by `meta.lib === git rev-parse <base>:lib` and the head by `meta.lib === git rev-parse HEAD:lib`, and print both hashes. While a branch is uncommitted the working tree is ahead of HEAD and the lookup finds nothing: take the newest entry whose `meta.revision` is `worktree`, then rerun after the commit to confirm. Editing so much as a comment in the sweep module changes `meta.sweep` and re-measures both sides from scratch — the rows should come back identical, which is worth asserting.

A key can end up with a digest and no rows — a run that died between writing the two, or a result the collector took out before #554, which left the digest standing — and `make sweep` then throws `The store holds the digest of <name> and not its rows`. That is cache state, not a defect of the branch: `make cache-gc` takes out every file standing under a key with no meta beside it, and the rerun measures the side afresh.
