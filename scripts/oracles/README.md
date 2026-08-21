# The three oracles

Three probes, each running every rule of the plugin against every primary option it accepts, over a corpus of the shapes that have gone wrong before. They ask three questions no test case in this repository can ask.

```shell
make oracles                        # writes tmp/oracles/{converge,control,comments}.json
make oracles OUT=tmp/oracles-before # anywhere else
```

The three take about a minute together, and each writes JSON: a list of rows, one per rule, option, syntax and fixture that answered wrongly. They can also be run one at a time — every script is executable and writes to standard output.

| Oracle | Asks |
| --- | --- |
| `converge.mjs` | Does `--fix` reach a fixed point, and does what it wrote still parse? |
| `control.mjs` | Does a `//` comment move a warning, against a block comment of exactly the same width? |
| `comments.mjs` | Does every comment the file held survive the fix? |

## What to do with them

**The diff is the finding, not the count.** Run all three before a branch and after it, and compare:

- a row the branch **adds** is a defect the branch introduced. File it from the branch that made it, rather than leaving it for the next review;
- a row the branch **removes** goes in the pull request body;
- a row that was there before and is there after belongs to an open issue, and the issue is where it is answered.

None of the three has to come back empty before anything can land. What they buy is that the size of the backlog is known, and that no fix quietly grows it.

Seven issues came out of the first run of them, [#231](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/231) to [#237](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/237). None had been filed, and none had been found by a review.

## Why a test case cannot ask any of this

`testRule` asserts `fixed` — the output of **one** run of the fixer, against one input. So:

- it never runs the fixer twice, which is what `converge.mjs` is for;
- it never compares two spellings of one file, which is what `control.mjs` is for;
- it asserts the whole output, so a deleted comment is caught only where somebody thought to write a case with a comment in it, which is what `comments.mjs` is for.

## The files

`runs.mjs` builds the list of runs every oracle makes — every rule, under every primary option, over every fixture — and each oracle is one loop over that list. `fixtures.mjs` and `options.mjs` are what it reads.

`fixtures.mjs` holds the shapes the convergence and comment runs read, and `control.mjs` carries its own, since every fixture there has to be written so that both spellings of its comment give the same code.

Both corpora are short on purpose — a row that fires on twenty fixtures says no more than one that fires on one, and every fixture costs the run three lints per rule and option. **Add a shape when a defect is found that the corpus did not catch**, and the oracle catches it the next time.

`options.mjs` lists every rule and its primary options, written out rather than read off the source, so that a run over an older commit compares with a run over a newer one. A rule gaining an option gains a line here in the same commit. Options taking a number or a shape rather than a keyword are given one or two representative values, and a rule whose secondary options change its behaviour is not covered at all — `ignore`, `ignoreFunctions`, `except` and the rest are all unexplored ground.

## What they cannot see

- No fixture reaches `at-rule-semicolon-space-before`, which [#139](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/139) names among the rules whose warnings an inline comment moves. The drift is real; the fixture for it is not written yet.
- `control.mjs` compares warnings and not outputs. A rule that correctly declines to write into a comment differs from its block-comment twin on purpose, so comparing the two outputs reports every guarded rule as a finding. Whoever wants the output half of that comparison has to tell the two apart first.
- **A fix that is wrong but tidy passes all three.** [#230](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/230) rewrites a Less calculation into two values and [#234](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/234) spells `!important` in capitals; both converge, both keep every comment, and neither turns on how a comment is spelled. The corpus carries `group-with-unit`, `nested-group` and `two-bangs` for them all the same, so that a later fix cannot make either shape worse without a row appearing — but finding such a defect in the first place still takes a reader.
