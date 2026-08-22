#!/bin/sh
set -eu

backup_directory="${TOKEN_GAUGE_BACKUP_DIR:-/home/admin/.local/share/tokengauge/backups}"
destination="${TOKEN_GAUGE_BACKUP_DESTINATION:-}"
port="${TOKEN_GAUGE_BACKUP_PORT:-}"
identity="${TOKEN_GAUGE_BACKUP_IDENTITY:-}"
known_hosts="${TOKEN_GAUGE_BACKUP_KNOWN_HOSTS:-}"
remote_directory="${TOKEN_GAUGE_BACKUP_REMOTE_DIR:-}"
retention_days="${TOKEN_GAUGE_BACKUP_RETENTION_DAYS:-14}"

if [ -z "$destination" ] || [ -z "$port" ] || [ -z "$identity" ] || [ -z "$known_hosts" ] || [ -z "$remote_directory" ]; then
  echo "Offsite backup configuration is incomplete." >&2
  exit 1
fi

case "$retention_days" in
  ''|*[!0-9]*) echo "Backup retention must be a positive integer." >&2; exit 1 ;;
esac
if [ "$retention_days" -lt 1 ] || [ "$retention_days" -gt 365 ]; then
  echo "Backup retention must be between 1 and 365 days." >&2
  exit 1
fi
case "$port" in
  ''|*[!0-9]*) echo "Backup SSH port must be an integer." >&2; exit 1 ;;
esac
if [ "$port" -lt 1 ] || [ "$port" -gt 65535 ]; then
  echo "Backup SSH port must be between 1 and 65535." >&2
  exit 1
fi
case "$destination" in
  *[!A-Za-z0-9_.@:-]*) echo "Backup destination contains unsupported characters." >&2; exit 1 ;;
esac
case "$remote_directory" in
  /*) ;;
  *) echo "Backup remote directory must be an absolute path." >&2; exit 1 ;;
esac
case "$remote_directory" in
  *[!A-Za-z0-9_./-]*) echo "Backup remote directory contains unsupported characters." >&2; exit 1 ;;
esac
case "$identity:$known_hosts" in
  *[!A-Za-z0-9_./:-]*) echo "Backup identity or known-hosts path contains unsupported characters." >&2; exit 1 ;;
esac
case "$identity:$known_hosts" in
  /*:/*) ;;
  *) echo "Backup identity and known-hosts paths must be absolute." >&2; exit 1 ;;
esac
if [ ! -f "$identity" ] || [ ! -f "$known_hosts" ]; then
  echo "Backup identity or dedicated known-hosts file is missing." >&2
  exit 1
fi

latest_backup=$(find "$backup_directory" -maxdepth 1 -type f -name 'tokengauge-automatic-*.sqlite' -printf '%T@ %p\n' \
  | sort -n \
  | tail -n 1 \
  | cut -d' ' -f2-)
if [ -z "$latest_backup" ] || [ ! -f "$latest_backup" ]; then
  echo "No completed TokenGauge database backup is available." >&2
  exit 1
fi

backup_name=$(basename "$latest_backup")
ssh_command="ssh -i $identity -p $port -o IdentitiesOnly=yes -o BatchMode=yes -o UserKnownHostsFile=$known_hosts"

$ssh_command "$destination" "install -d -m 700 '$remote_directory'"
rsync -a --chmod=F600 -e "$ssh_command" "$latest_backup" "$destination:$remote_directory/$backup_name.partial"
$ssh_command "$destination" "chmod 600 '$remote_directory/$backup_name.partial' && mv '$remote_directory/$backup_name.partial' '$remote_directory/$backup_name' && find '$remote_directory' -maxdepth 1 -type f -name 'tokengauge-automatic-*.sqlite' -mtime +$retention_days -delete"

printf '{"backup":"%s","retentionDays":%s,"transport":"ssh"}\n' "$backup_name" "$retention_days"
