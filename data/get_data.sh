#!/usr/bin/env bash
# Author: Knuspii
# Unified Data Fetcher for git-top.net

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOFTWARE_FILE="$SCRIPT_DIR/software.json"
MONTHLY_FILE="$SCRIPT_DIR/monthly_repos.json"
DAILY_FILE="$SCRIPT_DIR/daily_repos.json"
STATUS_FILE="$SCRIPT_DIR/status.json"

# Token
source ${SCRIPT_DIR}/../../api_github.txt

# --- FUNCTIONS ---
get_gh_version() {
    curl -s -H "$GITHUB_TOKEN" "https://api.github.com/repos/$1/releases/latest" | jq -r '.tag_name // "unknown"'
}

make_entry() {
    jq -nc --arg name "$1" --arg ver "$2" --arg desc "$3" --arg url "$4" \
    '{name: $name, version: $ver, description: $desc, url: $url}'
}

# --- PART 1: SOFTWARE RELEASES ---
echo "[1/4] Fetching Software Releases..."

DEBIAN_VER=$(curl -s "https://www.debian.org/releases/stable/" | grep -oP 'Debian \K[0-9]+\.[0-9]+' | head -n1)
UBUNTU_VER=$(curl -s "https://launchpad.net/ubuntu/+series" | grep -B3 "Current Stable Release" | grep -m1 -oP '>[^<]+' | tr -d '>' | grep -oE '[0-9]+\.[0-9]+' | head -n1)
NIXOS_VER=$(curl -s "https://nixos.org/download/" | tr -d '\n' | grep -oP 'Current version</span>.*?([0-9]{2}\.[0-9]{1,2})' | grep -oP '[0-9]{2}\.[0-9]{1,2}' | sed -n '2p')

DEBIAN=$(make_entry "Debian" "$DEBIAN_VER" "Universal GNU/Linux distribution" "https://www.debian.org/")
UBUNTU=$(make_entry "Ubuntu" "$UBUNTU_VER" "Popular desktop & server distribution" "https://ubuntu.com/")
NIXOS=$(make_entry "NixOS" "$NIXOS_VER" "Linux distribution focused on declarative configuration and reproducibility." "https://nixos.org/")
PODMAN=$(make_entry "Podman" "$(get_gh_version "containers/podman")" "Tool for managing OCI containers" "https://github.com/containers/podman")
FASTFETCH=$(make_entry "Fastfetch" "$(get_gh_version "fastfetch-cli/fastfetch")" "Fast, aesthetic system info tool" "https://github.com/fastfetch-cli/fastfetch")
ADGUARD=$(make_entry "AdGuard Home" "$(get_gh_version "AdguardTeam/AdGuardHome")" "Network-wide ad blocker" "https://github.com/AdguardTeam/AdGuardHome")
BOTTOM=$(make_entry "Bottom" "$(get_gh_version "ClementTsang/bottom")" "Terminal-based system monitor" "https://github.com/ClementTsang/bottom")
CRUNCHY=$(make_entry "Crunchy Cleaner" "$(get_gh_version "Knuspii/CrunchyCleaner")" "System cleanup tool" "https://github.com/Knuspii/CrunchyCleaner")

jq -n --argjson deb "$DEBIAN" \
    --argjson ubu "$UBUNTU" \
    --argjson nix "$NIXOS" \
    --argjson pod "$PODMAN" \
    --argjson fas "$FASTFETCH" \
    --argjson adg "$ADGUARD" \
    --argjson bot "$BOTTOM" \
    --argjson cru "$CRUNCHY" \
    '[ $deb, $ubu, $nix, $pod, $fas, $adg, $bot, $cru ]' > "$SOFTWARE_FILE"

# --- PART 2: TOP 10 REPOS (MONTHLY) ---
echo "[2/4] Fetching Top 10 Repos of the Month..."
DATE_MONTH=$(date --date='30 days ago' +%Y-%m-%d 2>/dev/null || date -v-30d +%Y-%m-%d)
curl -s -H "$GITHUB_TOKEN" "https://api.github.com/search/repositories?q=created:>$DATE_MONTH&sort=stars&order=desc&per_page=10" | \
jq '[.items[] | {name: .full_name, stars: .stargazers_count, url: .html_url, language: (.language // "N/A")}]' > "$MONTHLY_FILE"

# --- PART 3: BEST REPOS (LAST 24 HOURS) ---
echo "[3/4] Fetching Best Repos of the last 24h..."
DATE_24H=$(date -u -d '24 hours ago' '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null || date -u -v-24H '+%Y-%m-%dT%H:%M:%SZ')
curl -s -H "$GITHUB_TOKEN" "https://api.github.com/search/repositories?q=created:>$DATE_24H&sort=stars&order=desc&per_page=10" | \
jq '[.items[] | {name: .full_name, stars: .stargazers_count, url: .html_url, language: (.language // "N/A")}]' > "$DAILY_FILE"

# --- PART 4: SERVICE STATUS ---
echo "[4/4] Checking Service Status..."
GH_HTTP=$(curl -o /dev/null -s -w "%{http_code}" -H "$GITHUB_TOKEN" "https://api.github.com/zen")
GH_STATUS=$([ "$GH_HTTP" -eq 200 ] && echo "online" || echo "offline")
MY_STATUS=$(curl -sf "https://data.knuspii.net/gt_services_status.txt" | grep -qi healthy && echo online || echo error)

jq -n --arg gh "$GH_STATUS" --arg my "$MY_STATUS" --arg ts "$(date '+%H:%M')" \
'{github_api: $gh, git_service: $my, last_check: $ts}' > "$STATUS_FILE"

# --- FINISH ---
chmod 664 "$SOFTWARE_FILE" "$MONTHLY_FILE" "$DAILY_FILE" "$STATUS_FILE"
echo "Success! Software with descriptions and minimal Repo data updated."
