# The five oracles

Five probes, each running every rule of the plugin against every primary option it accepts, over a corpus of the shapes that have gone wrong before. They ask five questions no test case in this repository can ask.

```shell
make oracles                        # writes tmp/oracles/{converge,control,comments,twins,nodes}.json
make oracles OUT=tmp/oracles-before # anywhere else
```

The five take a few minutes together, and each writes JSON: a list of rows, one per rule, option, syntax and fixture that answered wrongly. They can also be run one at a time — every script is executable and writes to standard output.

| Oracle | Asks |
| --- | --- |
| `converge.mjs` | Does `--fix` reach a fixed point, and does what it wrote still parse? |
| `control.mjs` | Does a `//` comment move a warning, against a block comment of exactly the same width? |
| `comments.mjs` | Does every comment the file held survive the fix? |
| `twins.mjs` | Does a rule say the same thing about a file broken with a carriage return, a form feed or a Windows pair as about its line-feed twin, and does the syntax read the twin at all? |
| `nodes.mjs` | Does every declaration, rule and at-rule the file held survive the fix? |

The last two were written on 2026-08-22, after three branches in a row turned up bugs the first three could not see. Their first numbers are a census rather than a backlog: 372 rows of `twins.mjs` belong to a rule and 4 to none at all, and they are one bug wearing many faces, which [#250](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/250) counts. A twin is reported once, on the first disagreement it shows, so the number is a lower bound rather than a tally.

## What to do with them

**The diff is the finding, not the count.** Run all five before a branch and after it, and compare:

- a row the branch **adds** is a defect the branch introduced. File it from the branch that made it, rather than leaving it for the next review;
- a row the branch **removes** goes in the pull request body;
- a row that was there before and is there after belongs to an open issue, and the issue is where it is answered;
- a row that was there before and merely became **reachable** is none of those three. It belongs to the census it came from, and the branch says so in its pull request body instead of opening an issue of its own. Four issues were opened from one branch on 2026-08-22 for want of this line, and three of them were things a sweep turned up rather than rows that branch added.

None of the five has to come back empty before anything can land. What they buy is that the size of the backlog is known, and that no fix quietly grows it.

Seven issues came out of the first run of them, [#231](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/231) to [#237](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/237). None had been filed, and none had been found by a review.

## Why a test case cannot ask any of this

`testRule` asserts `fixed` — the output of **one** run of the fixer, against one input. So:

- it never runs the fixer twice, which is what `converge.mjs` is for;
- it never compares two spellings of one file, which is what `control.mjs` and `twins.mjs` are for;
- it asserts the whole output, so a deleted comment is caught only where somebody thought to write a case with a comment in it, which is what `comments.mjs` is for, and code swallowed into a comment that survives is caught by nobody at all, which is what `nodes.mjs` is for.

An oracle is worth what it can be shown to catch, and a probe that has never been seen to fire says nothing about the code. `nodes.mjs` reported nothing when it was written, because no fixture stood where a fixer takes a break away from an inline comment; `inline-after-brace` and `inline-after-semicolon` were written with it, and it then reported [#248](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/248) four times over.

## The files

`runs.mjs` builds the list of runs every oracle makes — every rule, under every primary option, over every fixture — and each oracle is one loop over that list. `fixtures.mjs` and `options.mjs` are what it reads.

`fixtures.mjs` holds the shapes the convergence, comment, twin and node runs read, and `control.mjs` carries its own, since every fixture there has to be written so that both spellings of its comment give the same code. `twins.mjs` writes every break of a fixture back as a line feed before respelling it, since respelling directly would turn an existing `\r\n` into two breaks and ask the rule about a file that is not the original's twin at all — and skipping such a fixture instead would drop the only shapes in the corpus that carry whitespace in front of a break, which is what [#247](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/247) turns on.

Both corpora are short on purpose — a row that fires on twenty fixtures says no more than one that fires on one, and every fixture costs the run about a dozen lints per rule and option. **Add a shape when a defect is found that the corpus did not catch**, and the oracle catches it the next time.

`options.mjs` lists every rule and its primary options, written out rather than read off the source, so that a run over an older commit compares with a run over a newer one. A rule gaining an option gains a line here in the same commit. Options taking a number or a shape rather than a keyword are given one or two representative values, and a rule whose secondary options change its behaviour is not covered at all — `ignore`, `ignoreFunctions`, `except` and the rest are all unexplored ground.

## What they cannot see

- No fixture reaches `at-rule-semicolon-space-before`, which [#139](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/139) names among the rules whose warnings an inline comment moves. The drift is real; the fixture for it is not written yet.
- `control.mjs` compares warnings and not outputs. A rule that correctly declines to write into a comment differs from its block-comment twin on purpose, so comparing the two outputs reports every guarded rule as a finding. Whoever wants the output half of that comparison has to tell the two apart first.
- **A fix that is wrong but tidy passes all five.** [#230](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/230) rewrites a Less calculation into two values and [#234](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/234) spells `!important` in capitals; both converge, both keep every comment, both leave every node standing, and neither turns on how a comment or a break is spelled. The corpus carries `group-with-unit`, `nested-group` and `two-bangs` for them all the same, so that a later fix cannot make either shape worse without a row appearing — but finding such a defect in the first place still takes a reader.
- **`comments.mjs` counts openings, and the corruption of [#272](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/272) keeps the count.** A comment opening `/*/` comes back out of `postcss-value-parser` as `/**/`, which turns one comment into a comment and three characters of code — but the `*` written in gives the text behind it an opening of its own, so `x/*/*a*/` and `x/**/*a*/` both tally two. The `slash-star-slash` fixture reaches five rules that printed a value that way, and the oracle came back clean from every one of them. Counting is what buys that oracle its cheapness, and telling this apart wants the openings placed rather than tallied.
- **`twins.mjs` sees only what the corpus holds.** `max-empty-lines`, `no-empty-first-line` and `addEmptyLineAfter` want an empty line or an empty first line, which no fixture carries, and `named-grid-areas-alignment` wants a *mis*aligned grid, which the `grid` fixture is not. All four come back clean from the run and wrong from a probe written for them by hand; they are measured in the census of [#250](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/250), and the fixtures for them are not written yet.
