#!/bin/bash
set -e
PIPELINE=/root/tao-signal-pipeline
SITE=/root/tao-signal-site
TODAY=$(date -u +%Y-%m-%d)
echo "=== update_site.sh === ${TODAY}"

# Core data
cp ${PIPELINE}/data/chain_data.json ${SITE}/data/
cp ${PIPELINE}/data/combined_scores.json ${SITE}/data/
cp ${PIPELINE}/data/subnets.json ${SITE}/data/
cp ${PIPELINE}/data/risk_metrics.json ${SITE}/data/
cp ${PIPELINE}/data/regime_state.json ${SITE}/data/

# Paper trading - all profiles
cp ${PIPELINE}/data/paper_portfolio.json ${SITE}/data/
cp ${PIPELINE}/data/paper_daily_log.json ${SITE}/data/
cp ${PIPELINE}/data/paper_trades.json ${SITE}/data/
for suffix in conservative aggressive balanced_sharpe balanced_calmar balanced_alpha fulldeploy; do
  [ -f ${PIPELINE}/data/paper_portfolio_${suffix}.json ] && cp ${PIPELINE}/data/paper_portfolio_${suffix}.json ${SITE}/data/
  [ -f ${PIPELINE}/data/paper_daily_log_${suffix}.json ] && cp ${PIPELINE}/data/paper_daily_log_${suffix}.json ${SITE}/data/
  [ -f ${PIPELINE}/data/paper_trades_${suffix}.json ] && cp ${PIPELINE}/data/paper_trades_${suffix}.json ${SITE}/data/
done

# Wallet monitor
[ -f ${PIPELINE}/data/wallet_monitor.json ] && cp ${PIPELINE}/data/wallet_monitor.json ${SITE}/data/

# Chain history snapshot
CHAIN_FILE=${PIPELINE}/data/chain_history/${TODAY}.json
[ -f "$CHAIN_FILE" ] && cp "$CHAIN_FILE" ${SITE}/data/chain_history/

# Push to GitHub (triggers Cloudflare Pages auto-deploy)
cd ${SITE}
git add .
git commit -m "daily update ${TODAY}" --allow-empty
git push

echo "Site updated and deployed"
