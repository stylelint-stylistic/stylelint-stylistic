SHELL := bash
.SHELLFLAGS := -euo pipefail -c
.ONESHELL:

export PATH := $(CURDIR)/node_modules/.bin:$(PATH)

OUT ?= tmp/oracles

ANSI_RESET := \033[0m
ANSI_BOLD := \033[1m
ANSI_BOLD_CYAN := \033[1;36m

help: ## 🧾 Print this message
	@printf "\n\t📜 $(ANSI_BOLD)Available targets:$(ANSI_RESET)\n\n"
	$(call print_help)
.PHONY: help

setup: ## 🛠️  Setup the project environment
	@command -v pnpm >/dev/null 2>&1 || $(call pnpm_alert) ; set -x
	pnpm ci
	git config --local core.hooksPath .githooks
.PHONY: setup

check: ## ✅ Check types with TypeScript
	tsc --noEmit
.PHONY: check

lint: ## 🧬 Check code by oxlint [LINT_FLAGS=] [FILE=]
	oxlint $(LINT_FLAGS) $(FILE)
.PHONY: lint

test: ## 🧪 Run tests [TEST_FLAGS=] [FILE=]
	vitest $(TEST_FLAGS) $(FILE)
.PHONY: test

prose: ## ✍️  Bind function words in markdown with non-breaking spaces
	./scripts/bind-prose.js
.PHONY: prose

prose-check: ## 🔤 Check that markdown prose is bound
	./scripts/bind-prose.js --check
.PHONY: prose-check

oracles: ## 🔮 Run every oracle over every rule and option [RUN=1] [OUT=]
	$(call require_run,every oracle — about 350 000 lints and four to five minutes on an idle machine)
	@mkdir -p $(OUT)
	for oracle in converge control comments twins nodes pairs ; do
		printf "\t🔮 $$oracle\n"
		HARNESS_RUN=1 ./scripts/oracles/$$oracle.mjs > $(OUT)/$$oracle.json
	done
	@printf "\t✅ Written to $(ANSI_BOLD)$(OUT)$(ANSI_RESET). Run once before a branch and once after, and read the diff.\n\n"
.PHONY: oracles

sweep: ## 🧹 Run one sweep script, base and branch alike [RUN=1] FILE=
	@test -n "$(FILE)" || { printf "\t❌ $(ANSI_BOLD)FILE= names the sweep to run$(ANSI_RESET)\n\n"; exit 2; }
	$(call require_run,the sweep $(FILE))
	HARNESS_RUN=1 node $(FILE)
.PHONY: sweep

harness-check: ## 🧫 Check that the direct runner agrees with Stylelint over every run of the oracles [RUN=1]
	$(call require_run,the runner check — about 60 000 lints)
	HARNESS_RUN=1 ./scripts/harness/verify-lint.mjs
.PHONY: harness-check

breaks-check: ## ↩️  Check that every line spelling a line break in lib/ is classified
	./scripts/check-break-readings.js
.PHONY: breaks-check

verify: check lint test prose-check breaks-check ## ✅ Run every check the CI runs
.PHONY: verify

release: verify ## 🚀 Release a new version
	pnx @firefoxic/release-it
.PHONY: release

# A run of the oracles or of a sweep is the slowest thing this repository does, and it is asked for far more often than it is needed: what it compares is two states of the tree, and the state of a commit does not change with the commit's date or its message. So nothing here collects results without RUN=1, and a permission rule of the user's own makes that spelling prompt. Without it the target says what it would have run and stops — the recipe exits with the code below, and make reports it — which a session reads as "ask first" rather than as a failure of the build. A comma cannot stand in the argument, since `call` would read it as a second one.
define require_run
	@if [ "$(RUN)" != "1" ] ; then
		printf "\n\t⏸  $(ANSI_BOLD)Not running$(ANSI_RESET) $(1).\n"
		printf "\tA run collects new results, so it is asked for rather than started: the user approves it by adding $(ANSI_BOLD)RUN=1$(ANSI_RESET) to this very command.\n\n"
		exit 3
	fi
endef

define pnpm_alert
	(
		printf "\t❌ $(ANSI_BOLD)pnpm not found in PATH$(ANSI_RESET)\n"
		printf "\tPlease install pnpm first:\n"
		printf "\thttps://pnpm.io/installation\n\n"
		exit 1
	)
endef

define print_help
	grep -E '^[a-zA-Z0-9_-]+:.*?## ' $(MAKEFILE_LIST) \
	| awk -F ':|##' '\
	BEGIN { \
		ANSI_BOLD_CYAN = "$(ANSI_BOLD_CYAN)"; \
		ANSI_RESET = "$(ANSI_RESET)"; \
	} \
	{ \
		targets[NR]=$$1; descs[NR]=$$3; \
		if (length($$1) > max) max = length($$1); \
	} \
	END { \
		for (i = 1; i <= NR; i++) { \
			printf "\t%s%" max "s%s —%s\n", ANSI_BOLD_CYAN, targets[i], ANSI_RESET, descs[i]; \
		} \
		printf "\n" \
	}'
endef
