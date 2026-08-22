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

oracles: ## 🔮 Run the five oracles over every rule and option [OUT=]
	@mkdir -p $(OUT)
	for oracle in converge control comments twins nodes ; do
		printf "\t🔮 $$oracle\n"
		./scripts/oracles/$$oracle.mjs > $(OUT)/$$oracle.json
	done
	@printf "\t✅ Written to $(ANSI_BOLD)$(OUT)$(ANSI_RESET). Run once before a branch and once after, and read the diff.\n\n"
.PHONY: oracles

breaks-check: ## ↩️  Check that every line spelling a line break in lib/ is classified
	./scripts/check-break-readings.js
.PHONY: breaks-check

verify: check lint test prose-check breaks-check ## ✅ Run every check the CI runs
.PHONY: verify

release: verify ## 🚀 Release a new version
	pnx @firefoxic/release-it
.PHONY: release

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
