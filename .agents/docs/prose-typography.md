# Prose typography

Prose binds function words to their neighbours with a non-breaking space (`U+00A0`), so that none of them is left dangling at the end of a line — the point of the whole convention is comfortable reading.

Bind to the word that *follows*:

- every article, preposition, conjunction and particle, however long it is — `an`, `into`, `under`, `through`, `because`, `whereas` are as much part of the rule as `a`, `of` or `and`;
- `not`, always, since cut off from what it negates it says nothing;
- every number spelled out, to what it counts or measures: two icons, three files.

Bind to the word *before*: an em dash, so that it never starts a line, and a number in digits, since a number far more often trails what it names than counts what follows it — issue 366, version 5, April 2, 2012. Where the word in front of such a number is itself bound to it, or where no word stands in front of it at all, it binds forward to what it counts instead: the 5 files, 22 kilo. The name of a work stays in one piece the same way, whatever it is made of — Keep a Changelog, Semantic Versioning.

Verbs stay free, however short they are: `is`, `can`, `do` and `does` are bound to nothing. An auxiliary may therefore end a line while its `not` leaves for the next one together with the verb being negated — earlier revisions bound `do` and `does` to a following `not`, which is the same pair tied the wrong way round.

One case is still unsettled: `no`. It is left free everywhere for now, since it can stand with nothing to attach to. The one exception is `no longer`: a single adverb spelled in two words, it never splits. More generally, a particle sometimes belongs to the preceding word rather than the following one — when that is clearly the case, follow the meaning.

## The binder

`make prose` applies all of this to every Markdown file in the repository, `LICENSE.md` aside, since a license is quoted verbatim, and `tmp/` and `.claude/` aside as well, neither of which the repository carries: both hold work a session keeps for itself, and a working tree may spell that work in another language than this one, where the binder would do harm rather than nothing. `make verify` runs the same pass as `make prose-check`, which writes nothing and fails on the first file left unbound.

Both call [@firefoxic/beautypography](https://github.com/firefoxic/beautypography), which owns the convention and the lists it needs — the pairs it must leave alone, the names it keeps whole — so an exception is taught there and arrives here with the next version of the package. It is a helper, not an oracle: it cannot tell a conjunction from a pronoun, nor a verb in front of a number from the thing the number counts. Read the diff it produces, and when meaning disagrees with it, the meaning wins.
