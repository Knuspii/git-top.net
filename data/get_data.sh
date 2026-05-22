#!/usr/bin/env bash
# Author: Knuspii
# Unified Data Fetcher for git-top.net

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOFTWARE_FILE="$SCRIPT_DIR/software.json"
MONTHLY_FILE="$SCRIPT_DIR/monthly_repos.json"
DAILY_FILE="$SCRIPT_DIR/daily_repos.json"
WEEKLY_FILE="$SCRIPT_DIR/weekly_repos.json"
THREE_MONTHS_FILE="$SCRIPT_DIR/three_months_repos.json"
STATUS_FILE="$SCRIPT_DIR/status.json"
ERROR_LOG="$SCRIPT_DIR/script_error.log"

# Token
source ${SCRIPT_DIR}/../../api_github.txt

# --- FUNCTIONS ---
get_gh_version() {
    local version
    version=$(curl -s -H "$GITHUB_TOKEN" "https://api.github.com/repos/$1/releases/latest" | jq -r '.tag_name // empty')
    # Trigger error if empty
    if [ -z "$version" ]; then return 1; fi
    echo "$version"
}

make_entry() {
    jq -nc --arg name "$1" --arg ver "$2" --arg desc "$3" --arg url "$4" \
    '{name: $name, version: $ver, description: $desc, url: $url}'
}

# --- PART 1: SOFTWARE RELEASES ---
echo "[1/6] Fetching Software Releases..."

DEBIAN_VER=$(curl -s "https://www.debian.org/releases/stable/" | grep -oP 'Debian \K[0-9]+\.[0-9]+' | head -n1 || true)
UBUNTU_VER=$(curl -s "https://launchpad.net/ubuntu/+series" | grep -B3 "Current Stable Release" | grep -m1 -oP '>[^<]+' | tr -d '>' | grep -oE '[0-9]+\.[0-9]+' | head -n1 || true)
NIXOS_VER=$(curl -s "https://nixos.org/download/" | tr -d '\n' | grep -oP 'Current version</span>.*?([0-9]{2}\.[0-9]{1,2})' | grep -oP '[0-9]{2}\.[0-9]{1,2}' | sed -n '2p' || true)

echo $DEBIAN_VER
echo $UBUNTU_VER
echo $NIXOS_VER

PODMAN_VER=$(get_gh_version "containers/podman")
FASTFETCH_VER=$(get_gh_version "fastfetch-cli/fastfetch")
ADGUARD_VER=$(get_gh_version "AdguardTeam/AdGuardHome")
BOTTOM_VER=$(get_gh_version "ClementTsang/bottom")
CRUNCHY_VER=$(get_gh_version "Knuspii/CrunchyCleaner")

# Validation: If any version variable is empty, trigger the failure handler
if [ -z "$DEBIAN_VER" ] || [ -z "$UBUNTU_VER" ] || [ -z "$NIXOS_VER" ] || \
   [ -z "$PODMAN_VER" ] || [ -z "$FASTFETCH_VER" ] || [ -z "$ADGUARD_VER" ] || \
   [ -z "$BOTTOM_VER" ] || [ -z "$CRUNCHY_VER" ]; then
    echo "ERROR: One or more software versions could not be fetched (empty result)." >&2
    false # Forces exit code 1 to trigger trap
fi

DEBIAN=$(make_entry "Debian" "$DEBIAN_VER" "Universal GNU/Linux distribution" "https://www.debian.org/")
UBUNTU=$(make_entry "Ubuntu" "$UBUNTU_VER" "Popular desktop & server distribution" "https://ubuntu.com/")
NIXOS=$(make_entry "NixOS" "$NIXOS_VER" "Linux distribution focused on declarative configuration and reproducibility." "https://nixos.org/")
PODMAN=$(make_entry "Podman" "$PODMAN_VER" "Tool for managing OCI containers" "https://github.com/containers/podman")
FASTFETCH=$(make_entry "Fastfetch" "$FASTFETCH_VER" "Fast, aesthetic system info tool" "https://github.com/fastfetch-cli/fastfetch")
ADGUARD=$(make_entry "AdGuard Home" "$ADGUARD_VER" "Network-wide ad blocker" "https://github.com/AdguardTeam/AdGuardHome")
BOTTOM=$(make_entry "Bottom" "$BOTTOM_VER" "Terminal-based system monitor" "https://github.com/ClementTsang/bottom")
CRUNCHY=$(make_entry "Crunchy Cleaner" "$CRUNCHY_VER" "System cleanup tool" "https://github.com/Knuspii/CrunchyCleaner")

