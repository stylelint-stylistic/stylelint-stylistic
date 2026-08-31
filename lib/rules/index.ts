import type { Rule } from "stylelint"

import type { Syntax } from "../syntaxes/index.ts"

import { createRule as aspectRatioNotation } from "./aspect-ratio-notation/index.ts"
import { createRule as atRuleNameCase } from "./at-rule-name-case/index.ts"
import { createRule as atRuleNameNewlineAfter } from "./at-rule-name-newline-after/index.ts"
import { createRule as atRuleNameSpaceAfter } from "./at-rule-name-space-after/index.ts"
import { createRule as atRuleSemicolonNewlineAfter } from "./at-rule-semicolon-newline-after/index.ts"
import { createRule as atRuleSemicolonSpaceBefore } from "./at-rule-semicolon-space-before/index.ts"
import { createRule as blockClosingBraceEmptyLineBefore } from "./block-closing-brace-empty-line-before/index.ts"
import { createRule as blockClosingBraceNewlineAfter } from "./block-closing-brace-newline-after/index.ts"
import { createRule as blockClosingBraceNewlineBefore } from "./block-closing-brace-newline-before/index.ts"
import { createRule as blockClosingBraceSpaceAfter } from "./block-closing-brace-space-after/index.ts"
import { createRule as blockClosingBraceSpaceBefore } from "./block-closing-brace-space-before/index.ts"
import { createRule as blockOpeningBraceNewlineAfter } from "./block-opening-brace-newline-after/index.ts"
import { createRule as blockOpeningBraceNewlineBefore } from "./block-opening-brace-newline-before/index.ts"
import { createRule as blockOpeningBraceSpaceAfter } from "./block-opening-brace-space-after/index.ts"
import { createRule as blockOpeningBraceSpaceBefore } from "./block-opening-brace-space-before/index.ts"
import { createRule as colorHexCase } from "./color-hex-case/index.ts"
import { createRule as declarationBangSpaceAfter } from "./declaration-bang-space-after/index.ts"
import { createRule as declarationBangSpaceBefore } from "./declaration-bang-space-before/index.ts"
import { createRule as declarationBlockSemicolonNewlineAfter } from "./declaration-block-semicolon-newline-after/index.ts"
import { createRule as declarationBlockSemicolonNewlineBefore } from "./declaration-block-semicolon-newline-before/index.ts"
import { createRule as declarationBlockSemicolonSpaceAfter } from "./declaration-block-semicolon-space-after/index.ts"
import { createRule as declarationBlockSemicolonSpaceBefore } from "./declaration-block-semicolon-space-before/index.ts"
import { createRule as declarationBlockTrailingSemicolon } from "./declaration-block-trailing-semicolon/index.ts"
import { createRule as declarationColonNewlineAfter } from "./declaration-colon-newline-after/index.ts"
import { createRule as declarationColonSpaceAfter } from "./declaration-colon-space-after/index.ts"
import { createRule as declarationColonSpaceBefore } from "./declaration-colon-space-before/index.ts"
import { createRule as functionCommaNewlineAfter } from "./function-comma-newline-after/index.ts"
import { createRule as functionCommaNewlineBefore } from "./function-comma-newline-before/index.ts"
import { createRule as functionCommaSpaceAfter } from "./function-comma-space-after/index.ts"
import { createRule as functionCommaSpaceBefore } from "./function-comma-space-before/index.ts"
import { createRule as functionMaxEmptyLines } from "./function-max-empty-lines/index.ts"
import { createRule as functionParenthesesNewlineInside } from "./function-parentheses-newline-inside/index.ts"
import { createRule as functionParenthesesSpaceInside } from "./function-parentheses-space-inside/index.ts"
import { createRule as functionWhitespaceAfter } from "./function-whitespace-after/index.ts"
import { createRule as indentation } from "./indentation/index.ts"
import { createRule as linebreaks } from "./linebreaks/index.ts"
import { createRule as maxEmptyLines } from "./max-empty-lines/index.ts"
import { createRule as maxLineLength } from "./max-line-length/index.ts"
import { createRule as mediaFeatureColonSpaceAfter } from "./media-feature-colon-space-after/index.ts"
import { createRule as mediaFeatureColonSpaceBefore } from "./media-feature-colon-space-before/index.ts"
import { createRule as mediaFeatureNameCase } from "./media-feature-name-case/index.ts"
import { createRule as mediaFeatureParenthesesSpaceInside } from "./media-feature-parentheses-space-inside/index.ts"
import { createRule as mediaFeatureRangeOperatorSpaceAfter } from "./media-feature-range-operator-space-after/index.ts"
import { createRule as mediaFeatureRangeOperatorSpaceBefore } from "./media-feature-range-operator-space-before/index.ts"
import { createRule as mediaQueryListCommaNewlineAfter } from "./media-query-list-comma-newline-after/index.ts"
import { createRule as mediaQueryListCommaNewlineBefore } from "./media-query-list-comma-newline-before/index.ts"
import { createRule as mediaQueryListCommaSpaceAfter } from "./media-query-list-comma-space-after/index.ts"
import { createRule as mediaQueryListCommaSpaceBefore } from "./media-query-list-comma-space-before/index.ts"
import { createRule as namedGridAreasAlignment } from "./named-grid-areas-alignment/index.ts"
import { createRule as noEmptyFirstLine } from "./no-empty-first-line/index.ts"
import { createRule as noEolWhitespace } from "./no-eol-whitespace/index.ts"
import { createRule as noExtraSemicolons } from "./no-extra-semicolons/index.ts"
import { createRule as noMissingEndOfSourceNewline } from "./no-missing-end-of-source-newline/index.ts"
import { createRule as noMultipleWhitespaces } from "./no-multiple-whitespaces/index.ts"
import { createRule as numberLeadingZero } from "./number-leading-zero/index.ts"
import { createRule as numberNoTrailingZeros } from "./number-no-trailing-zeros/index.ts"
import { createRule as propertyCase } from "./property-case/index.ts"
import { createRule as selectorAttributeBracketsSpaceInside } from "./selector-attribute-brackets-space-inside/index.ts"
import { createRule as selectorAttributeOperatorSpaceAfter } from "./selector-attribute-operator-space-after/index.ts"
import { createRule as selectorAttributeOperatorSpaceBefore } from "./selector-attribute-operator-space-before/index.ts"
import { createRule as selectorCombinatorSpaceAfter } from "./selector-combinator-space-after/index.ts"
import { createRule as selectorCombinatorSpaceBefore } from "./selector-combinator-space-before/index.ts"
import { createRule as selectorDescendantCombinatorNoNonSpace } from "./selector-descendant-combinator-no-non-space/index.ts"
import { createRule as selectorListCommaNewlineAfter } from "./selector-list-comma-newline-after/index.ts"
import { createRule as selectorListCommaNewlineBefore } from "./selector-list-comma-newline-before/index.ts"
import { createRule as selectorListCommaSpaceAfter } from "./selector-list-comma-space-after/index.ts"
import { createRule as selectorListCommaSpaceBefore } from "./selector-list-comma-space-before/index.ts"
import { createRule as selectorMaxEmptyLines } from "./selector-max-empty-lines/index.ts"
import { createRule as selectorPseudoClassCase } from "./selector-pseudo-class-case/index.ts"
import { createRule as selectorPseudoClassParenthesesSpaceInside } from "./selector-pseudo-class-parentheses-space-inside/index.ts"
import { createRule as selectorPseudoElementCase } from "./selector-pseudo-element-case/index.ts"
import { createRule as stringQuotes } from "./string-quotes/index.ts"
import { createRule as unicodeBom } from "./unicode-bom/index.ts"
import { createRule as unitCase } from "./unit-case/index.ts"
import { createRule as valueListCommaNewlineAfter } from "./value-list-comma-newline-after/index.ts"
import { createRule as valueListCommaNewlineBefore } from "./value-list-comma-newline-before/index.ts"
import { createRule as valueListCommaSpaceAfter } from "./value-list-comma-space-after/index.ts"
import { createRule as valueListCommaSpaceBefore } from "./value-list-comma-space-before/index.ts"
import { createRule as valueListMaxEmptyLines } from "./value-list-max-empty-lines/index.ts"

