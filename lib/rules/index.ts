import type { Rule } from "stylelint"

import aspectRatioNotation from "./aspect-ratio-notation/index.ts"
import atRuleNameCase from "./at-rule-name-case/index.ts"
import atRuleNameNewlineAfter from "./at-rule-name-newline-after/index.ts"
import atRuleNameSpaceAfter from "./at-rule-name-space-after/index.ts"
import atRuleSemicolonNewlineAfter from "./at-rule-semicolon-newline-after/index.ts"
import atRuleSemicolonSpaceBefore from "./at-rule-semicolon-space-before/index.ts"
import blockClosingBraceEmptyLineBefore from "./block-closing-brace-empty-line-before/index.ts"
import blockClosingBraceNewlineAfter from "./block-closing-brace-newline-after/index.ts"
import blockClosingBraceNewlineBefore from "./block-closing-brace-newline-before/index.ts"
import blockClosingBraceSpaceAfter from "./block-closing-brace-space-after/index.ts"
import blockClosingBraceSpaceBefore from "./block-closing-brace-space-before/index.ts"
import blockOpeningBraceNewlineAfter from "./block-opening-brace-newline-after/index.ts"
import blockOpeningBraceNewlineBefore from "./block-opening-brace-newline-before/index.ts"
import blockOpeningBraceSpaceAfter from "./block-opening-brace-space-after/index.ts"
import blockOpeningBraceSpaceBefore from "./block-opening-brace-space-before/index.ts"
import colorHexCase from "./color-hex-case/index.ts"
import declarationBangSpaceAfter from "./declaration-bang-space-after/index.ts"
import declarationBangSpaceBefore from "./declaration-bang-space-before/index.ts"
import declarationBlockSemicolonNewlineAfter from "./declaration-block-semicolon-newline-after/index.ts"
import declarationBlockSemicolonNewlineBefore from "./declaration-block-semicolon-newline-before/index.ts"
import declarationBlockSemicolonSpaceAfter from "./declaration-block-semicolon-space-after/index.ts"
import declarationBlockSemicolonSpaceBefore from "./declaration-block-semicolon-space-before/index.ts"
import declarationBlockTrailingSemicolon from "./declaration-block-trailing-semicolon/index.ts"
import declarationColonNewlineAfter from "./declaration-colon-newline-after/index.ts"
import declarationColonSpaceAfter from "./declaration-colon-space-after/index.ts"
import declarationColonSpaceBefore from "./declaration-colon-space-before/index.ts"
import functionCommaNewlineAfter from "./function-comma-newline-after/index.ts"
import functionCommaNewlineBefore from "./function-comma-newline-before/index.ts"
import functionCommaSpaceAfter from "./function-comma-space-after/index.ts"
import functionCommaSpaceBefore from "./function-comma-space-before/index.ts"
import functionMaxEmptyLines from "./function-max-empty-lines/index.ts"
import functionParenthesesNewlineInside from "./function-parentheses-newline-inside/index.ts"
import functionParenthesesSpaceInside from "./function-parentheses-space-inside/index.ts"
import functionWhitespaceAfter from "./function-whitespace-after/index.ts"
import indentation from "./indentation/index.ts"
import linebreaks from "./linebreaks/index.ts"
import maxEmptyLines from "./max-empty-lines/index.ts"
import maxLineLength from "./max-line-length/index.ts"
import mediaFeatureColonSpaceAfter from "./media-feature-colon-space-after/index.ts"
import mediaFeatureColonSpaceBefore from "./media-feature-colon-space-before/index.ts"
import mediaFeatureNameCase from "./media-feature-name-case/index.ts"
import mediaFeatureParenthesesSpaceInside from "./media-feature-parentheses-space-inside/index.ts"
import mediaFeatureRangeOperatorSpaceAfter from "./media-feature-range-operator-space-after/index.ts"
import mediaFeatureRangeOperatorSpaceBefore from "./media-feature-range-operator-space-before/index.ts"
import mediaQueryListCommaNewlineAfter from "./media-query-list-comma-newline-after/index.ts"
import mediaQueryListCommaNewlineBefore from "./media-query-list-comma-newline-before/index.ts"
import mediaQueryListCommaSpaceAfter from "./media-query-list-comma-space-after/index.ts"
import mediaQueryListCommaSpaceBefore from "./media-query-list-comma-space-before/index.ts"
import namedGridAreasAlignment from "./named-grid-areas-alignment/index.ts"
import noEmptyFirstLine from "./no-empty-first-line/index.ts"
import noEolWhitespace from "./no-eol-whitespace/index.ts"
import noExtraSemicolons from "./no-extra-semicolons/index.ts"
import noMissingEndOfSourceNewline from "./no-missing-end-of-source-newline/index.ts"
import noMultipleWhitespaces from "./no-multiple-whitespaces/index.ts"
import numberLeadingZero from "./number-leading-zero/index.ts"
import numberNoTrailingZeros from "./number-no-trailing-zeros/index.ts"
import propertyCase from "./property-case/index.ts"
import selectorAttributeBracketsSpaceInside from "./selector-attribute-brackets-space-inside/index.ts"
import selectorAttributeOperatorSpaceAfter from "./selector-attribute-operator-space-after/index.ts"
import selectorAttributeOperatorSpaceBefore from "./selector-attribute-operator-space-before/index.ts"
import selectorCombinatorSpaceAfter from "./selector-combinator-space-after/index.ts"
import selectorCombinatorSpaceBefore from "./selector-combinator-space-before/index.ts"
import selectorDescendantCombinatorNoNonSpace from "./selector-descendant-combinator-no-non-space/index.ts"
import selectorListCommaNewlineAfter from "./selector-list-comma-newline-after/index.ts"
import selectorListCommaNewlineBefore from "./selector-list-comma-newline-before/index.ts"
import selectorListCommaSpaceAfter from "./selector-list-comma-space-after/index.ts"
import selectorListCommaSpaceBefore from "./selector-list-comma-space-before/index.ts"
import selectorMaxEmptyLines from "./selector-max-empty-lines/index.ts"
import selectorPseudoClassCase from "./selector-pseudo-class-case/index.ts"
import selectorPseudoClassParenthesesSpaceInside from "./selector-pseudo-class-parentheses-space-inside/index.ts"
import selectorPseudoElementCase from "./selector-pseudo-element-case/index.ts"
import stringQuotes from "./string-quotes/index.ts"
import unicodeBom from "./unicode-bom/index.ts"
import unitCase from "./unit-case/index.ts"
import valueListCommaNewlineAfter from "./value-list-comma-newline-after/index.ts"
import valueListCommaNewlineBefore from "./value-list-comma-newline-before/index.ts"
import valueListCommaSpaceAfter from "./value-list-comma-space-after/index.ts"
import valueListCommaSpaceBefore from "./value-list-comma-space-before/index.ts"
import valueListMaxEmptyLines from "./value-list-max-empty-lines/index.ts"

let rules: { readonly [name: string]: Rule } = {
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
