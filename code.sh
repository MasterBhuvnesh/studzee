#!/bin/bash

# This script automates version bumping, Git tagging, and prepares changes for remote pushing.
# It dynamically determines the service to update based on command-line arguments.

# Usage: ./code.sh [service-name] [patch|minor|major]
# Example: ./code.sh notification minor
# Default bump type: patch

# --- Argument Validation ---
if [ -z "$1" ]; then
    echo -e "\033[0;31mError: Service name is required.\033[0m"
    echo -e "\033[0;33mUsage: $0 [service-name] [patch|minor|major]\033[0m"
    echo -e "\033[0;33mExample: $0 notification minor\033[0m"
    exit 1
fi

# Set variables from command-line arguments
SERVICE_NAME=$1
VERSION_TYPE=${2:-patch} # Default to 'patch' if the second argument is not provided

# Define ANSI color codes for consistent output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Validate the provided service name.
# Add your other service names to this regex pattern, e.g., ^(notification|backend|mobile)$
if [[ ! "$SERVICE_NAME" =~ ^(notification|backend|mobile)$ ]]; then
    echo -e "${RED}Error: Invalid service name '${SERVICE_NAME}'. Please use 'notification', 'backend', or 'mobile'.${NC}"
    exit 1
fi

# Validate the provided version type.
if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
    echo -e "${RED}Error: Invalid version type '${VERSION_TYPE}'. Please use 'patch', 'minor', or 'major'.${NC}"
    exit 1
fi
# --- End Argument Validation ---

# --- Confirmation Prompt ---
echo -e "${YELLOW}WARNING: This script will update version for the '${SERVICE_NAME}' service.${NC}"
read -p "Are you sure you want to proceed? (y/n): " -n 1 -r
echo # Add a newline for cleaner output
if [[ ! "$REPLY" =~ ^[yY]$ ]]; then
    echo -e "${RED}Operation cancelled by user.${NC}"
    exit 1
fi
# --- End Confirmation Prompt ---

# Get the script's directory, which is the project root.
SCRIPT_DIR=$(dirname "$0")

# Dynamically determine the service directory path by converting the service name to uppercase.
# e.g., 'notification' -> 'NOTIFICATION'
SERVICE_DIR_NAME=${SERVICE_NAME^^}
SERVICE_DIR="$SCRIPT_DIR/$SERVICE_DIR_NAME"

echo -e "${BLUE}DEBUG: Target service directory is: $SERVICE_DIR${NC}"

# Navigate to the service's directory.
cd "$SERVICE_DIR" || { echo -e "${RED}Error: Could not navigate to $SERVICE_DIR. Ensure the directory exists.${NC}"; exit 1; }

# Check for 'package.json' in the current service directory.
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found in $(pwd).${NC}"
    exit 1
fi

# Bump the package version using npm.
echo -e "${YELLOW}Bumping version for '${SERVICE_NAME}' by '$VERSION_TYPE'...${NC}"
npm version "$VERSION_TYPE" --no-git-tag-version

# Retrieve the newly updated version from 'package.json'.
# VERSION=$(jq -r '.version' package.json)
VERSION=$(grep -oP '"version": "\K[^"]+' package.json)
echo -e "${GREEN}New version for '${SERVICE_NAME}' is: $VERSION${NC}"

# Stage 'package.json' and 'package-lock.json' for Git commit.
echo -e "${YELLOW}Staging package.json and package-lock.json...${NC}"
git add package.json 
if [ -f "package-lock.json" ]; then
  git add package-lock.json
fi

# Provide the user with the final Git commands for committing, tagging, and pushing.
echo -e "\n${YELLOW}✅ All set! To complete the release, run the following command:${NC}"
echo -e "${GREEN}git commit -m \"chore(${SERVICE_NAME}): bump version to v$VERSION\" && git tag -a \"${SERVICE_NAME}-v$VERSION\" -m \"Release ${SERVICE_NAME} version $VERSION\" && git push origin HEAD --tags${NC}"

#   ==========================================================
# The following commands are for manual execution after the script runs.
#   ==========================================================
<<COMMENT
# Commit the version bump.
echo -e "${YELLOW}Committing version bump...${NC}"
git commit -m "Version updated to v$VERSION"

# Create a Git tag for the new version.
# '-a' creates an annotated tag, which is recommended for releases.
# The tag name is prefixed with 'v' (e.g., v1.0.1).
# '-m' provides a message for the tag.
echo -e "${YELLOW}Creating Git tag v$VERSION...${NC}"
git tag -a "v$VERSION" -m "Release version $VERSION"

# Push the committed changes and the new tag to the remote repository.
# 'git push origin HEAD' pushes the current branch's commits to the 'origin' remote.
# '--tags' pushes all local tags to the remote.
echo -e "${YELLOW}Pushing changes and tags to remote repository...${NC}"
echo -e "${GREEN}Script finished successfully. Version v$VERSION released.${NC} "
echo -e "${BLUE}All that remains is to push the changes to the remote repository.${NC}"
echo -e "${YELLOW}Use 'git push origin HEAD --tags' to push the changes and tags.${NC}"

COMMENT
# ==========================================================
# Note: The actual push command is not executed in this script to avoid accidental pushes.
# Users should review the changes and run the push command manually.
# ==========================================================
# Author: Bhuvnesh Verma