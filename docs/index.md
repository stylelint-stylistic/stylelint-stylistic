---
layout: home

hero:
  name: Stylelint Stylistic
  text: Stylistic Formatting for Stylelint
  tagline: Formatting and Linting in one go, with fully customizable rules
  image:
    src: /logo.svg
    alt: Stylelint Stylistic
  actions:
    - theme: brand
      text: Get started
      link: /user-guide/getting-started
    - theme: alt
      text: Rules
      link: /user-guide/rules
    - theme: alt
      text: GitHub
      link: https://github.com/stylelint-stylistic/stylelint-stylistic

features:
  - title: The rules Stylelint removed
    details: Stylelint 16 dropped the 76 rules that enforce stylistic conventions. They are all here, under the @stylistic/ prefix, and they keep up with Stylelint.
    link: https://stylelint.io/migration-guide/to-16#removed-deprecated-stylistic-rules
    linkText: What was removed
  - title: Autofixable
    details: Nearly every rule fixes what it reports, so one run of stylelint --fix brings a stylesheet to the convention.
    link: /user-guide/rules
    linkText: See the rules
  - title: CSS, SCSS, Less and styled templates
    details: The core reads plain CSS. A stylesheet in SCSS or Less, or a styled template, is read by the same rules under a namespace of its own.
    link: /user-guide/custom-syntaxes
    linkText: Custom syntaxes
---
