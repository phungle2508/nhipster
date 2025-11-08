#!/usr/bin/env bash
# create_public_submodules.sh
# Create public repos for each backend service and force push local content

set -euo pipefail

BASE=apps/backend
USER=maian3333
REPOS=(
  "nhipster-gateway|gateway"
  "nhipster-ms-booking|ms_booking"
  "nhipster-ms-promotion|ms_promotion"
  "nhipster-ms-route|ms_route"
  "nhipster-ms-user|ms_user"
)

for entry in "${REPOS[@]}"; do
  IFS="|" read -r repo folder <<<"$entry"
  echo ""
  echo "=============================="
  echo "Creating repo: $repo"
  echo "Folder       : $BASE/$folder"
  echo "=============================="

  gh repo create "$USER/$repo" --public --confirm

  cd "$BASE/$folder"
  rm -rf .git
  git init
  git add .
  git commit -m "Initial import (public repo)"
  git branch -M main
  git remote add origin "https://github.com/$USER/$repo.git"
  git push -u origin main --force
  cd - >/dev/null
done

echo ""
echo "✅ All public submodule repos created and pushed successfully."
