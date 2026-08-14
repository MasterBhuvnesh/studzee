#!/bin/bash
#
# Release script. Bumps a module version, stages the manifest, and prints the
# git commands that cut the release.
#
# It deliberately does not commit, tag or push. The tag is what triggers the
# GitHub Actions pipeline that builds and publishes the image, so cutting one is
# an explicit decision the owner makes, not a side effect of running a script.
#
# Usage:   ./release.sh <service> [patch|minor|major]
# Example: ./release.sh backend minor
# Default bump type: patch
#
# Author: Bhuvnesh Verma

set -euo pipefail

# --- Configuration ---

# Modules that can be released. Each name must match a directory at the
# repository root once uppercased, and that directory must hold a package.json.
#
# Add "website" here when that module returns. It was removed from the tree on
# 10-08-2026 during the v2 strip, along with "notification", which was merged
# into the backend and no longer exists as a separate release target.
VALID_SERVICES="backend mobile desktop"

# ANSI colours for readable output.
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

usage() {
    echo -e "${YELLOW}Usage: $0 <service> [patch|minor|major]${NC}"
    echo -e "${YELLOW}Services: ${VALID_SERVICES}${NC}"
    echo -e "${YELLOW}Example: $0 backend minor${NC}"
}

# --- Argument validation ---

if [ $# -lt 1 ]; then
    echo -e "${RED}Error: Service name is required.${NC}"
    usage
    exit 1
fi

SERVICE_NAME=$1
VERSION_TYPE=${2:-patch}

# Word match against the list rather than a regex, so adding a module is a
# one word edit above and cannot silently break the pattern.
if [[ ! " $VALID_SERVICES " == *" $SERVICE_NAME "* ]]; then
    echo -e "${RED}Error: Invalid service name '${SERVICE_NAME}'.${NC}"
    echo -e "${RED}Valid services are: ${VALID_SERVICES}${NC}"
    exit 1
fi

if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
    echo -e "${RED}Error: Invalid version type '${VERSION_TYPE}'. Use 'patch', 'minor', or 'major'.${NC}"
    exit 1
fi

# --- Locate the module ---

# Resolved to an absolute path so the script behaves the same whether it is run
# from the repository root or from a module directory through an npm script.
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

# Module directories are the uppercased service name: backend -> BACKEND.
SERVICE_DIR_NAME=$(echo "$SERVICE_NAME" | tr '[:lower:]' '[:upper:]')
SERVICE_DIR="$SCRIPT_DIR/$SERVICE_DIR_NAME"

if [ ! -d "$SERVICE_DIR" ]; then
    echo -e "${RED}Error: Directory $SERVICE_DIR does not exist.${NC}"
    exit 1
fi

if [ ! -f "$SERVICE_DIR/package.json" ]; then
    echo -e "${RED}Error: package.json not found in $SERVICE_DIR.${NC}"
    exit 1
fi

cd "$SERVICE_DIR"

CURRENT_VERSION=$(node -p "require('./package.json').version")

# --- Confirmation ---

echo -e "${BLUE}Module:  ${SERVICE_NAME} (${SERVICE_DIR})${NC}"
echo -e "${BLUE}Current: v${CURRENT_VERSION}${NC}"
echo -e "${BLUE}Bump:    ${VERSION_TYPE}${NC}"
echo -e "${YELLOW}WARNING: this rewrites the version in package.json and stages it.${NC}"
read -r -p "Proceed? (y/n): " -n 1 REPLY
echo
if [[ ! "$REPLY" =~ ^[yY]$ ]]; then
    echo -e "${RED}Operation cancelled by user.${NC}"
    exit 1
fi

# --- Bump ---

echo -e "${YELLOW}Bumping ${SERVICE_NAME} by ${VERSION_TYPE}...${NC}"
npm version "$VERSION_TYPE" --no-git-tag-version >/dev/null

# Read through node rather than grepping the file. A grep for the first
# "version" line can match a dependency entry and produce a wrong tag.
VERSION=$(node -p "require('./package.json').version")
TAG="${SERVICE_NAME}-v${VERSION}"

echo -e "${GREEN}New version for '${SERVICE_NAME}' is: ${VERSION}${NC}"

# Catch a tag collision now, while the bump is still trivial to undo, rather
# than after the commit when `git tag` fails.
if git rev-parse "$TAG" >/dev/null 2>&1; then
    echo -e "${RED}Error: tag ${TAG} already exists.${NC}"
    echo -e "${RED}The version bump has been written to package.json but not committed.${NC}"
    echo -e "${RED}Revert it with: git checkout -- package.json${NC}"
    exit 1
fi

# --- Stage ---

echo -e "${YELLOW}Staging package.json...${NC}"
git add package.json
if [ -f "package-lock.json" ]; then
    git add package-lock.json
fi

# --- Hand back to the operator ---
#
# The push is not run here on purpose. Pushing the tag triggers the build and
# publish pipeline, so it stays a deliberate manual step after review.

echo -e "\n${YELLOW}Staged. To complete the release, run:${NC}\n"
echo -e "${GREEN}git commit -m \"chore(${SERVICE_NAME}): bump version to v${VERSION}\" && \\
  git tag -a \"${TAG}\" -m \"Release ${SERVICE_NAME} version ${VERSION}\" && \\
  git push origin HEAD --tags${NC}\n"
echo -e "${BLUE}Pushing ${TAG} triggers .github/workflows/docker-${SERVICE_NAME}.testing.yml,${NC}"
echo -e "${BLUE}which runs lint, typecheck and the test suite before it publishes anything.${NC}"
