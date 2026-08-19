<!-- markdownlint-disable MD024 -->
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com), and this project adheres to [Semantic Versioning](https://semver.org).

## [Unreleased]

### Changed

- False negatives are fixed — a violation the plugin used to pass over in silence, whether `--fix` was asked for or not, is now reported:
	- The `selector-descendant-combinator-no-non-space` rule now reads a selector whose comment the parser carries across a parenthesised group (see [#159](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/159)). A group standing where a combinator belongs is nothing `postcss-selector-parser` has a place for: it reads the group as a combinator whose value is the whitespace in front of it and the group itself, and files a comment standing between the two behind that node rather than inside it, so `.foo /*c*/\t( )\t.bar` came back out of the parser as `.foo ( )/*c*/\t\t.bar` — the comment across the group, and a tab where none was written. The rule passed such a selector over, and a list at a time, so a run standing in a neighbouring selector went unreported with it. The node is given its own text back now, so the group is reported where it stands and the whitespace behind it is collapsed like any other descendant combinator's, the comment keeping the place the file gives it. Only a comment with a space in front of it was ever read that way, however wide the whitespace is: that space is what the value of such a combinator opens with, while a comment standing behind a tab or a line break the parser already prints as the file spells it.
	- The `selector-descendant-combinator-no-non-space` rule now reads a selector carrying an inline comment under `postcss-scss` (see [#158](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/158)). That syntax rewrites such a comment into a block comment in the copy the rule reads, keeps the source spelling in the copy it prints, and the two drift apart by two characters per comment, so the rule used to pass the whole selector list over. Every position is now translated back into the file's own coordinates, and a fix is written to both copies with the comments spelled the way the file spells them. The whitespace standing behind an inline comment is passed over on its own: the line break in it is what closes the comment, so a single space could not be written there, and asking for one would leave a warning no run of `--fix` could clear.
	- The `selector-pseudo-class-parentheses-space-inside` rule now reads a selector carrying an inline comment under `postcss-scss` (see [#163](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/163)). It used to pass such a selector over, as [#161](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/161) left it: the two copies that syntax keeps of a selector drift apart by two characters per comment, so a position counted in the copy the rule reads points past the character it is about, and a fix written there never reaches the file. Both are answered now, so the pseudo-classes of such a selector are spaced out like any other. Where the whitespace in front of the closing parenthesis is the line break that closes an inline comment, that end is passed over instead: a space written there would take the parenthesis into the comment, and taking the break away would do the same.
	- The `selector-pseudo-class-parentheses-space-inside` rule now reports the whitespace standing in front of a closing parenthesis where a comment closes the arguments (see [#128](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/128)). The parser kept none of it, so the `never` options passed `a:not( /**/ )` over while reporting the same space in `a:not( b /**/ )`; both are now read alike.
	- The `declaration-colon-space-after` rule now looks for the whitespace after the colon where a custom property whose value holds a comment actually keeps it (see [#109](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/109)) ([@VChet](https://github.com/VChet)):
		- the `always` options no longer report `--a: /*comment*/ !important;`, whose single space is already in place, and no longer pass over `--a:/*comment*/ !important;`, which has none at all;
		- their fix no longer adds a space of its own on every run, so two spaces or a tab after the colon now become the single space asked for;
		- the `never` option now takes the whitespace away instead of reporting a fix and leaving the declaration as it was, and no longer reports one that has no whitespace to begin with;
		- a space or a tab standing in front of the colon is no longer counted as one standing after it.
	- The `declaration-colon-space-before` and `declaration-colon-space-after` rules now work on the declaration's own colon instead of the first colon they come across (see [#92](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/92)). A comment standing in front of the colon may hold a colon of its own, an URL for one, and used to be taken for the declaration's:
		- the fix no longer edits the text of such a comment;
		- the `never` options no longer miss the real violation hiding behind it;
		- the `always` options no longer report a declaration that is already correct.
	- The `declaration-block-semicolon-newline-after`, `declaration-block-semicolon-newline-before`, `declaration-block-semicolon-space-after` and `declaration-block-semicolon-space-before` rules now check the declarations of an inline `style` attribute (see [#49](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/49)). A page gives such an attribute a root of its own with no rule inside it, and the four rules used to pass over every declaration whose parent is not a rule, so nothing was reported for `style="color: pink;top: 0;"` in an HTML, Vue, Svelte or Astro file, while the `<style>` block of the same page was checked as usual. The top level of a Sass file is left alone as before, since a variable written there is not a declaration block.
	- The `selector-descendant-combinator-no-non-space` rule now reports a parenthesised group standing after a space where a combinator belongs, `.foo (  ) .bar` for one (see [#125](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/125)). The rule used to read a combinator only where its value was a single space, so every such selector went past unseen; a group holding one space or none, `.foo ( ) .bar` and `.foo () .bar`, is reported alongside the rest. Nothing can be written to repair such a selector, so the problem is reported and the code left exactly as it was.
	- The `selector-descendant-combinator-no-non-space` rule no longer turns itself off for a selector carrying a comment (see [#124](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/124)). One comment anywhere in a selector list used to silence the rule for the whole list, so a violation standing in a neighbouring selector went unreported along with it:
		- a descendant combinator holding comments is now measured run by run, each stretch of whitespace reported at its own position and collapsed on its own, so that every comment stays where the author put it;
		- the whitespace after a comment that follows a combinator of another kind, `.foo > /*comment*/  .bar` for one, is passed over, since there is no descendant combinator there to measure;
		- an illegal combinator carrying a comment, `.foo /*comment*/ (  ) .bar` for one, is reported as [#125](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/125) has it, and left exactly as it was.
		- a selector carrying an inline comment is read as well, which was [#158](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/158) and is answered below.
		- a selector the parser does not give back as it took it is passed over too, which is [#159](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/159): a comment standing in front of a parenthesised group is filed behind it, and nothing the rule could say about such a selector would match the file.
	- The `indentation` rule now measures the lines a comment used to hide from it (see [#194](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/194)). A selector line holding nothing but a block comment was blank in the copy the rule read and passed over in silence, and is brought to its level now, in a plain CSS file as under `postcss-scss`. A pair of literal slashes in a plain CSS selector — text to CSS, which has no comment of that kind — used to swallow the line break behind it whole, so the lines after it went unmeasured too, and are measured now. And a line that was already at its level behind a comment is no longer reported at a drifted position, so a false warning goes with the false silences.
	- The `indentation` rule now reports every mis-indented line of an at-rule's parameters holding comments, at the line and column the file spells (see [#65](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/65)). The lines were sought in a copy of the parameters with the comments taken out: a line holding nothing but a comment was blank there and passed over in silence, and the warning that did appear was placed by an offset into that shorter text, at `1:30` where the file has `2:3`. The scan reads the copy the file spells now and the fix writes to it, so both mis-indented lines of the issue's `@use './button' with ( … )` are reported, each asking for the `1 tab` it needs, and every comment survives the fix that used to strip all three.
- A warning now asks for what its option asks for:
	- The `value-list-comma-space-before` rule no longer says `Unexpected whitespace` where `always-single-line` wants a space put in (see [#175](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/175)). The message of that option was spelled with the text of the `never` ones, telling the reader to take away the very space the fix then writes, and every sibling rule already words it the other way around. It reads `Expected single space before "," in a single-line list` now.
- False negatives under `--fix` are fixed — a warning that used to vanish along with a fix that never reached the file now survives the run:
	- A fix written to a declaration's value or to an at-rule's parameters now reaches the file under `postcss-scss`, even where that value or those parameters hold an inline comment (see [#115](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/115)). That syntax keeps two copies of such a text and prints the one no rule was writing to, so `--fix` used to report a clean pass on a file it had not touched, and the warning went with it. Every rule that fixes a value or a set of parameters is affected:
		- the fix now arrives, so a stylesheet carrying a `//` comment converges instead of drawing the same warning on every run;
		- a position reported inside a value or a set of parameters no longer drifts two characters per comment, so it points at the character the warning is about;
		- the `media-feature-parentheses-space-inside` rule no longer rewrites every `//` comment of a media query into a block comment as a side effect of its own fix;
		- an inline comment closed by a bare carriage return, or by a form feed, no longer hides the rest of the declaration or of the media query from the rules that look through it for a bang, a comma, a colon or a range operator.
	- The `selector-attribute-brackets-space-inside` rule now writes its fix to both spellings of a selector carrying an inline comment under `postcss-scss` (see [#190](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/190)). The syntax keeps two — the raw the rule reads, with every `//` comment spelled as a block one, and the copy the file spells, which is the one that is printed — and the rule wrote only the first, so on such a selector `--fix` reported a clean pass on a file it never changed. The copies it left out of step also grew into corruption beside a rule that reads the pair: `.a // c` came back doubled, `.a // ca // c`, wider with every further run. The positions of its warnings drifted two characters per comment for the same reading, and stand in the file's own coordinates now.
	- Nine more rules now write their fix to both spellings of a selector carrying an inline comment under `postcss-scss` (see [#193](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/193)): `selector-pseudo-class-case`, `selector-list-comma-space-before` and `-after`, `selector-list-comma-newline-before` and `-after`, `selector-max-empty-lines`, `selector-attribute-operator-space-before` and `-after`, and `no-eol-whitespace`. Each wrote only the copy it reads, never the one the file spells and the stringifier prints, so on such a selector `--fix` reported a clean pass on a file it never changed — and left the two copies out of step for whatever read the pair next, the corruption of [#190](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/190). The positions of their warnings drifted two characters per comment for the same reading, and stand in the file's own coordinates now. In `no-eol-whitespace` the whitespace at stake may lie in the text of the comment itself, so that rule fixes the copy the file spells and refills the raw beside it, the way a declaration's value is written. And a comma whose whitespace holds the break that closes an inline comment is reported and left standing by the four `selector-list-comma-*` rules, since taking that break away, or writing a space over it, would carry the comma — or the rest of the list — into the comment's text.
	- A Less at-variable now keeps the fix written to it (see [#99](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/99)). `postcss-less` gives such a variable two copies of its text and prints the one no rule writes, so `--fix` used to leave the file exactly as it was and drop the warning along with it, reporting a clean pass on a file it never touched. This held for every rule that fixes an at-rule's parameters: `indentation`, `no-eol-whitespace`, `number-leading-zero`, `number-no-trailing-zeros` and `string-quotes`.
	- The `indentation` rule now corrects every mis-indented line of an at-rule, and not only one of them (see [#103](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/103) and [#64](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/64)). This holds for the parameters and for anything standing between the name and them, a multi-line comment for one. The remaining lines used to keep their indentation while all of the warnings disappeared, so a second run reported nothing left to fix.
	- The `unit-case` rule now fixes an at-rule whose name is not spelled in lower case, `@MEDIA` for one (see [#104](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/104)). Such a query used to be reported and then left exactly as it was, the warning disappearing with the fix, so the problem survived any number of runs.
	- The `selector-pseudo-class-parentheses-space-inside` rule now fixes the whitespace next to a closing parenthesis that a comment stands in front of (see [#123](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/123)). The parser keeps such a comment, and the space on either side of it, in the raws of the node before it, and prints the raw one; the rule wrote to the clean value instead, so the problem was reported, `--fix` claimed a clean pass and the parenthesis stayed exactly where it was. A nested pseudo-class was left half fixed at every level. Under `always` a line break in front of the closing parenthesis now collapses to a single space where a comment stands before it, as it already did where none does.
	- The `value-list-comma-space-after`, `value-list-comma-space-before` and `value-list-comma-newline-after` rules no longer drop the warning about a comma they cannot fix (see [#126](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/126)). A comma the value does not hold is out of their reach, and they said so by returning `false` from the fixer — a refusal Stylelint has never read, since it counts a fixer as applied whatever it does. So `--fix` ended with a clean pass on a file it had not finished fixing, and only a second run over the output brought the surviving problem back. A warning of that kind now stands where it used to vanish. A comma opening the value was among them at the time, and is fixed by all three rules now, which was [#134](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/134) for two of them and [#166](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/166) for the third.

### Added

- The `max-line-length` rule now has an additional `tabSize` option (see [#10](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/10)). A tab used to count as one character, so a file indented with tabs measured shorter than the editor showed it; with the option a tab reaches the next tab stop of the given width, as the CSS `tab-size` property has it, and the limit is the one the editor's ruler shows.

### Fixed

- A fix that could only be written by commenting the code out is now reported instead — an inline comment ends only with a line break, so the character an option asks for has nowhere to go:
	- The `function-parentheses-newline-inside` rule no longer takes the code behind a function's opening parenthesis into an inline comment standing in front of it (see [#129](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/129)). The line break in that whitespace is what closes such a comment, so the `never-multi-line` option cannot be satisfied without commenting out the rest of the value, and the problem is now reported rather than fixed.
	- The `media-feature-parentheses-space-inside` rule no longer takes the closing parenthesis of a media feature into an inline comment standing in front of it (see [#152](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/152)). The line break in that whitespace is what closes such a comment, so the `never` option cannot be satisfied without commenting out the rest of the query, and the problem is now reported rather than fixed.
	- The `media-query-list-comma-space-before` rule no longer takes a comma standing behind an inline comment onto that comment's line (see [#137](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/137)). The line break in front of the comma is what closes such a comment, so neither option can be satisfied without commenting out the rest of the query and the block behind it, and the problem is now reported rather than fixed.
	- The `value-list-comma-space-before` rule no longer takes a comma standing behind an inline comment onto that comment's line (see [#136](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/136)). The line break in front of the comma is what closes such a comment, so neither option can be satisfied without commenting out the rest of the declaration, and the problem is now reported rather than fixed.
	- The `function-comma-space-before`, `function-comma-space-after`, `function-comma-newline-before` and `function-comma-newline-after` rules no longer write into an inline comment standing in a function's arguments (see [#135](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/135)):
		- a comma standing behind such a comment is no longer taken onto its line, since the line break in front of the comma is what closes the comment, so the problem is now reported rather than fixed;
		- a comma standing inside the text of such a comment is no longer taken for a comma of the value at all, so nothing is reported for it and nothing written near it.
	- The `declaration-colon-space-before` rule no longer rewrites a declaration whose property is followed by an inline comment into code that does not parse (see [#88](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/88)). Such a comment ends only with a line break, so neither option can be satisfied without taking the colon into the comment, and the problem is now reported rather than fixed.
	- The `block-opening-brace-newline-before` rule no longer takes the opening brace into an inline comment standing in front of it (see [#89](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/89)). Such a comment ends only with a line break, so the `never-*` options cannot be satisfied without commenting the whole block out, and the problem is now reported rather than fixed.
	- The `declaration-bang-space-before` rule no longer takes `!important` into an inline comment standing in front of it (see [#116](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/116)). Such a comment ends only with a line break, so neither option can be satisfied without commenting out the flag and the semicolon behind it, and the problem is now reported rather than fixed. A double slash belonging to an address, or standing inside a string, opens no comment of that kind, so a flag written on the line under a value that ends in `url(http://example.com/a.png)` is still pulled up to it.
	- The `declaration-block-semicolon-space-before` rule no longer takes the semicolon into an inline comment standing in front of it (see [#117](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/117)). Such a comment ends only with a line break, so neither option can be satisfied without commenting the semicolon out, and `!important` along with it, and the problem is now reported rather than fixed. The `always` options no longer rewrite everything standing between the value and `!important` either, so a comment there, the line the flag is written on, and the spelling the flag itself was given, `!IMPORTANT` included, all survive the fix.
	- The `function-parentheses-newline-inside` rule no longer takes a function's closing parenthesis into an inline comment standing in front of it (see [#113](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/113)). Such a comment ends only with a line break, so `never-multi-line` cannot be satisfied without commenting out the parenthesis, and everything the declaration has left, and the problem is now reported rather than fixed. The `always` and `always-multi-line` options add a line break rather than take one away, and are unaffected.
	- The `function-parentheses-space-inside` rule no longer takes a function's closing parenthesis into an inline comment standing in front of it (see [#114](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/114)). Such a comment ends only with a line break, so no option can be satisfied without commenting out the parenthesis, and everything the declaration has left, and the problem is now reported rather than fixed. All four options are asked, the single-line ones included: a function whose only line break is a form feed passes for a single line, while Sass ends an inline comment on that character all the same. A value with no comment in it is fixed exactly as before.
- A fix no longer carries off what stands next to the character it changes:
	- The `selector-pseudo-class-parentheses-space-inside` rule no longer writes a descendant combinator into a selector whose comment closes a pseudo-class's argument (see [#161](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/161)). `postcss-selector-parser` keeps no whitespace between such a comment and the end of the argument it closes, and hands the run to whatever stands behind the closing parenthesis instead, so `a:not( /*c*/ ):is(b)` came back out of the parser as `a:not( /*c*/) :is(b)` — a compound selector turned into a descendant one, matching other elements than the author wrote it for. Every fix this rule made in such a selector carried that into the file, whichever pseudo-class of it the fix was made in, and no warning ever mentioned it. A comma does the same seen from the other side, `a:not(b, /*c*/ , c)` losing the space standing in front of it. The rule now gives the parsed selector back what the parser dropped before it measures anything, so a fix writes what the option asks for and nothing else.
	- The `string-quotes` rule no longer drops a comment standing in the selector when it fixes an attribute value there (see [#178](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/178)). The rule read `ruleNode.selector`, a copy PostCSS hands it with every comment taken out, and wrote the fix back to the same place, so `.foo /* x */ [title="y"]` came out of `--fix` as `.foo  [title='y']` — the comment gone and the whitespace it stood in left behind — and the warning pointed into the comment rather than at the quote it was about. The rule reads the text the file holds now and writes the fix to it, the way the other selector rules have since [#124](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/124): the comment keeps its place, the warning stands at the quote, and under `postcss-scss` an inline comment of the selector keeps the spelling the file gives it, its text never read as strings of the selector.
	- The `indentation` rule no longer carries off the comments of a selector it re-indents (see [#194](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/194)). It read and wrote `rule.selector`, a copy PostCSS hands it with every comment taken out, so its lines were measured against a text the file does not hold and its fix printed without the comments — `b // c` came back as `b ` with a trailing space, and a block comment in a plain CSS selector went the same way. The rule measures the copy the file spells now and writes the fix to it, refilling the raw beside it under `postcss-scss`, so every comment stays where the author put it. The text of each inline comment is blanked out of the scan's own copy, since `style-search` reads the line break that closes one as part of it and would pass the lines behind it over; the blanks keep every position where it was. A line holding nothing but an inline comment is the one thing left unmeasured, having no character for the scan to anchor its indentation on.
	- The `block-opening-brace-space-before` rule no longer removes a comment standing between the selector and the opening brace when fixing (see [#63](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/63)):
		- a block comment is kept, and only the whitespace next to the brace changes, so such a stylesheet can now be autofixed without losing anything;
		- an inline comment leaves the brace nowhere to go, since the comment ends only with a line break, so the problem is now reported rather than silently rewritten.
	- The `declaration-block-trailing-semicolon` rule no longer damages the block when it adds a missing semicolon after a bodiless at-rule (see [#87](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/87)):
		- a comment standing between the at-rule and the closing brace is kept;
		- the closing brace stays on its own line instead of being pulled up to the at-rule;
		- an inline comment leaves the semicolon nowhere to go, since the comment ends only with a line break, so the problem is now reported rather than silently rewritten.
	- The `indentation` rule no longer damages a declaration whose multi-line value holds comments when fixing (see [#62](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/62)). The mis-indented lines were found in the text that keeps the comments while the fix was written to a copy with the comments taken out, so every write landed past the line break it was aimed at — `--fix` cut the `0` out of `$somevar: ( /* some comment */ … 'a_property': 0 … )` and carried every comment off with it. Both sides work on the text the file holds now:
		- the fix re-indents every mis-indented line of the value, and the comments and the value survive it;
		- a comment closing the line that opens the parentheses no longer costs the warning a level, so the lines inside are asked for the `1 tab` they need where `0 tabs` used to be expected.
- A warning is no longer raised over code that is already right, nor over the text of a comment taken for code:
	- The `selector-pseudo-class-parentheses-space-inside` rule no longer reports a pseudo-class it has already fixed, where the last argument holds nothing but comments (see [#128](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/128)). The whitespace in front of the closing parenthesis was not in the parsed selector at all, so the `always` options asked for a space that was already there and went on asking however many times the fix was run, reporting it at a column that fell inside the comment. `a:not(/**/)` is now fixed into `a:not( /**/ )` once, and the output is left alone from then on. A run of several spaces in front of that parenthesis is left as it is now, as one standing anywhere else inside the parentheses always was. None of this reaches a selector carrying an inline comment under `postcss-scss`, which the rule reads from a copy of itself that spells every one of those comments `/* */` and writes its fix to a copy that is never printed; the rule reads and writes both copies now, which was [#163](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/163) and is answered below.
	- The `function-parentheses-newline-inside` rule no longer reports an opening parenthesis that an inline comment already follows correctly (see [#141](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/141)). The `always` options let a comment stand between the parenthesis and the line break they ask for, and used to walk past a block comment while stopping at an inline one, so a function already spelled the way the option asks was reported and then reformatted by the fix.
	- The `media-feature-parentheses-space-inside` rule no longer reads a media feature out of an inline comment standing in a media query, nor writes inside such a comment (see [#138](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/138)). A parenthesis in the text of a comment used to open a feature as far as the value parser was concerned, and the fix then put the space the option asks for into that text.
	- The `selector-combinator-space-before` rule no longer reports a combinator that opens a selector when a comment stands in front of it (see [#66](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/66)). A selector list broken over several lines and interleaved with comments is now left alone instead of being pulled onto one line. Two more things follow for this rule and for `selector-combinator-space-after` alike, whenever the selector holds an inline comment:
	- The `selector-combinator-space-before` and `selector-combinator-space-after` rules no longer drop the warning about whitespace they cannot write. A comment standing beside a combinator is folded into the raws of that side, and a raw is what the parser prints in place of the spaces the fix writes, so the fix changed nothing while Stylelint counted it as applied and `--fix` ended with a clean pass on a file it had not touched. `.foo  /* c */  >  .bar` keeps its warning now, in a stylesheet of any syntax.
		- the reported position no longer drifts two characters per comment, so it points at the combinator itself;
		- the fix now reaches the output instead of being silently discarded, and the comment keeps its `//` spelling, whatever kind of combinator the comment stands beside: one folded into the raws of a `>`, `+` or `~` used to be rewritten into a block comment by a fix made elsewhere in the selector, and the position reported there drifted two characters per comment;
	- The `string-quotes` rule no longer reports a quotation mark standing inside a `//` comment (see [#32](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/32)). A Less value or an at-rule's parameters keep such a comment in themselves whenever it does not open the statement, and the quotes in its text used to be taken for a string of code:
		- the warning is gone, and the fix no longer rewrites the text of the comment;
		- a double slash opens a comment only where the syntax says one does: under `postcss-scss` those are the comments its parser found, and a value of plain CSS is read exactly as before;
		- a double slash belonging to an address opens no comment even there, whether the address is quoted or bare inside `url()`, and whatever parentheses its interpolation or its escapes bring along;
		- a comment ends with its line, so a string on the next one is checked as before.
	- The `selector-pseudo-class-parentheses-space-inside` rule no longer reports an end of the parentheses that holds no argument, nor throws when fixing one (see [#127](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/127)). The whole of `a:not()`, and the empty half of `a:not(,b)`, have no inside to space out, and the parser keeps no whitespace at such an end either — `a:not( )` comes back out as `a:not()`, and `a:not( ,b)` as `a:not(, b)`, the run standing in front of the comma handed to the node behind it. So an end with nothing at it is passed over, and where whitespace stood at one — or at a selector of the list that holds nothing, `a:not( b ) , , c` for one — the whole selector list is passed over with it, since nothing in the parsed selector can hold that run and a fix made anywhere in the list is written back from it. The end that does hold an argument is spaced out as before, and a pseudo-element written with an empty argument, `a::part()` for one, is read the same way as a pseudo-class.
		- Under `always` an empty argument standing at an end of the list used to draw two warnings, each at the parenthesis the other one was about, and the fix then threw, which Stylelint reported as a parse error: the rule lost every warning and every fix it had for that selector, so `a:not(), b:not(c)` came back exactly as it was. One standing between two arguments threw nothing and the warnings it drew were real, but the fix that answered them carried the whitespace of the empty argument off with it, `a:not(b, ,c)` coming back as `a:not( b,, c )`, so those go the way of the rest.
		- Under `never` a fix made anywhere in such a selector list used to be written back from that tree: `a:not( ,b )` came back as `a:not(, b)`. Nothing is reported there now and nothing written, so a violation standing beside the empty argument, the space in `a:not( b, )` or in the `b:not( c )` of `a:not( ) , b:not( c )`, goes unreported along with the rewriting.
	- The `string-quotes` rule now asks each block of a page about its own language (see [#101](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/101)). A stylesheet written in Less inside a `<style lang="less">` used to be read as plain CSS, so the quotes standing in the text of a `//` comment were reported and the fix rewrote them; a page may now hold blocks in several languages and each is read as its own.
	- A Less CSS guard is no longer read as ordinary CSS (see [#125](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/125)). `isStandardSyntaxSelector` used to recognise one only by accident — a guard on a selector carrying no colon looked like a mixin definition, and a condition naming a variable looked like a parametric mixin — so `.a:hover when (1 = 1)` answered to neither and every rule built on that util went on checking it. Such a selector is now passed over as any other Less construct is, wherever the guard stands, while a quoted attribute value holding the same text, `a[href$=" when ("]` for one, is ordinary CSS and is checked as before.
	- A Less CSS guard is recognised in two more shapes (see [#150](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/150)). `isStandardSyntaxSelector` asked for whitespace in front of the condition that Less does not ask for, so `.a:hover when(1 = 1)` went on being checked by every rule built on that util, and a fix could write a line break into the guard's own list of conditions, `when(1 = 1), (2 = 2)` for one. A quotation mark escaped outside a string no longer opens one either: the run blanked from `.x\'y:hover when ('z' = 'w')` used to swallow the guard along with it, which put the selector back in the rules' way. That reading cost a plain CSS selector as well, wherever an escape stood in front of an attribute value holding the text of a guard — `.a\"b [title=" when ("]  c` was passed over by every rule of the plugin, and is now read like any other.
	- The text of a quoted attribute value is no longer read as selector syntax (see [#151](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/151)). An attribute value may hold any text at all — a link matched by its address, a `data-*` carrying a template fragment — and `isStandardSyntaxSelector` used to read `[title=":extend(x)"]`, `[title="//"]`, `[title="<%"]`, `[title="%>"]` and `[title=".foo()bar"]` as preprocessor constructs, so several rules passed such a rule over in silence. Every check that reads the text of a selector now reads it with the quoted runs emptied, as the check for a Less guard already did, while a preprocessor construct standing beside such a value is recognised as before. One check asks whether the selector holds a colon, to tell a Less mixin definition from a selector ending in a functional pseudo-class, and a colon quoted inside an attribute value no longer answers it: `.mixin("a:b")` is read as the Less mixin definition it is.
	- Two comments standing side by side in a selector are no longer read as an inline comment (see [#164](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/164)). The closing `*/` of one and the opening `/*` of the next spell `//` between them, so `a:not(  b  )/*one*//*two*/c` looked like a preprocessor construct to `isStandardSyntaxSelector` and several rules passed it over (see [#151](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/151)). A comment is now taken out of the copy those checks read, delimiters and all, so the text a comment holds is no longer read as selector syntax either — while a real `//` comment is recognised as before, whatever its text spells: `a//*x*/b` is one, and not a comment of the other kind. What a comment leaves behind is read too, since it leaves the whitespace it stood in: `.a:hover/*x*/when (1 = 1)` and `.a:hover when/**/(1 = 1)` are the guards the Less compiler reads there, and are passed over now like any other guard. The colon a comment holds is no longer counted either, so `.mixin(/*:*/)` is read as a Less mixin definition, as `.mixin("a:b")` already was.
	- A Less guard keyword written in another case is no longer taken for a guard (see [#168](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/168)). Less reads its keywords in lower case only — the compiler prints `.a:hover WHEN (1 = 1)` as it stands, and answers `when NOT (1 = 1)` with a syntax error — while `isStandardSyntaxSelector` matched the word in any case and passed such a selector over. Nothing valid was silenced by that, since a parenthesis opening after whitespace is nothing a CSS selector has, but what the plugin says about such a file is now what the syntax says.
	- Interpolation standing in the text of a quoted run is no longer read as interpolation of the selector (see [#170](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/170)). `isStandardSyntaxSelector` asked whether the selector holds `#{…}`, `@{…}`, `${…}`, `{{…}}` or `$(…)` before it emptied the quoted runs, so `[title="#{a}"]` was taken for a preprocessor construct and several rules (see [#151](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/151)) passed the rule over, reporting nothing and fixing nothing. A pair of braces holding anything at all counts as interpolation of the template kind, so an attribute value carrying no construct whatever went with them — `[data-config='{a:1}']` for one, whose braces are the text of a value and nothing else. The question is asked of the emptied copy now, as every other question about the text already was, while interpolation standing outside a quoted value is recognised as before: `[title="a"]#{$b}` and `a[b=#{c}][d="e"]` are the preprocessor constructs they were. A comment holding the text of one, `a /* #{$b} */ c`, is read as the comment it is, as a comment spelling any other construct already was.
	- The text of a quoted attribute value is no longer read as a Less `:extend` (see [#171](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/171)). `postcss-less` marks a rule as an extend by matching the text of its selector, quotes and all, so `[title=":extend(x)"]` carried the mark though what stands inside the quotes is an attribute value and nothing else, and several rules (see [#151](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/151)) passed such a rule over in a Less stylesheet while checking it in every other. The mark is asked of the code now, of the same copy the checks for a preprocessor construct already read, with every quoted run emptied. A real extend is passed over as before, `&:extend(.inline)` and `.a:extend(.b all)` among it, and so is `[title=":extend(x)"]:extend(.b)`, which carries one of each.
	- The text of a value is no longer read as a Less `&:extend` (see [#181](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/181)). `postcss-less` marks a declaration as an extend by matching the word against its value, quotes and all, so `b: "extend(x)"`, `content: "a:extend(y)"` and even `b: myextend(x)` carried the mark though all three are plain declarations Less compiles as they stand, and the rules that read a declaration through `isStandardSyntaxDeclaration` passed them over in a Less stylesheet while checking them in every other. The declaration's shape is the answer now: a real extend is the one whose property is `&`, which no standard declaration has, and it is passed over as before — in any case and spacing, since everything else Less answers with a syntax error is nothing to fix either. The shape is read in every syntax, where the mark stood only in Less, so the same `&:extend(.b)` pasted into a plain CSS or SCSS file is passed over now too, instead of being respelled `&: extend(.b)` as though the colon of that construct were a declaration's.
	- The `indentation` rule no longer raises the whole of a selector list by a level when one selector of it is a pseudo-class broken over several lines (see [#74](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/74)). The extra level issue [#30](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/30) asked for was granted by a presence check over the entire selector, so the `.foo,` standing beside a multi-line `:where( … )` was asked for an indent it must not have, and `--fix` rewrote a correct file into a wrong one — the trigger being nothing rarer than a second selector in the list, in plain CSS. The level is now raised by the parenthetical-depth tracking, for the lines inside the pseudo's parentheses and for them alone, whichever position of the list the pseudo stands in, so the sole-selector case of #30 keeps its extra level and every other selector of the list keeps its own.
		- One more shape moves with the discount that granted the old level: a line standing inside parentheses that other code opened, `a:has(.foo,` broken before `.bar)` for one, is measured at the rule's own level now. At the top level that level is zero either way and only the words of the warning change, `0 spaces` where `-2 spaces` was asked; inside a block the old reading expected such a line one level below the rule itself — an outdent no other line is asked for — and the line is expected level with its rule now, so a file spelled to the old expectation draws a warning it did not draw.
	- The `max-line-length` rule no longer reports the line after one that holds both an `@import` string and a `url()` argument (see [#197](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/197)). The rule took one excluded substring off a line, so the second stayed behind and came off the next line instead, with the wrong sign: a line well within the limit was reported longer by the distance to the substring it never held, while the line holding both was measured with one of them still on it. Every excluded substring standing on a line now comes off that line, a `url()` argument standing inside an `@import` string only once.
- The warning was right and what came of it was not — a position off its mark, a fix discarded or refused where nothing was at risk:
	- The `value-list-comma-space-after` and `value-list-comma-newline-after` rules now fix a comma that opens the value (see [#134](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/134)). Such a comma is the value's first character, and the whitespace behind it belongs to the value like any other, but the boundary that keeps these rules off a comma standing in the property name was a character too wide and refused that one as well, so `a { prop: ,0; }` was reported and then left exactly as it was, however many times `--fix` was run. Every option of both rules is affected, so `never` now closes the whitespace up as `always` opens it, and a custom property is fixed like any other declaration. A comma standing in the property name is still reported and still left alone, since nothing these rules could write would reach it. The same comma in `value-list-comma-space-before` took more than a boundary moved, the whitespace at stake there standing outside the value, and is answered below.
	- The `value-list-comma-space-before` rule now fixes a comma that opens the value (see [#166](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/166)). The whitespace in front of such a comma is none of the value's: it is the text standing between the colon and the value, which PostCSS keeps in the declaration's `raws.between`, and no write to the value could reach it. So the problem was reported and the code left exactly as it was, however many times `--fix` was run — under `never` and `never-single-line` wherever a declaration is spelled with whitespace after its colon, and under `always` and `always-single-line` wherever it is not. The rule writes that text now, so `a { prop: ,0; }` is closed up under `never` and `a { prop:,0; }` opened to a single space under `always`, a line break standing after the colon collapsing into that space as one standing in the value always did, and a custom property is written like any other declaration while a comment between the colon and the value keeps its place. A comma standing behind an inline comment is still reported and still left alone, since the line break in that whitespace is what closes the comment. The whitespace after the colon is also what `declaration-colon-space-after` writes, so a configuration that asks one of the two rules for a space there and the other for none cannot be satisfied by any file: the rule standing later in the configuration writes last, and the other's warning is raised again by the next run over the output. Nothing runs away with it — a second `--fix` writes the same file as the first.
	- The `selector-descendant-combinator-no-non-space` rule now spells a selector the way the file spells it in the text of a warning under `postcss-scss`. The text a warning quotes is read out of the copy that syntax rewrites every inline comment in, so `.foo\t// c\n( )\t.bar` was reported as `Unexpected "\t/* c*/\n( )"`, a text the file does not hold. It is read back out of the copy the file spells now, as the position it is reported at already was.
	- The `selector-pseudo-class-parentheses-space-inside` rule now reads a carriage return and a form feed as the line breaks they are (see [#173](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/173)). The `never` option spares the whitespace in front of the closing parenthesis of a multi-line argument list, but a list counted as multi-line only where it held a line feed, so `a:not( b\r, c )` had that space taken away while the same list broken with `\n` kept it. The three characters the syntaxes end a line on are read alike now; `\r\n` was spared all along, by its `\n`.
	- The `no-eol-whitespace` rule now trims every line of a comment when fixing, and not only the lines up to the first quotation mark in it (see [#67](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/67)). An apostrophe in the text of a comment, the one in `isn't` for instance, used to be taken for the opening quote of a string, and the lines after it were passed over — reported, but left as they were, however many times the fix was run.
	- The `string-quotes` rule no longer loses its bearings in a declaration's value or an at-rule's parameters holding a comment (see [#61](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/61), [#33](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/33)):
		- the reported position now points at the quote itself instead of drifting by the length of every comment standing in front of it;
		- the fix now changes the quote characters and nothing else, so every comment in the value survives it.
	- A `//` comment that a carriage return ends is now read as ended wherever the plugin asks whether a fix would land inside one. Sass reads that character as a line of its own, and Less turns one into a line feed before it parses anything, so a comment ends there in either language; every rule that declines a fix next to such a comment used to read the comment as running on, and declined where nothing was at risk.

## [5.3.0] — 2026–08–09

### Added

- The `function-comma-newline-after` rule now has an additional `ignoreFunctions` option (see [#78](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/78)).
- The `function-comma-newline-before` rule now has an additional `ignoreFunctions` option (see [#81](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/81)).
- The `function-comma-space-after` rule now has an additional `ignoreFunctions` option (see [#82](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/82)).
- The `function-comma-space-before` rule now has an additional `ignoreFunctions` option (see [#83](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/83)).

## [5.2.1] — 2026–07–01

### Fixed

- The protocol in the repository's metadata URL now meets current requirements ([#79](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/79)) ([@BowenMilner](https://github.com/BowenMilner)).

## [5.2.0] — 2026–05–20

### Added

- The `declaration-block-semicolon-newline-before` rule is now autofixable.

### Fixed

- An exception for an empty custom property value has been added to the `declaration-block-semicolon-newline-before` and `declaration-colon-space-after` rules: the `--custom-prop: ;` and `--custom-prop:;` variants are now considered valid (see [#50](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/50)).

## [5.1.0] — 2026–03–28

### Added

- The `no-multiple-whitespaces` rule, which disallows multiple whitespaces between property values and function arguments.

### Fixed

- The dependencies have now been updated to versions that include security fixes.

## [5.0.1] — 2026–01–22

### Fixed

- The `selector-pseudo-class-parentheses-space-inside` rule no longer triggers false positives in multiline pseudo-classes.

## [5.0.0] — 2026–01–15

### Changed

- The plugin now requires:
	- `stylelint` version `17.0.0` or higher
	- `node.js` version `20.19.0` or higher

## [4.0.1] — 2026–01–15

### Fixed

- Multiline pseudos are now aligned correctly with the `@stylistic/indentation` rule.

	**Before**:

	```css
	.foo:where(
	:not(
	    .bar,
	    .baz
	)
	) {}
	```

	**Now**:

	```css
	.foo:where(
	  :not(
	    .bar,
	    .baz
	  )
	) {}
	```

## [4.0.0] — 2025–07–22

### Changed

- The plugin now requires `stylelint` version `16.22.0` or higher.

## [3.1.3] — 2025–06–25

### Fixed

- `stylelint` has been moved from `dependencies` to `devDependencies`. This may potentially fix some errors (see [Stylelint's documentation regarding `peerDependencies`](https://stylelint.io/developer-guide/plugins#peer-dependencies) and [PRs that explain the motivation behind this decision](https://github.com/stylelint/stylelint/issues/2812)).
- `postcss` has been moved from `devDependencies` to `dependencies`. This fixes the “Cannot find package `postcss`” and “Named export `Input` not found” error in some environments.

## [3.1.2] — 2025–02–05

### Fixed

- An explicit end position is now passed to all `report` calls. \
	The `report` calls no longer receive the `line` argument, which was [deprecated](https://github.com/stylelint/stylelint/pull/8244) in `stylelint@16.13.0`. \
	Previously, attempts to update `stylelint` to `16.13.0` version resulted in multiple DeprecationWarning messages ([#53](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/53)) ([@MorevM](https://github.com/MorevM)).
- Added an exception to the `declaration-block-semicolon-space-before` rule for an empty value of a custom property: now both `--custom-prop: ;` and `--custom-prop:;` are considered valid even with the `never` and `never-single-line` options. \
  You can find a detailed explanation in [the original issue](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/50) ([#51](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/51)) ([@MorevM](https://github.com/MorevM)).
- Fixed behavior of `baseIndentLevel` option of `indentation` rule when used in non-CSS files (e.g. when using `postcss-html` syntax) ([#47](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/47)) ([@net-solution](https://github.com/net-solution)).
- Fixed removing the starting indentation along with the blank line in the `no-empty-first-rule` rule ([#47](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/47)) ([@net-solution](https://github.com/net-solution)).

## [3.1.1] — 2024–10–04

### Fixed

- Indentation checking for property values that use dynamic expressions when using `postcss-styled-syntax` is now disabled ([#44](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/44)) ([@MorevM](https://github.com/MorevM)).

## [3.1.0] — 2024–09–23

### Added

- The `messageArgs` to 16 rules for custom message arguments. See [stylelint documentation](https://stylelint.io/user-guide/configure/#message) for details.

### Fixed

- Calculation of indentation using `postcss-styled-syntax` custom syntax ([#41](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/41)) ([@MorevM](https://github.com/MorevM)).

## [3.0.1] — 2024–08–18

### Fixed

- The `context.fix`, which is deprecated in `stylelint@16.8.2`, is no longer used. Previously, attempts to update `stylelint` to `16.8.2` version resulted in multiple DeprecationWarning messages ([#37](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/37)).

## [3.0.0] — 2024–07–30

### Changed

- The plugin now requires `stylelint` version `16.8.0` or higher.

## [2.1.3] — 2024–07–29

### Fixed

- Dependencies are now updated, which fixes test fails ([#29](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/29)) ([@ybiquitous](https://github.com/ybiquitous)).

## [2.1.2] — 2024–04–28

### Fixed

- Autofixing of `@charset` name by `string-quotes` rule ([#26](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/26)) ([@Mouvedia](https://github.com/Mouvedia)).

## [2.1.1] — 2024–03–31

### Fixed

- `block-closing-brace-empty-line-before` with except: ["after-closing-brace"] false negatives for CSS Nesting ([#22](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/22)) ([@firefoxic](https://github.com/firefoxic)).
- `named-grid-areas-alignment` for single-line input ([#21](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/21)) ([@MorevM](https://github.com/MorevM)).

## [2.1.0] — 2024–02–18

### Added

- `named-grid-areas-alignment` rule ([#16](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/16)) ([@MorevM](https://github.com/MorevM)).

## [2.0.0] — 2023–12–20

### Changed

- The repository renamed to `stylelint-stylistic` and moved to the organization of the same name.
- The plugin is published in `npm` under the new name `@stylistic/stylelint-plugin`. Therefore, you should:
	- change the former plugin name `stylelint-codeguide` to the new one in the config,
	- remove the old `stylelint-codeguide` package from dependencies
	- install the new `@stylistic/stylelint-plugin` package.
- The namespace of plugin rules has been renamed. Therefore, you should change the rules prefix from `codeguide/` to `@stylistic/` in the config.

## [1.0.2] — 2023–12–12

### Updated

- **Stylelint** to version `16.0.2`, which fixes the use of plugins in Windows.

## [1.0.1] — 2023–12–10

### Fixed

- Dependency definition.

## [1.0.0] — 2023–12–08

### Changed

- The required version of **Stylelint** is now at least `v16.0.1`.
- The required version of **Node.js** is now **LTS** at least `v18.12`, or at least `v20.9`.
- The plugin is now converted to a pure ES module.

## [0.3.2] — 2023–10–19

### Updated

- Stylelint to `^15.11.0`.
- Node.js to `>=18.16`.

## [0.3.1] — 2023–10–13

No meaningful changes.

## [0.3.0] — 2023–10–13

### Changed

- Along with updating the plugin to this release, Stylelint needs to be updated to `v15.10.3` as well.

### Updated

- All code according to `stylelint@15.10.3`.
- Peer dependency — `stylelint@15.10.3`.

## [0.2.2] — 2023–09–14

### Fixed

- The path to the internal module.

## [0.2.1] — 2023–07–08

### Fixed

- Any LTS version of Node.js on the 18th branch is now required (i.e. at least `18.12.0`), not the latest.
- Any version of Stylelint on the 15th branch is now required (i.e. at least `15.0.0`), not the latest.

## [0.2.0] — 2023–07–01

### Updated

- Peer dependency Stylelint to `15.9.0`.

## [0.1.5] — 2023–07–01

### Fixed

- All paths to docs.

## [0.1.4] — 2023–05–20

### Changed

- Reorganized `package.json`.

## [0.1.3] — 2023–03–28

### Removed

- The `deprecated` flag from the `meta` of each rule.

## [0.1.2] — 2023–03–28

### Fixed

- `Error [ERR_REQUIRE_ESM]: require() of ES Module`.

## [0.1.1] — 2023–03–28

### Added

- Babel until Stylelint is converted to ES Modules.

## [0.1.0] — 2023–03–28

### Added

- `at-rule-name-case` rule.
- `at-rule-name-newline-after` rule.
- `at-rule-name-space-after` rule.
- `at-rule-semicolon-newline-after` rule.
- `at-rule-semicolon-space-before` rule.
- `block-closing-brace-empty-line-before` rule.
- `block-closing-brace-newline-after` rule.
- `block-closing-brace-newline-before` rule.
- `block-closing-brace-space-after` rule.
- `block-closing-brace-space-before` rule.
- `block-opening-brace-newline-after` rule.
- `block-opening-brace-newline-before` rule.
- `block-opening-brace-space-after` rule.
- `block-opening-brace-space-before` rule.
- `color-hex-case` rule.
- `declaration-bang-space-after` rule.
- `declaration-bang-space-before` rule.
- `declaration-block-semicolon-newline-after` rule.
- `declaration-block-semicolon-newline-before` rule.
- `declaration-block-semicolon-space-after` rule.
- `declaration-block-semicolon-space-before` rule.
- `declaration-block-trailing-semicolon` rule.
- `declaration-colon-newline-after` rule.
- `declaration-colon-space-after` rule.
- `declaration-colon-space-before` rule.
- `function-comma-newline-after` rule.
- `function-comma-newline-before` rule.
- `function-comma-space-after` rule.
- `function-comma-space-before` rule.
- `function-max-empty-lines` rule.
- `function-parentheses-newline-inside` rule.
- `function-parentheses-space-inside` rule.
- `function-whitespace-after` rule.
- `indentation` rule.
- `linebreaks` rule.
- `max-empty-lines` rule.
- `max-line-length` rule.
- `media-feature-colon-space-after` rule.
- `media-feature-colon-space-before` rule.
- `media-feature-name-case` rule.
- `media-feature-parentheses-space-inside` rule.
- `media-feature-range-operator-space-after` rule.
- `media-feature-range-operator-space-before` rule.
- `media-query-list-comma-newline-after` rule.
- `media-query-list-comma-newline-before` rule.
- `media-query-list-comma-space-after` rule.
- `media-query-list-comma-space-before` rule.
- `no-empty-first-line` rule.
- `no-eol-whitespace` rule.
- `no-extra-semicolons` rule.
- `no-missing-end-of-source-newline` rule.
- `number-leading-zero` rule.
- `number-no-trailing-zeros` rule.
- `property-case` rule.
- `selector-attribute-brackets-space-inside` rule.
- `selector-attribute-operator-space-after` rule.
- `selector-attribute-operator-space-before` rule.
- `selector-combinator-space-after` rule.
- `selector-combinator-space-before` rule.
- `selector-descendant-combinator-no-non-space` rule.
- `selector-list-comma-newline-after` rule.
- `selector-list-comma-newline-before` rule.
- `selector-list-comma-space-after` rule.
- `selector-list-comma-space-before` rule.
- `selector-max-empty-lines` rule.
- `selector-pseudo-class-case` rule.
- `selector-pseudo-class-parentheses-space-inside` rule.
- `selector-pseudo-element-case` rule.
- `string-quotes` rule.
- `unicode-bom` rule.
- `unit-case` rule.
- `value-list-comma-newline-after` rule.
- `value-list-comma-newline-before` rule.
- `value-list-comma-space-after` rule.
- `value-list-comma-space-before` rule.
- `value-list-max-empty-lines` rule.

[Unreleased]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v5.3.0...HEAD
[5.3.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v5.2.1...v5.3.0
[5.2.1]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v5.2.0...v5.2.1
[5.2.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v5.1.0...v5.2.0
[5.1.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v5.0.1...v5.1.0
[5.0.1]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v5.0.0...v5.0.1
[5.0.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v4.0.1...v5.0.0
[4.0.1]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v4.0.0...v4.0.1
[4.0.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v3.1.3...v4.0.0
[3.1.3]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v3.1.2...v3.1.3
[3.1.2]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v3.1.1...v3.1.2
[3.1.1]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v3.1.0...v3.1.1
[3.1.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v3.0.1...v3.1.0
[3.0.1]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v3.0.0...v3.0.1
[3.0.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v2.1.3...v3.0.0
[2.1.3]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v2.1.2...v2.1.3
[2.1.2]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v2.1.1...v2.1.2
[2.1.1]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v2.1.0...v2.1.1
[2.1.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v1.0.2...v2.0.0
[1.0.2]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v0.3.2...v1.0.0
[0.3.2]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v0.2.2...v0.3.1
[0.3.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v0.2.2...v0.3.0
[0.2.2]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v0.1.5...v0.2.0
[0.1.5]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/releases/tag/v0.1.0
