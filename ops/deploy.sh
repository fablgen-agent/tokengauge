#!/usr/bin/env bash
set -euo pipefail

APP_DIR=/home/admin/tokengauge
NODE_BIN_DIR=/opt/node-v24.19.0/bin
DEPLOY_ROOT="$APP_DIR/.deploy"
RELEASES_DIR="$DEPLOY_ROOT/releases"
CURRENT_LINK="$DEPLOY_ROOT/current"
UNIT_SOURCE="$APP_DIR/ops/tokengauge.service"
UNIT_TARGET=/etc/systemd/system/tokengauge.service
HEALTH_URL=""

STAGING_DIR=""
NEXT_LINK=""
UNIT_BACKUP=""
UNIT_WAS_PRESENT=false
ROLLBACK_MODE=""
ROLLBACK_TARGET=""
ROLLBACK_IN_PROGRESS=false

cleanup_temporary_files() {
  if [[ -n "${STAGING_DIR:-}" && "$STAGING_DIR" == "$RELEASES_DIR"/.staging-* ]]; then
    rm -rf -- "$STAGING_DIR"
  fi
  if [[ -n "${NEXT_LINK:-}" && "$NEXT_LINK" == "$DEPLOY_ROOT"/.current-* ]]; then
    rm -f -- "$NEXT_LINK"
  fi
  if [[ -n "${UNIT_BACKUP:-}" && "$UNIT_BACKUP" == "$DEPLOY_ROOT"/.unit-backup-* ]]; then
    rm -f -- "$UNIT_BACKUP"
  fi
}

safe_build_id() {
  local build_id
  if [[ ! -f "$APP_DIR/.next/BUILD_ID" ]] \
    || (( $(wc -l < "$APP_DIR/.next/BUILD_ID") > 1 )); then
    echo "Next.js emitted a missing or multiline build identifier." >&2
    return 1
  fi
  build_id="$(<"$APP_DIR/.next/BUILD_ID")"
  if [[ "$build_id" == *$'\r'* || "$build_id" == *$'\n'* \
    || ! "$build_id" =~ ^[A-Za-z0-9_-]+$ ]]; then
    echo "Next.js emitted an unsafe build identifier." >&2
    return 1
  fi
  printf '%s\n' "$build_id"
}

