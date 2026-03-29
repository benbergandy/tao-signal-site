#!/bin/bash
set -e
PIPELINE=/root/tao-signal-pipeline
SITE=/root/tao-signal-site
TODAY=$(date -u +%Y-%m-%d)
echo "=== update_site.sh === ${TODAY}"
cp ${PIPELINE}/data/chain_data.json ${SITE}/data/
cp ${PIPELINE}/data/combined_scores.json ${SITE}/data/
cp ${PIPELINE}/data/quality_scores.json ${SITE}/data/
cp ${PIPELINE}/data/momentum_scores.json ${SITE}/data/
cp ${PIPELINE}/data/opportunity_scores.json ${SITE}/data/
cp ${PIPELINE}/data/performance_log.json ${SITE}/data/
cp ${PIPELINE}/data/subnets.json ${SITE}/data/
[ -f ${PIPELINE}/data/regime.json ] && cp ${PIPELINE}/data/regime.json ${SITE}/data/
CHAIN_FILE=${PIPELINE}/data/chain_history/${TODAY}.json
[ -f "$CHAIN_FILE" ] && cp "$CHAIN_FILE" ${SITE}/data/chain_history/
cd ${SITE}
git add .
git commit -m "daily update ${TODAY}" --allow-empty
git push
echo "done"
