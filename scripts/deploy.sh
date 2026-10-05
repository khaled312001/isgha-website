#!/usr/bin/env bash
# تحديث الموقع على Hostinger: سحب آخر نسخة من GitHub، تثبيت الحزم، وإعادة تشغيل التطبيق.
# يُشغَّل على السيرفر من داخل مجلد التطبيق:
#   bash scripts/deploy.sh
# الترحيلات (migrations) تعمل تلقائيًا عند إعادة التشغيل (AUTO_MIGRATE=true).
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
NODE_BIN="${NODE_BIN:-/opt/alt/alt-nodejs22/root/bin}"
DEPLOY_KEY="${DEPLOY_KEY:-$HOME/.ssh/isgha_deploy}"
BRANCH="${BRANCH:-main}"

export PATH="$NODE_BIN:$PATH"
export GIT_SSH_COMMAND="ssh -i $DEPLOY_KEY -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"

cd "$APP_DIR"
before="$(git rev-parse --short HEAD 2>/dev/null || echo none)"
git fetch --quiet origin "$BRANCH"
git reset --hard --quiet "origin/$BRANCH"
after="$(git rev-parse --short HEAD)"

# تثبيت الحزم فقط عند تغيّر package-lock.json أو عدم وجود node_modules
if [ ! -d node_modules ] || ! git diff --quiet "$before" "$after" -- package-lock.json 2>/dev/null; then
  npm ci --omit=dev --no-audit --no-fund
fi

mkdir -p tmp
touch tmp/restart.txt
echo "تم التحديث: $before → $(git log -1 --format='%h %s')"
