#!/bin/bash
cd /Users/benbergandy/Documents/tao-signal-site

cp /Users/benbergandy/Documents/tao-dashboard/data/chain_data.json data/
cp /Users/benbergandy/Documents/tao-dashboard/data/combined_scores.json data/
cp /Users/benbergandy/Documents/tao-dashboard/data/quality_scores.json data/
cp /Users/benbergandy/Documents/tao-dashboard/data/performance_log.json data/
cp /Users/benbergandy/Documents/tao-dashboard/data/subnets.json data/

TODAY=$(date +%Y-%m-%d)
cp /Users/benbergandy/Documents/tao-dashboard/data/chain_history/${TODAY}.json data/chain_history/

git add .
git commit -m "daily update ${TODAY}" --allow-empty
git push
cp /Users/benbergandy/Documents/tao-dashboard/data/momentum_scores.json data/
