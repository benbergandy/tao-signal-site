/**
 * trade-modal.js — Universal stake/unstake modal for TAO Signals
 *
 * Usage:
 *   openTradeModal({ mode: 'stake', netuid: 64 })        — stake to specific subnet
 *   openTradeModal({ mode: 'unstake', netuid: 64 })      — unstake from specific subnet
 *   openTradeModal({ mode: 'stake' })                     — stake, let user pick subnet
 *   openTradeModal({ mode: 'unstake' })                   — unstake, show current positions
 *
 * Requires: API server running at api.taosignals.io:8443
 * Requires: auth.js loaded (for _supabase session)
 */

var _tradeModal = null;
var _tradeData = {
  mode: 'stake',
  netuid: null,
  amount: 0,
  walletAddress: null,
  freeBalance: 0,
  positions: [],
  subnets: [],
  selectedSubnet: null,
};

var TRADE_API = 'https://api.taosignals.io:8443';

function createTradeModal() {
  if (document.getElementById('tradeModalOverlay')) return;

  var overlay = document.createElement('div');
  overlay.id = 'tradeModalOverlay';
  overlay.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:10000;display:none;align-items:center;justify-content:center';
  overlay.onclick = function(e) { if (e.target === overlay) closeTradeModal(); };

  var modal = document.createElement('div');
  modal.id = 'tradeModal';
  modal.style.cssText = 'background:#0a0e12;border:1px solid #243040;width:480px;max-width:90vw;max-height:90vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.5)';

  modal.innerHTML = '' +
    '<div id="tradeModalContent"></div>';

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

function openTradeModal(opts) {
  createTradeModal();

  _tradeData.mode = opts.mode || 'stake';
  _tradeData.netuid = opts.netuid || null;
  _tradeData.amount = 0;
  _tradeData.selectedSubnet = null;

  document.getElementById('tradeModalOverlay').style.display = 'flex';

  // Get wallet address from Supabase profile
  loadTradeWalletData(opts);
}

function closeTradeModal() {
  var overlay = document.getElementById('tradeModalOverlay');
  if (overlay) overlay.style.display = 'none';
}

async function loadTradeWalletData(opts) {
  var content = document.getElementById('tradeModalContent');
  content.innerHTML = '<div style="padding:40px;text-align:center;font-family:\'IBM Plex Mono\',monospace;font-size:11px;color:#445566">Loading wallet data...</div>';

  // Get wallet from Supabase profile
  try {
    if (_supabase) {
      var result = await _supabase.auth.getSession();
      if (result.data.session) {
        var profile = await _supabase.from('user_profiles').select('wallet_address').eq('id', result.data.session.user.id).single();
        if (profile.data && profile.data.wallet_address) {
          _tradeData.walletAddress = profile.data.wallet_address;
        }
      }
    }
  } catch(e) {}

  if (!_tradeData.walletAddress) {
    content.innerHTML = '' +
      '<div style="padding:24px">' +
      '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#445566;margin-bottom:16px">Connect Wallet</div>' +
      '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:11px;color:#445566;margin-bottom:16px">Connect your wallet on the Portfolio page to trade.</div>' +
      '<a href="portfolio.html" style="font-family:\'IBM Plex Mono\',monospace;font-size:11px;color:#00d4ff;text-decoration:none">Go to Portfolio →</a>' +
      '</div>';
    return;
  }

  // Load positions from cached API
  try {
    var res = await fetch(TRADE_API + '/api/portfolio?address=' + encodeURIComponent(_tradeData.walletAddress));
    var data = await res.json();
    _tradeData.freeBalance = data.free_balance_tao || 0;
    _tradeData.positions = data.positions || [];
    _tradeData.taoUsd = data.tao_usd || 0;
  } catch(e) {
    _tradeData.freeBalance = 0;
    _tradeData.positions = [];
  }

  // Load subnet list for stake mode
  try {
    var scoresRes = await fetch('data/combined_scores.json?t=' + Date.now());
    var scores = await scoresRes.json();
    _tradeData.subnets = (scores.scores || []).sort(function(a,b) { return b.combined_score - a.combined_score; });
  } catch(e) {
    _tradeData.subnets = [];
  }

  // If netuid specified, pre-select it
  if (opts.netuid) {
    _tradeData.selectedSubnet = _tradeData.subnets.find(function(s) { return s.netuid === opts.netuid; }) ||
                                 { netuid: opts.netuid, name: 'SN' + opts.netuid };
    renderTradeForm();
  } else if (_tradeData.mode === 'unstake') {
    renderSubnetPicker('unstake');
  } else {
    renderSubnetPicker('stake');
  }
}

function renderSubnetPicker(mode) {
  var content = document.getElementById('tradeModalContent');
  var isUnstake = mode === 'unstake';
  var list = isUnstake ? _tradeData.positions : _tradeData.subnets;
  var title = isUnstake ? 'Select Position to Unstake' : 'Select Subnet to Stake';

  var html = '<div style="padding:20px">';
  // Header
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">';
  html += '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#c8d8e8">' + title + '</div>';
  html += '<div onclick="closeTradeModal()" style="cursor:pointer;font-family:\'IBM Plex Mono\',monospace;font-size:14px;color:#445566;padding:4px 8px">✕</div>';
  html += '</div>';

  // Mode toggle
  html += '<div style="display:flex;gap:0;margin-bottom:16px">';
  html += '<button onclick="renderSubnetPicker(\'stake\')" style="flex:1;font-family:\'IBM Plex Mono\',monospace;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;padding:8px;cursor:pointer;background:' + (!isUnstake ? 'rgba(0,255,136,0.08)' : 'transparent') + ';border:1px solid ' + (!isUnstake ? '#00ff88' : '#243040') + ';border-right:none;color:' + (!isUnstake ? '#00ff88' : '#445566') + '">Stake</button>';
  html += '<button onclick="renderSubnetPicker(\'unstake\')" style="flex:1;font-family:\'IBM Plex Mono\',monospace;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;padding:8px;cursor:pointer;background:' + (isUnstake ? 'rgba(255,51,85,0.08)' : 'transparent') + ';border:1px solid ' + (isUnstake ? '#ff3355' : '#243040') + ';color:' + (isUnstake ? '#ff3355' : '#445566') + '">Unstake</button>';
  html += '</div>';

  // Search (stake only)
  if (!isUnstake) {
    html += '<input type="text" id="subnetSearch" placeholder="Search subnets..." oninput="filterSubnets()" style="font-family:\'IBM Plex Mono\',monospace;font-size:12px;background:#0f1419;border:1px solid #243040;color:#c8d8e8;padding:10px 14px;width:100%;margin-bottom:12px;outline:none">';
  }

  // List
  html += '<div id="subnetList" style="max-height:400px;overflow-y:auto">';
  list.forEach(function(s) {
    var netuid = s.netuid;
    var name = s.name || 'SN' + netuid;
    var score = s.combined_score ? s.combined_score.toFixed(1) : '';
    var detail = isUnstake ? (s.tao_value ? s.tao_value.toFixed(4) + ' TAO' : '') : ('Score: ' + score);

    html += '<div onclick="_tradeData.mode=\'' + mode + '\';_tradeData.selectedSubnet=' + JSON.stringify({netuid:netuid,name:name}).replace(/"/g, '&quot;') + ';renderTradeForm()" ';
    html += 'style="padding:12px;border-bottom:1px solid rgba(26,34,48,0.5);cursor:pointer;display:flex;justify-content:space-between;align-items:center;transition:background 0.1s" ';
    html += 'onmouseover="this.style.background=\'rgba(0,212,255,0.03)\'" onmouseout="this.style.background=\'none\'">';
    html += '<div><span style="font-family:\'IBM Plex Mono\',monospace;font-size:10px;color:#445566">SN' + netuid + '</span> <span style="font-weight:600;font-size:13px">' + name + '</span></div>';
    html += '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:11px;color:#445566">' + detail + '</div>';
    html += '</div>';
  });
  html += '</div>';
  html += '</div>';

  content.innerHTML = html;
}

function filterSubnets() {
  var query = (document.getElementById('subnetSearch')?.value || '').toLowerCase();
  var items = document.querySelectorAll('#subnetList > div');
  items.forEach(function(item) {
    var text = item.textContent.toLowerCase();
    item.style.display = text.includes(query) ? '' : 'none';
  });
}

function renderTradeForm() {
  var content = document.getElementById('tradeModalContent');
  var s = _tradeData.selectedSubnet;
  var isUnstake = _tradeData.mode === 'unstake';
  var color = isUnstake ? '#ff3355' : '#00ff88';
  var actionLabel = isUnstake ? 'UNSTAKE' : 'STAKE';

  // For unstake, find the position to get current value
  var position = _tradeData.positions.find(function(p) { return p.netuid === s.netuid; });
  var maxAmount = isUnstake ? (position ? position.tao_value : 0) : _tradeData.freeBalance;

  var html = '<div style="padding:20px">';

  // Header
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">';
  html += '<div>';
  html += '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:9px;color:#445566;text-transform:uppercase;letter-spacing:0.1em">' + actionLabel + '</div>';
  html += '<div style="font-size:18px;font-weight:700;color:#c8d8e8">SN' + s.netuid + ' ' + s.name + '</div>';
  html += '</div>';
  html += '<div onclick="closeTradeModal()" style="cursor:pointer;font-family:\'IBM Plex Mono\',monospace;font-size:14px;color:#445566;padding:4px 8px">✕</div>';
  html += '</div>';

  // Back button
  html += '<div onclick="renderSubnetPicker(\'' + _tradeData.mode + '\')" style="font-family:\'IBM Plex Mono\',monospace;font-size:10px;color:#00d4ff;cursor:pointer;margin-bottom:16px">← Change subnet</div>';

  // Available balance
  html += '<div style="background:#0f1419;border:1px solid #1a2230;padding:12px;margin-bottom:16px">';
  html += '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:9px;color:#445566;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px">' + (isUnstake ? 'Current Position' : 'Available Balance') + '</div>';
  html += '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:20px;font-weight:600;color:' + color + '">' + maxAmount.toFixed(4) + ' TAO</div>';
  if (_tradeData.taoUsd) html += '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:11px;color:#445566">$' + (maxAmount * _tradeData.taoUsd).toFixed(2) + ' USD</div>';
  html += '</div>';

  // Amount input
  html += '<div style="margin-bottom:12px">';
  html += '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:9px;color:#445566;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px">Amount (TAO)</div>';
  html += '<input type="number" id="tradeAmount" value="" placeholder="0.00" min="0.001" step="0.001" max="' + maxAmount + '" oninput="updateTradePreview()" style="font-family:\'IBM Plex Mono\',monospace;font-size:16px;background:#0f1419;border:1px solid #243040;color:#c8d8e8;padding:12px 14px;width:100%;outline:none">';
  html += '</div>';

  // Quick select buttons
  html += '<div style="display:flex;gap:6px;margin-bottom:16px">';
  [25, 50, 75, 100].forEach(function(pct) {
    var val = (maxAmount * pct / 100).toFixed(4);
    html += '<button onclick="document.getElementById(\'tradeAmount\').value=\'' + val + '\';updateTradePreview()" style="flex:1;font-family:\'IBM Plex Mono\',monospace;font-size:10px;padding:6px;background:transparent;border:1px solid #243040;color:#445566;cursor:pointer;transition:all 0.15s" onmouseover="this.style.borderColor=\'' + color + '\';this.style.color=\'' + color + '\'" onmouseout="this.style.borderColor=\'#243040\';this.style.color=\'#445566\'">' + pct + '%</button>';
  });
  html += '</div>';

  // Trade preview (computed dynamically)
  html += '<div id="tradePreview" style="background:#0f1419;border:1px solid #1a2230;padding:14px;margin-bottom:16px">';
  html += '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:11px;color:#445566;text-align:center">Enter an amount to preview</div>';
  html += '</div>';

  // Execute button
  html += '<button id="tradeExecuteBtn" onclick="executeTradePreview()" style="width:100%;font-family:\'IBM Plex Mono\',monospace;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;padding:14px;cursor:pointer;background:' + color + ';color:#050709;font-weight:600;border:none;transition:opacity 0.15s" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1">' + actionLabel + '</button>';

  html += '</div>';
  content.innerHTML = html;
}

function updateTradePreview() {
  var preview = document.getElementById('tradePreview');
  var amount = parseFloat(document.getElementById('tradeAmount')?.value || 0);
  var s = _tradeData.selectedSubnet;
  var isUnstake = _tradeData.mode === 'unstake';

  if (!amount || amount <= 0 || !s) {
    preview.innerHTML = '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:11px;color:#445566;text-align:center">Enter an amount to preview</div>';
    return;
  }

  // Find subnet pool data from scores
  var subnetData = _tradeData.subnets.find(function(sub) { return sub.netuid === s.netuid; }) || {};
  var pool = subnetData.tao_in || 0;
  var SWAP_FEE = 0.0005;

  // Compute slippage
  var slippage = pool > 0 ? amount / (pool + amount) : 0;
  var fee = amount * SWAP_FEE;
  var effectiveAmount = amount * (1 - slippage) - fee;
  var roundTripCost = pool > 0 ? (slippage * 2 + SWAP_FEE * 2) : 0;

  // Daily yield estimate
  var emPct = subnetData.emission_share_pct || 0;
  var networkEmPerDay = 3600 * 0.5; // ~1800 TAO/day after halving
  var yourShare = pool > 0 ? amount / (pool + amount) : 0;
  var dailyYield = yourShare * (emPct / 100) * networkEmPerDay * 0.132;
  var dailyYieldPct = amount > 0 ? (dailyYield / amount * 100) : 0;
  var breakEvenDays = roundTripCost > 0 && dailyYieldPct > 0 ? (roundTripCost * 100 / dailyYieldPct) : null;

  var html = '';
  html += '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:9px;color:#445566;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px">Trade Preview</div>';

  var rows = [
    ['Amount', amount.toFixed(4) + ' TAO', ''],
    ['Entry Slippage', (slippage * 100).toFixed(3) + '%', slippage < 0.01 ? '#00ff88' : slippage < 0.03 ? '#ffd000' : '#ff3355'],
    ['Swap Fee', (SWAP_FEE * 100).toFixed(2) + '%', ''],
    ['Effective Amount', effectiveAmount.toFixed(4) + ' TAO', ''],
    ['Round-Trip Cost', (roundTripCost * 100).toFixed(3) + '%', ''],
    ['Pool Depth', pool > 0 ? pool.toLocaleString(undefined, {maximumFractionDigits:0}) + ' TAO' : 'Unknown', ''],
  ];

  if (!isUnstake && emPct > 0) {
    rows.push(['Est. Daily Yield', dailyYield.toFixed(4) + ' TAO (' + dailyYieldPct.toFixed(3) + '%)', '#00ff88']);
    rows.push(['Break-Even', breakEvenDays ? Math.ceil(breakEvenDays) + ' days' : 'N/A', '']);
  }

  if (isUnstake) {
    var position = _tradeData.positions.find(function(p) { return p.netuid === s.netuid; });
    if (position && position.cost_basis > 0) {
      var pnl = (amount / position.tao_value) * position.pnl_tao;
      var pnlPct = position.pnl_pct;
      var pnlColor = pnl >= 0 ? '#00ff88' : '#ff3355';
      rows.push(['Est. P&L on Trade', (pnl >= 0 ? '+' : '') + pnl.toFixed(4) + ' TAO (' + (pnl >= 0 ? '+' : '') + pnlPct.toFixed(1) + '%)', pnlColor]);
    }
  }

  rows.forEach(function(r) {
    html += '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(26,34,48,0.3)">';
    html += '<span style="font-family:\'IBM Plex Mono\',monospace;font-size:11px;color:#445566">' + r[0] + '</span>';
    html += '<span style="font-family:\'IBM Plex Mono\',monospace;font-size:11px;color:' + (r[2] || '#c8d8e8') + '">' + r[1] + '</span>';
    html += '</div>';
  });

  preview.innerHTML = html;
}

function executeTradePreview() {
  var amount = parseFloat(document.getElementById('tradeAmount')?.value || 0);
  var s = _tradeData.selectedSubnet;
  var isUnstake = _tradeData.mode === 'unstake';

  if (!amount || amount <= 0 || !s) return;

  var action = isUnstake ? 'unstake' : 'stake add';
  var preview = document.getElementById('tradePreview');

  var html = preview.innerHTML;
  html += '<div style="margin-top:12px;padding-top:12px;border-top:1px solid #243040">';
  html += '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:9px;color:#ffd000;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px">Execute via CLI</div>';
  html += '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:10px;color:#c8d8e8;background:#050709;padding:10px;border:1px solid #1a2230;word-break:break-all">';
  html += 'btcli ' + action + ' --netuid ' + s.netuid + ' --amount ' + amount.toFixed(4) + ' --wallet.name default';
  html += '</div>';
  html += '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:9px;color:#445566;margin-top:8px">Copy and run in terminal. Automated execution coming soon with the TAO Signals bot.</div>';
  html += '</div>';

  preview.innerHTML = html;

  // Change button
  var btn = document.getElementById('tradeExecuteBtn');
  btn.textContent = 'COPY COMMAND';
  btn.onclick = function() {
    var cmd = 'btcli ' + action + ' --netuid ' + s.netuid + ' --amount ' + amount.toFixed(4) + ' --wallet.name default';
    navigator.clipboard.writeText(cmd).then(function() {
      btn.textContent = 'COPIED!';
      setTimeout(function() { btn.textContent = 'COPY COMMAND'; }, 2000);
    });
  };
}
