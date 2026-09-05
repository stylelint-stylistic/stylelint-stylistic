---
name: outward-prose
description: Write a commit body, a changelog entry, a PR body, an issue comment or a code comment so that no sentence in it is a claim nobody ran. Use before committing, before opening or editing a pull request or an issue, and whenever a review round has come back with findings that are all prose.
---

# Prose that goes outward

The pattern this exists for: **the code is clean from round one and every finding of every round is in the sentences around it.** Three rounds, zero code defects, eighteen prose findings. Four rounds, zero code defects. Five rounds, twenty-two. Six rounds, ten. Every one of those rounds cost a full review cycle.

## Every sentence is a checkable claim

Before writing a sentence that names a behaviour, an option or a number, run it. If it was not run, either run it or leave it out.

- **A number reached by arithmetic on a measured one is not measured.** "312 × 3, because the corpus tripled" gave 936; the run gave 312.
- **A pair of numbers must be in one unit.** "378 warnings gone, 108 new" counted rows on one side and warnings on the other; in warnings it was 1 404 against 324.
- **A control is a claim of the same kind.** A fixture named as the control of a probe turned out to be a second face of the bug, measured and mislabelled in one line.
- **A count goes stale the moment a later round adds cases.** "Eight accept cases" was right when written and wrong two edits later. Recount after *every* edit, not once.
- **An enumeration is a claim of completeness**, and a closed list of characters, positions or shapes is where a round finds its finding. A class of two was named as one shape; twenty-one characters behaving alike were listed as five.
- **A metric must have the sentence's own subject.** "180 rows" counted rows where the warning count fell, under a sentence about what `--fix` writes.
- **A witness must be one the base actually produced.** `10PX\0#fff` was described as what the base read, when the base read `PX\` there.
- **A census counted by hand is wrong.** Count every subset by key, in a script that prints every number the paragraph quotes under a label and splits each headline count into subsets that sum to it — then write the paragraph **from its output only**.

## Correcting prose introduces claims

Rewriting a sentence to fix one clause re-asserts every other clause in it, and those go out unrun. Two of three rounds on one branch found falsehoods the *previous* round's correction had put there; another repeated it three rounds over one census paragraph, another four. A correction reads as careful by construction, so nobody re-runs the sentence around it.

**The cure that costs nothing: cut, do not recount.** Delete the false clause rather than replacing it; drop the census from the commit body rather than recounting it. A number or a closed list earns its place only if a script prints it — otherwise say the weaker thing that needs no census. Rounds fell from fourteen findings to two once the surface shrank.

Before rewriting a sentence, list every factual claim the **new** text will make, the clauses carried over unchanged included, and run each.

## Inherited prose is your claim

When a fix rewrites a code comment, the clauses it keeps from the previous branch stop being that branch's claims and become the new commit's. They read as already-reviewed and are therefore never run. One branch kept three sentences verbatim; all three were false and review caught all three.

Treat every sentence inside an edited block as newly written, whoever wrote it. Run the claim or cut the clause.

## Justify with an engine, never with a reason

Whenever a JSDoc, a README, a changelog entry or a commit message says a rule leaves something alone *because the syntax requires it* — or forbids it, or reads it a certain way — that is a testable claim about a language, and it lands in four places at once. Run it past dart-sass, `lightningcss` or the Less compiler before writing it anywhere. One narrowing was right and its stated reason false, and the reason had already been copied into the JSDoc, the README, the changelog and the commit before review caught it.

Write the behaviour first and the justification last, after the probe. A reason phrased as "this rule is named for X, and this is not an X" needs only the rule's own name and docs, and is usually the stronger of the two. When a claim is disproved, grep for it — it is never in one place.

**Keep the engine survey in the spec.** A claim quantified over the positions of somebody else's grammar leaks on every round: "Less refuses it at the double slash" → it refuses at the colon, one character earlier → "in an at-rule's parameters Less takes such a name" → `@import` refuses both spellings → "`@media` is the one place" → `@supports` takes it too, and the opposite way. Nine findings over three rounds, none a defect in the fix. Ask what the fix would still be right without, say that, and stop; the survey stays in the spec beside the table of runs that produced it. When a witness has two sufficient causes, swap it for one that isolates the question.

## A reading change ages every description

A branch that changes **how** a rule reads a file makes every test-case description naming the old reading false at once — and no test goes red, because the descriptions are prose beside assertions that still pass. Twelve descriptions across three suites went false in one branch, and five review rounds turned them up one or two at a time because each round looked only where the diff had been.

When a branch changes a reading, grep every description in the rule's suites — core plus each namespace — for the words naming the old one («parser», «opened», «closed», «node», «reached»), check each against the new parse with a probe rather than by eye, do it in one pass before the first review round, and say in the commit how many were reworded and that what they assert is unchanged. A description naming the mechanism ages; one naming the fixture does not.

## Twin rules need twin examples

`function-parentheses-space-inside` and `function-parentheses-newline-inside` carry paragraphs written once and pasted into both. The reasoning is genuinely shared; the **examples are not**, because `always` asks for a single space in one rule and a line break in the other. A pasted paragraph demonstrated the opposite of the sentence it stood in, and two review passes went by. The same holds for `media-feature-parentheses-space-inside`.

Any sentence in those files naming a concrete value is run through **both** rules before it is committed. Give each file its own value and keep the surrounding wording parallel.

## Never quote a hash you have not printed

A hash carries no meaning to check it against, so a wrong one is invisible to you and fatal to whoever receives it. Twice a review subagent was sent after a commit that did not exist, and both rounds had to be run again. Run `git rev-parse --short HEAD` in the same turn that names the SHA and copy it from that output. The same holds for a PR number, a branch head, and a line number in a file edited since it was read.

Note also that recalling a hash from earlier in the conversation is recall, not measurement — the branch has been rebased since. And a stack merged in one go leaves its `mergeCommit` off `main` entirely; see the `stacks-and-issues` skill.

## The shell mangles prose silently

Every one of these fails quietly, and the result looks like success — the command exits 0, the commit is made, the issue is created:

- **A backtick inside a double-quoted string is command substitution.** An issue title went out with a hole in it. Single-quote any string holding backticks, or pass the text through a file.
- **A search string of plain spaces does not match bound prose.** Everything through `beautypography` holds `U+00A0` between function words, so a `sed` or Python replacement written with ordinary spaces finds nothing and replaces nothing. This has bitten about eight times across five sessions, wearing a different coat each time: a no-break space typed into a heredoc arrives as a plain space; a character class `[  ]` typed with a literal one arrives as two plain spaces; `re.escape` in Python 3.7+ leaves a space unescaped, so `re.escape(old).replace(r"\ ", …)` never fires.
- **A failing `python3 <<PY` heredoc does not stop the statements behind it.** The chain runs on and the commit is made with the edit unapplied — and a newline after the closing `PY` is not a join, so the `&&` has to join the heredoc itself to what follows.

**The cheap way through all of it:** read the file, build `norm = text.replace(chr(160), " ")`, find `old` in `norm` asserting it occurs exactly once, and splice `new` into `text` at that index — the replacement is one character for one, so the offsets agree and neither the search string nor a character class needs a no-break space at all. Write the replacement with plain spaces and let `make prose` bind it.

**Assert every match before replacing** — `assert old in text` costs one line and turns a silent no-op into a stack trace. Then read back what landed: `git log -1 --format=%B`, `gh issue view <n> --json title`, `gh pr view <n> --json body`.

## Binding

`make prose` walks the repository's Markdown files, but the convention covers commit messages (subject line included), PR bodies and issue comments too. Write the text to a file first, run `beautypography <path>` on it — the command takes explicit paths, inside the repository or not, ending in `.md` or not — then `git commit -F <path>`, `gh pr create --body-file <path>`, `gh issue comment --body-file <path>`. Bind before sending; text already published is left as it is.

**Never pass a path under `.claude/`.** An explicit path bypasses the directory skip, and those files are written in Russian, where the function-word list does nothing and the number and dash rules do harm — 643 no-break spaces went into the plan that way. If it happens, the undo is exact: replace every `U+00A0` with a plain space, since those files hold none of their own.

To fix messages already made, `git reset --hard <base>` and cherry-pick each commit back with `git commit --amend -F <bound message>`; the tree stays byte for byte the same, verified with `git diff <old-head>..HEAD`.
