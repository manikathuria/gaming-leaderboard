const baseUrl = location.origin.replace(/:\d+$/, ':3002'); // assumes API runs on :3002
let token = null;
let socket = null;

const usernameEl = document.getElementById('username');
const passwordEl = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const loginMsg = document.getElementById('loginMsg');
const actions = document.getElementById('actions');
const submitBtn = document.getElementById('submitBtn');
const submitMsg = document.getElementById('submitMsg');
const scoreEl = document.getElementById('score');
const lbTableBody = document.querySelector('#leaderboardTable tbody');
const refreshBtn = document.getElementById('refreshBtn');

function renderLeaderboard(arr) {
  lbTableBody.innerHTML = '';
  arr.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${row.rank}</td><td>${row.username ?? row.user_id}</td><td>${row.total_score}</td>`;
    lbTableBody.appendChild(tr);
  });
}

async function api(path, opts = {}) {
  const headers = opts.headers || {};
  headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(baseUrl + '/api/v1' + path, { ...opts, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error('API error: ' + res.status + ' ' + text);
  }
  return res.json();
}
loginBtn.onclick = async () => {
  loginMsg.textContent = '';
  try {
    const res = await fetch(baseUrl + '/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameEl.value, password: passwordEl.value }),
    });
    if (!res.ok) {
      const txt = await res.text();
      loginMsg.textContent = 'Login failed: ' + txt;
      loginMsg.className = 'error';
      return;
    }
    const data = await res.json();

    // ✅ unwrap "data"
    const payload = data.data;

    token = payload.access_token;
    loginMsg.textContent = 'Logged in as ' + payload.user.username;
    loginMsg.className = 'success';

    document.getElementById('auth').style.display = 'none';
    actions.style.display = 'block';

    initSocket();

    // fetch initial leaderboard via API
    const top = await api('/leaderboard/top?limit=10');
    renderLeaderboard(top);
  } catch (err) {
    loginMsg.textContent = err.message;
    loginMsg.className = 'error';
  }
};


function initSocket() {
  if (!token) return;
  socket = io(baseUrl, { auth: { token }, transports: ['websocket'] });

  socket.on('connect', () => {
    console.log('socket connected', socket.id);
  });

  socket.on('leaderboard:update', (payload) => {
    console.log('leaderboard:update', payload);
    renderLeaderboard(payload);
  });

  socket.on('disconnect', (r) => {
    console.log('socket disconnected', r);
  });

  socket.on('connect_error', (err) => {
    console.error('socket connect_error', err);
  });
}

submitBtn.onclick = async () => {
  submitMsg.textContent = '';
  try {
    const sc = Number(scoreEl.value);
    if (!sc && sc !== 0) throw new Error('Enter a valid score');

    const res = await api('/leaderboard/submit', {
      method: 'POST',
      body: JSON.stringify({ score: sc }),
    });
    const payload = res.data;

    submitMsg.textContent = `Submitted, total_score: ${payload.total_score}`;
    submitMsg.className = 'success';
  } catch (err) {
    submitMsg.textContent = err.message;
    submitMsg.className = 'error';
  }
};

// refreshBtn.onclick = async () => {
//   try {
//     const top = await api('/leaderboard/top?limit=10');
//     renderLeaderboard(top);
//   } catch (err) {
//     alert(err.message);
//   }
// };
