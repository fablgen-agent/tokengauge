import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(import.meta.dirname, "../..");

describe("production release layout", () => {
  it("runs systemd from the immutable current release", async () => {
    const unit = await readFile(resolve(repositoryRoot, "ops/tokengauge.service"), "utf8");

    expect(unit).toContain("WorkingDirectory=/home/admin/tokengauge/.deploy/current");
    expect(unit).toContain("/home/admin/tokengauge/.deploy/current/server.js");
    expect(unit).not.toContain(".next/standalone");
  });

  it("assembles, switches, verifies, and bounds releases", async () => {
    const deploy = await readFile(resolve(repositoryRoot, "ops/deploy.sh"), "utf8");
    const gitignore = await readFile(resolve(repositoryRoot, ".gitignore"), "utf8");
    const eslintConfig = await readFile(resolve(repositoryRoot, "eslint.config.mjs"), "utf8");

    expect(gitignore).toContain("/.deploy/");
    expect(eslintConfig).toContain('".deploy/**"');
    expect(deploy).toContain("rsync -a --delete --safe-links");
    expect(deploy).toContain("--exclude='.data/'");
    expect(deploy).toContain("--exclude='.env*'");
    expect(deploy).toContain("mv -Tf \"$NEXT_LINK\" \"$CURRENT_LINK\"");
    expect(deploy).toContain("systemctl is-active --quiet tokengauge.service");
    expect(deploy).toContain("--connect-timeout 1 --max-time 3");
    expect(deploy).toContain("--property=MainPID");
    expect(deploy).toContain("flock -n \"$DEPLOY_LOCK_FD\"");
    expect(deploy).toContain("trap 'finish $?' EXIT");
    expect(deploy).toContain("emergency_rollback");
    expect(deploy).toContain("restore_unit_snapshot");
    expect(deploy).toContain("bootstrap_release_id=");
    expect(deploy.indexOf("bootstrap_release_id=")).toBeLessThan(deploy.indexOf("npm run check"));
    expect(deploy).toContain("ROLLBACK_TARGET=\"$previous_target\"");
    expect(deploy).toContain("stale_release\" != \"$active_release");
    expect(deploy).toContain("stale_release\" != \"$rollback_release");
    expect(deploy).toContain("awk 'NR > 3 { print $2 }'");
    expect(deploy).not.toContain("$APP_DIR/.next/standalone/.next/static");
  });
});
