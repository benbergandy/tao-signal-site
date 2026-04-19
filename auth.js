/**
 * auth.js — Global auth for TAO Signals
 * Include on every page after the Supabase CDN script.
 * Manages session state and renders the Account dropdown in the topbar.
 */

const SUPABASE_URL = 'https://ofbdkvoyodxyqzxqcerr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mYmRrdm95b2R4eXF6eHFjZXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1NDU2NjIsImV4cCI6MjA5MjEyMTY2Mn0.mXy237k1du2tZVb2zE4KIQhtyCtHNl9oDLsYhXqQYVk';

var _supabase;
try {
  _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch(e) {
  console.error('Supabase init failed:', e);
}

/**
 * Render the account dropdown into a container element.
 * Call this after DOM is ready, passing the ID of the topbar-right element.
 */
function initAuthDropdown(containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;

  // Inject dropdown HTML
  container.innerHTML = '' +
    '<div style="position:relative">' +
      '<button id="globalAccountBtn" style="font-family:\'IBM Plex Mono\',monospace;font-size:10px;letter-spacing:0.08em;background:transparent;border:1px solid #243040;color:#445566;padding:5px 12px;cursor:pointer;text-transform:uppercase;display:flex;align-items:center;gap:6px;transition:all 0.15s" onclick="toggleGlobalAccount()">' +
        '<span id="globalAccountLabel">Account</span> <span id="globalChevron" style="font-size:8px;transition:transform 0.15s">&#9662;</span>' +
      '</button>' +
      '<div id="globalAccountDropdown" style="display:none;position:absolute;top:calc(100% + 4px);right:0;background:#0f1419;border:1px solid #243040;min-width:180px;z-index:9999">' +
        '<div id="globalDropdownContent"></div>' +
      '</div>' +
    '</div>';

  // Check session
  checkAuthState();

  // Listen for auth changes
  if (_supabase) {
    _supabase.auth.onAuthStateChange(function(event, session) {
      checkAuthState();
    });
  }
}

function toggleGlobalAccount() {
  var dropdown = document.getElementById('globalAccountDropdown');
  var btn = document.getElementById('globalAccountBtn');
  var chevron = document.getElementById('globalChevron');
  if (!dropdown) return;
  var isOpen = dropdown.style.display !== 'none';
  dropdown.style.display = isOpen ? 'none' : 'block';
  chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
  if (!e.target.closest('#globalAccountBtn') && !e.target.closest('#globalAccountDropdown')) {
    var dd = document.getElementById('globalAccountDropdown');
    var chev = document.getElementById('globalChevron');
    if (dd) dd.style.display = 'none';
    if (chev) chev.style.transform = '';
  }
});

async function checkAuthState() {
  if (!_supabase) {
    renderLoggedOut();
    return;
  }
  try {
    var result = await _supabase.auth.getSession();
    var session = result.data.session;
    if (session && session.user) {
      renderLoggedIn(session.user);
    } else {
      renderLoggedOut();
    }
  } catch(e) {
    renderLoggedOut();
  }
}

function renderLoggedIn(user) {
  var label = document.getElementById('globalAccountLabel');
  var content = document.getElementById('globalDropdownContent');
  if (!label || !content) return;

  var email = user.email || 'User';
  var short = email.length > 20 ? email.substring(0, 18) + '...' : email;
  label.textContent = short;
  label.style.color = '#00d4ff';
  document.getElementById('globalAccountBtn').style.borderColor = '#00d4ff';

  var itemStyle = 'font-family:\'IBM Plex Mono\',monospace;font-size:10px;letter-spacing:0.06em;text-transform:uppercase;color:#445566;padding:10px 14px;cursor:pointer;display:block;border-bottom:1px solid #1a2230;transition:all 0.15s;text-decoration:none;width:100%;text-align:left;background:none;border-left:none;border-right:none;border-top:none;';

  content.innerHTML = '' +
    '<a href="portfolio.html" style="' + itemStyle + '" onmouseover="this.style.color=\'#c8d8e8\';this.style.background=\'#0a0e12\'" onmouseout="this.style.color=\'#445566\';this.style.background=\'none\'">Portfolio</a>' +
    '<a href="portfolio.html" style="' + itemStyle + '" onmouseover="this.style.color=\'#c8d8e8\';this.style.background=\'#0a0e12\'" onmouseout="this.style.color=\'#445566\';this.style.background=\'none\'">Settings</a>' +
    '<button onclick="globalSignOut()" style="' + itemStyle + 'border-bottom:none;color:#ff3355;cursor:pointer" onmouseover="this.style.background=\'#0a0e12\'" onmouseout="this.style.background=\'none\'">Sign Out</button>';
}

function renderLoggedOut() {
  var label = document.getElementById('globalAccountLabel');
  var content = document.getElementById('globalDropdownContent');
  if (!label || !content) return;

  label.textContent = 'Account';
  label.style.color = '#445566';
  document.getElementById('globalAccountBtn').style.borderColor = '#243040';

  var itemStyle = 'font-family:\'IBM Plex Mono\',monospace;font-size:10px;letter-spacing:0.06em;text-transform:uppercase;color:#445566;padding:10px 14px;cursor:pointer;display:block;border-bottom:1px solid #1a2230;transition:all 0.15s;text-decoration:none;width:100%;text-align:left;background:none;border-left:none;border-right:none;border-top:none;';

  content.innerHTML = '' +
    '<a href="portfolio.html" style="' + itemStyle + '" onmouseover="this.style.color=\'#00d4ff\';this.style.background=\'#0a0e12\'" onmouseout="this.style.color=\'#445566\';this.style.background=\'none\'">Sign In</a>' +
    '<a href="portfolio.html" style="' + itemStyle + 'border-bottom:none" onmouseover="this.style.color=\'#00d4ff\';this.style.background=\'#0a0e12\'" onmouseout="this.style.color=\'#445566\';this.style.background=\'none\'">Create Account</a>';
}

async function globalSignOut() {
  if (_supabase) {
    await _supabase.auth.signOut();
  }
  // If on portfolio page, refresh to show login
  if (window.location.pathname.includes('portfolio')) {
    window.location.reload();
  }
  checkAuthState();
}