let rules: { readonly [name: string]: (syntax: Syntax) => Rule } = {
	"aspect-ratio-notation": aspectRatioNotation,
	"at-rule-name-case": atRuleNameCase,
	"at-rule-name-newline-after": atRuleNameNewlineAfter,
	"at-rule-name-space-after": atRuleNameSpaceAfter,
	"at-rule-semicolon-newline-after": atRuleSemicolonNewlineAfter,
	"at-rule-semicolon-space-before": atRuleSemicolonSpaceBefore,
	"block-closing-brace-empty-line-before": blockClosingBraceEmptyLineBefore,
	"block-closing-brace-newline-after": blockClosingBraceNewlineAfter,
	"block-closing-brace-newline-before": blockClosingBraceNewlineBefore,
	"block-closing-brace-space-after": blockClosingBraceSpaceAfter,
	"block-closing-brace-space-before": blockClosingBraceSpaceBefore,
	"block-opening-brace-newline-after": blockOpeningBraceNewlineAfter,
	"block-opening-brace-newline-before": blockOpeningBraceNewlineBefore,
	"block-opening-brace-space-after": blockOpeningBraceSpaceAfter,
	"block-opening-brace-space-before": blockOpeningBraceSpaceBefore,
	"color-hex-case": colorHexCase,
	"declaration-bang-space-after": declarationBangSpaceAfter,
	"declaration-bang-space-before": declarationBangSpaceBefore,
	"declaration-block-semicolon-newline-after": declarationBlockSemicolonNewlineAfter,
	"declaration-block-semicolon-newline-before": declarationBlockSemicolonNewlineBefore,
	"declaration-block-semicolon-space-after": declarationBlockSemicolonSpaceAfter,
	"declaration-block-semicolon-space-before": declarationBlockSemicolonSpaceBefore,
	"declaration-block-trailing-semicolon": declarationBlockTrailingSemicolon,
	"declaration-colon-newline-after": declarationColonNewlineAfter,
	"declaration-colon-space-after": declarationColonSpaceAfter,
	"declaration-colon-space-before": declarationColonSpaceBefore,
	"function-comma-newline-after": functionCommaNewlineAfter,
	"function-comma-newline-before": functionCommaNewlineBefore,
	"function-comma-space-after": functionCommaSpaceAfter,
	"function-comma-space-before": functionCommaSpaceBefore,
	"function-max-empty-lines": functionMaxEmptyLines,
	"function-parentheses-newline-inside": functionParenthesesNewlineInside,
	"function-parentheses-space-inside": functionParenthesesSpaceInside,
	"function-whitespace-after": functionWhitespaceAfter,
	indentation,
	linebreaks,
	"max-empty-lines": maxEmptyLines,
	"max-line-length": maxLineLength,
	"media-feature-colon-space-after": mediaFeatureColonSpaceAfter,
	"media-feature-colon-space-before": mediaFeatureColonSpaceBefore,
	"media-feature-name-case": mediaFeatureNameCase,
	"media-feature-parentheses-space-inside": mediaFeatureParenthesesSpaceInside,
	"media-feature-range-operator-space-after": mediaFeatureRangeOperatorSpaceAfter,
	"media-feature-range-operator-space-before": mediaFeatureRangeOperatorSpaceBefore,
	"media-query-list-comma-newline-after": mediaQueryListCommaNewlineAfter,
	"media-query-list-comma-newline-before": mediaQueryListCommaNewlineBefore,
	"media-query-list-comma-space-after": mediaQueryListCommaSpaceAfter,
	"media-query-list-comma-space-before": mediaQueryListCommaSpaceBefore,
	"named-grid-areas-alignment": namedGridAreasAlignment,
	"no-empty-first-line": noEmptyFirstLine,
	"no-eol-whitespace": noEolWhitespace,
	"no-extra-semicolons": noExtraSemicolons,
	"no-missing-end-of-source-newline": noMissingEndOfSourceNewline,
	"no-multiple-whitespaces": noMultipleWhitespaces,
	"number-leading-zero": numberLeadingZero,
	"number-no-trailing-zeros": numberNoTrailingZeros,
	"property-case": propertyCase,
	"selector-attribute-brackets-space-inside": selectorAttributeBracketsSpaceInside,
	"selector-attribute-operator-space-after": selectorAttributeOperatorSpaceAfter,
	"selector-attribute-operator-space-before": selectorAttributeOperatorSpaceBefore,
	"selector-combinator-space-after": selectorCombinatorSpaceAfter,
	"selector-combinator-space-before": selectorCombinatorSpaceBefore,
	"selector-descendant-combinator-no-non-space": selectorDescendantCombinatorNoNonSpace,
	"selector-list-comma-newline-after": selectorListCommaNewlineAfter,
	"selector-list-comma-newline-before": selectorListCommaNewlineBefore,
	"selector-list-comma-space-after": selectorListCommaSpaceAfter,
	"selector-list-comma-space-before": selectorListCommaSpaceBefore,
	"selector-max-empty-lines": selectorMaxEmptyLines,
	"selector-pseudo-class-case": selectorPseudoClassCase,
	"selector-pseudo-class-parentheses-space-inside": selectorPseudoClassParenthesesSpaceInside,
	"selector-pseudo-element-case": selectorPseudoElementCase,
	"string-quotes": stringQuotes,
	"unicode-bom": unicodeBom,
	"unit-case": unitCase,
	"value-list-comma-newline-after": valueListCommaNewlineAfter,
	"value-list-comma-newline-before": valueListCommaNewlineBefore,
	"value-list-comma-space-after": valueListCommaSpaceAfter,
	"value-list-comma-space-before": valueListCommaSpaceBefore,
	"value-list-max-empty-lines": valueListMaxEmptyLines,
}

export default rules
