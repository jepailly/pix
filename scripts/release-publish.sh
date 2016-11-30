#!/usr/bin/env bash

set -e # https://www.gnu.org/software/bash/manual/bashref.html#The-Set-Builtin
set -o pipefail

# Set colors
RESET_COLOR="$(tput sgr0)"
BOLD=$(tput smso)
OFFBOLD=$(tput rmso)

# Colors (bold)
RED="$(tput bold ; tput setaf 1)"
GREEN="$(tput bold ; tput setaf 2)"
YELLOW="$(tput bold ; tput setaf 3)"
BLUE="$(tput bold ; tput setaf 4)"
CYAN="$(tput bold ; tput setaf 6)"

# Creates new release branch
# https://gist.github.com/DarrenN/8c6a5b969481725a4413
PACKAGE_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')

echo -e "Beginning release pulication for version ${GREEN}$PACKAGE_VERSION${RESET_COLOR}.\n"

# Checks we are on branch 'dev'
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "dev" ];
then
  echo -e "${RED}Wrong branch!${RESET_COLOR} You must be on branch ${GREEN}dev${RESET_COLOR} in order to make a release but your current one is ${RED}${CURRENT_BRANCH}${RESET_COLOR}.\n"
  exit 1
fi

# Checks we have no uncommited changes
if [ -n "$(git status --porcelain)" ];
then
    echo -e "${RED}You have uncommitted changes!${RESET_COLOR} Please commit or stash your changes first.\n"
    git status
    exit 1
fi

# Fetches all last changes
git fetch --all

git checkout master
echo -e "You are now on branch ${YELLOW}master${RESET_COLOR}.\n"

git merge origin/dev
git push origin master
git tag -a $PACKAGE_VERSION -m "Release version $PACKAGE_VERSION"
git push origin $PACKAGE_VERSION

npm run deploy:production
git checkout dev
echo -e "You are now on branch ${YELLOW}dev${RESET_COLOR}.\n"

echo -e "Release publication ${GREEN}succeeded${RESET_COLOR}."
