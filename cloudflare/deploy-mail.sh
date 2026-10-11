#!/usr/bin/env bash
# Deploy Cloudflare Email Routing + Email Worker for your-domain.com
# Usage: CF_TOKEN=<api token> ./deploy-mail.sh
# Token needs: Zone.DNS Edit, Zone.Email Routing Addresses/Rules Edit,
#              Workers Scripts Edit, Account Settings Read
set -euo pipefail

ZONE="your-domain.com"
WORKER="your-domain-email"
DIR="$(cd "$(dirname "$0")" && pwd)"
CF_TOKEN="${CF_TOKEN:-}"
if [ -z "$CF_TOKEN" ] && [ -f /root/.cf_token ]; then
  CF_TOKEN="$(cat /root/.cf_token)"
fi
if [ -z "$CF_TOKEN" ]; then
  echo "ERROR: set CF_TOKEN env var (or put token in /root/.cf_token)" >&2
  exit 1
fi

api() { # api <method> <path> [body]
  local m="$1" p="$2" b="${3:-}"
  if [ -n "$b" ]; then
    curl -4 -s -X "$m" "https://api.cloudflare.com/client/v4$p" \
      -H "Authorization: Bearer $CF_TOKEN" -H "Content-Type: application/json" -d "$b"
  else
    curl -4 -s -X "$m" "https://api.cloudflare.com/client/v4$p" \
      -H "Authorization: Bearer $CF_TOKEN" -H "Content-Type: application/json"
  fi
}

check() { python3 -c "
import sys, json
d = json.load(sys.stdin)
if d.get('success'):
    print('  OK')
else:
    print('  FAIL:', d.get('errors'))
    sys.exit(1)
"; }

echo "== resolving zone/account =="
ZONE_DATA=$(api GET "/zones?name=$ZONE")
ZONE_ID=$(echo "$ZONE_DATA" | python3 -c "import sys,json;print(json.load(sys.stdin)['result'][0]['id'])")
ACCT_ID=$(echo "$ZONE_DATA" | python3 -c "import sys,json;print(json.load(sys.stdin)['result'][0]['account']['id'])")
echo "  zone=$ZONE_ID account=$ACCT_ID"

echo "== uploading worker script =="
curl -4 -s -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCT_ID/workers/scripts/$WORKER" \
  -H "Authorization: Bearer $CF_TOKEN" \
  -F 'metadata={"main_module":"email-worker.js","compatibility_date":"2024-01-01"};type=application/json' \
  -F 'email-worker.js=@'$DIR'/email-worker.js;type=application/javascript+module' | check

echo "== setting AUTH_KEY secret =="
AUTH_KEY=$(python3 -c "import json;print(json.load(open('$DIR/../config.json'))['authkey'])")
api PUT "/accounts/$ACCT_ID/workers/scripts/$WORKER/secrets" \
  "{\"name\":\"AUTH_KEY\",\"text\":\"$AUTH_KEY\",\"type\":\"secret_text\"}" | check

ROUTING_DONE=0
echo "== enabling email routing =="
if api POST "/zones/$ZONE_ID/email/routing/enable" | check; then ROUTING_DONE=1; else echo "  ! token lacks Email Routing permission - will need manual dashboard step"; fi

echo "== adding MX records =="
add_mx() { # add_mx <priority> <target>
  api POST "/zones/$ZONE_ID/dns_records" \
    "{\"type\":\"MX\",\"name\":\"$ZONE\",\"content\":\"$2\",\"priority\":$1,\"ttl\":1}" | check
}
add_mx 10 route1.mx.cloudflare.net
add_mx 20 route2.mx.cloudflare.net
add_mx 30 route3.mx.cloudflare.net

echo "== adding SPF record =="
api POST "/zones/$ZONE_ID/dns_records" \
  "{\"type\":\"TXT\",\"name\":\"$ZONE\",\"content\":\"v=spf1 include:_spf.mx.cloudflare.net ~all\",\"ttl\":1}" | check

echo "== adding DMARC record =="
api POST "/zones/$ZONE_ID/dns_records" \
  "{\"type\":\"TXT\",\"name\":\"_dmarc.$ZONE\",\"content\":\"v=DMARC1; p=none\",\"ttl\":1}" | check

echo "== wiring catch-all rule to worker =="
if [ "$ROUTING_DONE" != "1" ]; then echo "  ! token lacks Email Routing permission - will need manual dashboard step"; fi
echo "  updating catch-all rule to send to $WORKER"
api PUT "/zones/$ZONE_ID/email/routing/rules/catch_all" \
  "{\"matchers\":[{\"type\":\"all\"}],\"actions\":[{\"type\":\"worker\",\"value\":[\"$WORKER\"]}],\"enabled\":true,\"name\":\"catch-all to $WORKER\"}" | check

echo "== done =="
if [ "$ROUTING_DONE" = "1" ]; then
  echo "Email routing fully configured via API."
else
  echo "== MANUAL STEP REQUIRED (2 minutes, dashboard) =="
  echo "1) dash.cloudflare.com -> $ZONE -> Email -> Email Routing"
  echo "2) If not already on, click Enable Email Routing"
  echo "3) Routing rules -> click the catch-all rule -> Edit"
  echo "4) Action: Send to a Worker -> select '$WORKER' -> Save"
fi
echo "DNS propagation can take a few minutes. Verify with:"
echo "  dig +short MX $ZONE"
echo "  dig +short TXT $ZONE"





