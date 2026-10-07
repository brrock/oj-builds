# One-time npm setup for trusted publishing, plus release helpers.
#
#   make login       # log in to npm (account needs 2FA enabled)
#   make setup       # bootstrap + trust: run once, after `make login`
#   make release     # trigger the GitHub Action for the latest oj release
#   make release VERSION=0.2.16
#
# Trusted publishing can only be configured on a package that already exists,
# so `bootstrap` publishes an empty 0.0.0 of each package by hand first.
# After `setup`, every publish comes from .github/workflows/release.yml via
# OIDC; no npm token is stored anywhere.

REPO     ?= brrock/oj-builds
WORKFLOW ?= release.yml
PACKAGES  = @brrock/oj-linux-x64-gnu @brrock/oj-linux-arm64-gnu @brrock/oj
DIRS      = npm/linux-x64-gnu npm/linux-arm64-gnu npm/oj
VERSION  ?=

.PHONY: login whoami bootstrap trust trust-list setup lockdown release watch pack

login:
	npm login

whoami:
	npm whoami

# Publish placeholder 0.0.0 packages so trust can be configured on them.
bootstrap:
	@for dir in $(DIRS); do \
	  name=$$(node -p "require('./$$dir/package.json').name"); \
	  if npm view "$$name" name >/dev/null 2>&1; then \
	    echo "$$name already exists on npm, skipping"; \
	  else \
	    echo "publishing placeholder $$name@0.0.0"; \
	    npm publish "./$$dir" --access public || exit 1; \
	  fi; \
	done

# Let release.yml in $(REPO) publish each package via OIDC.
# npm asks for 2FA on the first one; tick "skip 2FA for 5 minutes" to do the rest in one go.
trust:
	@for pkg in $(PACKAGES); do \
	  echo "trusting $(REPO)/.github/workflows/$(WORKFLOW) for $$pkg"; \
	  npm trust github "$$pkg" --repo $(REPO) --file $(WORKFLOW) --allow-publish -y || exit 1; \
	done

trust-list:
	@for pkg in $(PACKAGES); do echo "== $$pkg"; npm trust list "$$pkg"; done

setup: whoami bootstrap trust trust-list

# Optional hardening once trusted publishing works: require 2FA and disallow
# token publishes (OIDC publishes are unaffected).
lockdown:
	@for pkg in $(PACKAGES); do npm access set mfa=publish "$$pkg" || exit 1; done

release:
	gh workflow run $(WORKFLOW) -R $(REPO) $(if $(VERSION),-f version=$(VERSION))
	@echo "started; run 'make watch' to follow it"

watch:
	gh run watch -R $(REPO) $$(gh run list -R $(REPO) -w $(WORKFLOW) -L 1 --json databaseId -q '.[0].databaseId')

# Inspect what would be published, without publishing.
pack:
	@for dir in $(DIRS); do npm pack "./$$dir" --dry-run; done