jq -n --argjson deb "$DEBIAN" \
    --argjson ubu "$UBUNTU" \
    --argjson nix "$NIXOS" \
    --argjson pod "$PODMAN" \
    --argjson fas "$FASTFETCH" \
    --argjson adg "$ADGUARD" \
    --argjson bot "$BOTTOM" \
    --argjson cru "$CRUNCHY" \
    '[ $deb, $ubu, $nix, $pod, $fas, $adg, $bot, $cru ]' > "$SOFTWARE_FILE"

# --- BEST REPOS (LAST 24 HOURS) ---
echo "[2/6] Fetching Best Repos of the last 24h..."
DATE_24H=$(date -u -d '24 hours ago' '+%Y-%m-%dT%H:%M:%SZ')
DAILY_DATA=$(curl -s -H "$GITHUB_TOKEN" "https://api.github.com/search/repositories?q=created:>$DATE_24H&sort=stars&order=desc&per_page=10" | jq '.items // empty')

if [ -z "$DAILY_DATA" ]; then false; fi
echo "$DAILY_DATA" | jq '[.[] | {name: .full_name, stars: .stargazers_count, url: .html_url, language: .language, license: .license.spdx_id, issues: (.open_issues_count // .open_issues // 0)}]' > "$DAILY_FILE"

# --- TOP 10 REPOS (WEEKLY) ---
echo "[3/6] Fetching Top 10 Repos of the Week..."
DATE_WEEK=$(date --date='7 days ago' +%Y-%m-%d)
WEEKLY_DATA=$(curl -s -H "$GITHUB_TOKEN" "https://api.github.com/search/repositories?q=created:>$DATE_WEEK&sort=stars&order=desc&per_page=10" | jq '.items // empty')

if [ -z "$WEEKLY_DATA" ]; then false; fi
echo "$WEEKLY_DATA" | jq '[.[] | {name: .full_name, stars: .stargazers_count, url: .html_url, language: .language, license: .license.spdx_id, issues: (.open_issues_count // .open_issues // 0)}]' > "$WEEKLY_FILE"

# --- TOP 10 REPOS (MONTHLY) ---
echo "[4/6] Fetching Top 10 Repos of the Month..."
DATE_MONTH=$(date --date='30 days ago' +%Y-%m-%d)
MONTHLY_DATA=$(curl -s -H "$GITHUB_TOKEN" "https://api.github.com/search/repositories?q=created:>$DATE_MONTH&sort=stars&order=desc&per_page=10" | jq '.items // empty')

if [ -z "$MONTHLY_DATA" ]; then false; fi
echo "$MONTHLY_DATA" | jq '[.[] | {name: .full_name, stars: .stargazers_count, url: .html_url, language: .language, license: .license.spdx_id, issues: (.open_issues_count // .open_issues // 0)}]' > "$MONTHLY_FILE"

# --- TOP 10 REPOS (3 MONTHS) ---
echo "[5/6] Fetching Top 10 Repos of the last 3 Months..."
DATE_3MONTHS=$(date --date='90 days ago' +%Y-%m-%d)
THREE_MONTHS_DATA=$(curl -s -H "$GITHUB_TOKEN" "https://api.github.com/search/repositories?q=created:>$DATE_3MONTHS&sort=stars&order=desc&per_page=10" | jq '.items // empty')

if [ -z "$THREE_MONTHS_DATA" ]; then false; fi
echo "$THREE_MONTHS_DATA" | jq '[.[] | {name: .full_name, stars: .stargazers_count, url: .html_url, language: .language, license: .license.spdx_id, issues: (.open_issues_count // .open_issues // 0)}]' > "$THREE_MONTHS_FILE"

# --- PART 4: SERVICE STATUS ---
echo "[6/6] Checking Service Status..."
GH_HTTP=$(curl -o /dev/null -s -w "%{http_code}" -H "$GITHUB_TOKEN" "https://api.github.com/zen")
GH_STATUS=$([ "$GH_HTTP" -eq 200 ] && echo "online" || echo "offline")

# If the script successfully reaches this point, everything is fine
MY_STATUS="online"

jq -n --arg gh "$GH_STATUS" --arg my "$MY_STATUS" --arg ts "$(date '+%H:%M')" \
'{github_api: $gh, git_service: $my, last_check: $ts}' > "$STATUS_FILE"

# --- FINISH ---
chmod 664 "$SOFTWARE_FILE" "$MONTHLY_FILE" "$DAILY_FILE" "$STATUS_FILE"

# Clean up old error log if the script runs completely successful
rm -f "$ERROR_LOG"
echo "Success! Software with descriptions and minimal Repo data updated."