assemble_release() {
  local release_id=$1
  local release_dir="$RELEASES_DIR/$release_id"

  if [[ ! "$release_id" =~ ^[A-Za-z0-9_.-]+$ || -e "$release_dir" ]]; then
    echo "Refusing an unsafe or duplicate release identifier." >&2
    return 1
  fi

  STAGING_DIR="$RELEASES_DIR/.staging-$release_id-$$"
  install -d -m 755 "$STAGING_DIR"
  rsync -a --delete --safe-links \
    --exclude='.data/' \
    --exclude='.env*' \
    "$APP_DIR/.next/standalone/" "$STAGING_DIR/"
  install -d -m 755 "$STAGING_DIR/.next/static"
  rsync -a --delete --safe-links \
    --exclude='.data/' \
    --exclude='.env*' \
    "$APP_DIR/.next/static/" "$STAGING_DIR/.next/static/"
  if test -d "$APP_DIR/public"; then
    install -d -m 755 "$STAGING_DIR/public"
    rsync -a --delete --safe-links \
      --exclude='.data/' \
      --exclude='.env*' \
      "$APP_DIR/public/" "$STAGING_DIR/public/"
  fi

  if ! test -f "$STAGING_DIR/server.js"; then
    echo "The assembled release is missing server.js." >&2
    return 1
  fi
  if [[ -n "$(find "$STAGING_DIR" -name '.data' -print -quit)" ]]; then
    echo "The assembled release unexpectedly contains application data." >&2
    return 1
  fi
  if [[ -z "$(find "$STAGING_DIR/.next/static" -type f -print -quit)" ]]; then
    echo "The assembled release contains no static assets." >&2
    return 1
  fi
  if [[ -n "$(find "$STAGING_DIR" \( -type f -o -type l \) -name '.env*' -print -quit)" ]]; then
    echo "The assembled release unexpectedly contains an environment file." >&2
    return 1
  fi

  local link_path resolved_path
  while IFS= read -r -d '' link_path; do
    resolved_path="$(realpath -m -- "$link_path")"
    if [[ "$resolved_path" != "$STAGING_DIR"/* ]]; then
      echo "The assembled release contains a symlink outside its release directory." >&2
      return 1
    fi
  done < <(find "$STAGING_DIR" -type l -print0)

  mv "$STAGING_DIR" "$release_dir"
  STAGING_DIR=""
}

switch_current() {
  local target=$1
  if [[ ! "$target" =~ ^releases/[A-Za-z0-9_.-]+$ || ! -d "$DEPLOY_ROOT/$target" ]]; then
    echo "Refusing to activate an unsafe or missing release target." >&2
    return 1
  fi
  NEXT_LINK="$DEPLOY_ROOT/.current-$$-$(date -u +%s%N)"
  ln -s "$target" "$NEXT_LINK"
  mv -Tf "$NEXT_LINK" "$CURRENT_LINK"
  NEXT_LINK=""
}

snapshot_current_unit() {
  if [[ -n "$UNIT_BACKUP" && "$UNIT_BACKUP" == "$DEPLOY_ROOT"/.unit-backup-* ]]; then
    rm -f -- "$UNIT_BACKUP"
  fi
  UNIT_BACKUP=""
  UNIT_WAS_PRESENT=false
  if test -f "$UNIT_TARGET"; then
    UNIT_BACKUP="$DEPLOY_ROOT/.unit-backup-$$"
    cp --preserve=mode,timestamps "$UNIT_TARGET" "$UNIT_BACKUP"
    UNIT_WAS_PRESENT=true
  fi
}

restore_unit_snapshot() {
  if [[ "$UNIT_WAS_PRESENT" == true && -n "$UNIT_BACKUP" && -f "$UNIT_BACKUP" ]]; then
    if ! timeout 15s sudo -n install -m 0644 "$UNIT_BACKUP" "$UNIT_TARGET"; then
      return 1
    fi
  elif ! timeout 15s sudo -n rm -f -- "$UNIT_TARGET"; then
    return 1
  fi
  timeout 15s sudo -n systemctl daemon-reload
}

install_unit() {
  if ! timeout 15s sudo -n install -m 0644 "$UNIT_SOURCE" "$UNIT_TARGET" \
    || ! timeout 15s sudo -n systemctl daemon-reload; then
    echo "Unit installation failed; restoring its pre-activation snapshot." >&2
    restore_unit_snapshot || echo "The pre-activation unit snapshot could not be restored." >&2
    return 1
  fi
}

wait_for_runtime() {
  local expected_cwd=$1
  local deadline=$((SECONDS + 30))
  local main_pid actual_cwd
  while (( SECONDS < deadline )); do
    if timeout 3s sudo -n systemctl is-active --quiet tokengauge.service; then
      main_pid="$(timeout 3s sudo -n systemctl show tokengauge.service --property=MainPID --value 2>/dev/null || true)"
      if [[ "$main_pid" =~ ^[1-9][0-9]*$ ]]; then
        actual_cwd="$(readlink -f -- "/proc/$main_pid/cwd" 2>/dev/null || true)"
        if [[ "$actual_cwd" == "$expected_cwd" ]] \
          && curl --connect-timeout 1 --max-time 3 -fsS "$HEALTH_URL" >/dev/null; then
          return 0
        fi
      fi
    fi
    sleep 1
  done
  return 1
}

wait_for_release() {
  local target=$1
  local expected_cwd
  expected_cwd="$(readlink -f -- "$DEPLOY_ROOT/$target")"
  wait_for_runtime "$expected_cwd"
}

wait_for_legacy_runtime() {
  local expected_cwd
  expected_cwd="$(readlink -f -- "$APP_DIR/.next/standalone")"
  wait_for_runtime "$expected_cwd"
}

rollback_to_release() {
  local target=$1
  if ! switch_current "$target"; then
    return 1
  fi
  if ! restore_unit_snapshot; then
    return 1
  fi
  if ! timeout 45s sudo -n systemctl restart tokengauge.service; then
    return 1
  fi
  wait_for_release "$target"
}

emergency_rollback() {
  local mode=$ROLLBACK_MODE
  local target=$ROLLBACK_TARGET
  ROLLBACK_IN_PROGRESS=true
  ROLLBACK_MODE=""
  ROLLBACK_TARGET=""

  echo "Interrupted activation detected; restoring the last known runtime." >&2
  if [[ "$mode" == legacy ]]; then
    rm -f -- "$CURRENT_LINK"
    if ! restore_unit_snapshot \
      || ! timeout 45s sudo -n systemctl restart tokengauge.service \
      || ! wait_for_legacy_runtime; then
      echo "The legacy runtime failed after emergency rollback." >&2
      return 1
    fi
  elif [[ "$mode" == release ]]; then
    if ! rollback_to_release "$target"; then
      echo "The previous immutable runtime failed after emergency rollback." >&2
      return 1
    fi
  fi
  return 0
}

finish() {
  local status=$1
  trap - EXIT INT TERM HUP
  set +e
  if (( status != 0 )) && [[ -n "$ROLLBACK_MODE" && "$ROLLBACK_IN_PROGRESS" == false ]]; then
    emergency_rollback || true
  fi
  cleanup_temporary_files
  exit "$status"
}

trap 'exit 130' INT
trap 'exit 143' TERM
trap 'exit 129' HUP
trap 'finish $?' EXIT

install -d -m 755 "$DEPLOY_ROOT" "$RELEASES_DIR"
exec {DEPLOY_LOCK_FD}>"$DEPLOY_ROOT/deploy.lock"
if ! flock -n "$DEPLOY_LOCK_FD"; then
  echo "Another TokenGauge deployment is already running." >&2
  exit 1
fi

snapshot_current_unit

cd "$APP_DIR"
set -a
# Static metadata and sitemap URLs are resolved at build time, so the production
# origin must be present before `next build`, not only in the systemd service.
# The production configuration is intentionally external to the repository.
# shellcheck disable=SC1091
source /home/admin/.config/tokengauge/runtime.env
set +a
if [[ "${APP_URL:-}" != https://* ]]; then
  echo "APP_URL must be an HTTPS production origin before deployment." >&2
  exit 1
fi
if [[ ! "${PORT:-3100}" =~ ^[1-9][0-9]{0,4}$ ]] || (( ${PORT:-3100} > 65535 )); then
  echo "PORT must be a valid TCP port before deployment." >&2
  exit 1
fi
HEALTH_URL="http://127.0.0.1:${PORT:-3100}/pricing"

if ! systemd-analyze verify "$UNIT_SOURCE"; then
  echo "The TokenGauge systemd unit did not pass verification." >&2
  exit 1
fi

if [[ -e "$CURRENT_LINK" && ! -L "$CURRENT_LINK" ]]; then
  echo "The production current path exists but is not a symbolic link." >&2
  exit 1
fi

# Migrate the first deployment before building. This snapshot keeps production
# independent from `.next` while the validation build replaces that directory.
if [[ ! -L "$CURRENT_LINK" ]]; then
  bootstrap_build_id="$(safe_build_id)"
  bootstrap_release_id="${bootstrap_build_id}-bootstrap-$(date -u +%Y%m%dT%H%M%S%NZ)-$$"
  assemble_release "$bootstrap_release_id"
  ROLLBACK_MODE=legacy
  ROLLBACK_TARGET=""
  if ! install_unit; then
    echo "The immutable runtime unit could not be installed." >&2
    exit 1
  fi
  if ! switch_current "releases/$bootstrap_release_id"; then
    echo "The bootstrap release could not be activated." >&2
    exit 1
  fi
  if ! timeout 45s sudo -n systemctl restart tokengauge.service \
    || ! wait_for_release "releases/$bootstrap_release_id"; then
    echo "The immutable runtime migration failed." >&2
    exit 1
  fi
  ROLLBACK_MODE=""
  ROLLBACK_TARGET=""
fi

current_target="$(readlink "$CURRENT_LINK")"
if [[ ! "$current_target" =~ ^releases/[A-Za-z0-9_.-]+$ || ! -d "$DEPLOY_ROOT/$current_target" ]]; then
  echo "The active release link is unsafe or missing." >&2
  exit 1
fi
snapshot_current_unit

PATH="$NODE_BIN_DIR:$PATH" node scripts/backup-database.mjs
PATH="$NODE_BIN_DIR:$PATH" npm run check
if grep -R -q 'http://127\.0\.0\.1:3000' "$APP_DIR/.next/server/app/pricing"*.html; then
  echo "Loopback canonical found in the production pricing build." >&2
  exit 1
fi
if ! grep -F -q "$APP_URL/pricing" "$APP_DIR/.next/server/app/pricing.html"; then
  echo "Production pricing canonical was not emitted during the build." >&2
  exit 1
fi

build_id="$(safe_build_id)"
release_id="${build_id}-$(date -u +%Y%m%dT%H%M%S%NZ)-$$"
assemble_release "$release_id"
previous_target="$current_target"
ROLLBACK_MODE=release
ROLLBACK_TARGET="$previous_target"
if ! install_unit; then
  echo "The new unit could not be installed; the active release was not changed." >&2
  exit 1
fi
if ! switch_current "releases/$release_id"; then
  echo "The new release could not be activated; the previous release remains active." >&2
  exit 1
fi

if ! timeout 45s sudo -n systemctl restart tokengauge.service \
  || ! wait_for_release "releases/$release_id"; then
  echo "The new release failed its health check; rolling back." >&2
  exit 1
fi
ROLLBACK_MODE=""
ROLLBACK_TARGET=""

active_target="$(readlink "$CURRENT_LINK")"
active_release="${active_target#releases/}"
rollback_release="${previous_target#releases/}"
mapfile -t stale_releases < <(
  find "$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d \
    ! -name '.staging-*' -printf '%T@ %f\n' \
    | sort -rn \
    | awk 'NR > 3 { print $2 }'
)
for stale_release in "${stale_releases[@]}"; do
  if [[ "$stale_release" =~ ^[A-Za-z0-9_.-]+$ \
    && "$stale_release" != "$active_release" \
    && "$stale_release" != "$rollback_release" ]]; then
    rm -rf -- "${RELEASES_DIR:?}/$stale_release"
  fi
done

printf 'Activated immutable TokenGauge release %s\n' "$release_id"
