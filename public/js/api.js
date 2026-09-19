const API = {
  token: () => localStorage.getItem('token'),
  user: () => JSON.parse(localStorage.getItem('user') || 'null'),

  async call(method, url, body) {
    const headers = { 'Content-Type': 'application/json' };
    const token = API.token();
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Có lỗi xảy ra.');
    return data;
  },

  get(url) { return API.call('GET', url); },
  post(url, body) { return API.call('POST', url, body); },
  put(url, body) { return API.call('PUT', url, body); },
  del(url) { return API.call('DELETE', url); },

  saveSession(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    location.href = '/login.html';
  },
  requireLogin() {
    if (!API.token()) location.href = '/login.html';
  },
  requireAdmin() {
    const u = API.user();
    if (!API.token() || !u || u.role !== 'admin') location.href = '/index.html';
  }
};

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

function money(n) {
  return Number(n || 0).toLocaleString('vi-VN') + ' đ';
}

function renderHeader(activePage) {
  const user = API.user();
  const el = document.getElementById('site-header');
  if (!el) return;
  el.innerHTML = `
    <a class="logo" href="/index.html">🛍 WebShop</a>
    <nav>
      <a href="/index.html">Sản phẩm</a>
      ${user ? `<a href="/orders.html">Đơn hàng</a>
      <a href="/deposit.html">Nạp tiền</a>` : ''}
      ${user && user.role === 'admin' ? `<a href="/admin.html">Quản trị</a>` : ''}
      ${user
        ? `<span class="balance-pill">${user.username} · ${money(user.balance)}</span>
           <button onclick="API.logout()">Đăng xuất</button>`
        : `<a href="/login.html">Đăng nhập</a><a href="/register.html">Đăng ký</a>`}
    </nav>
  `;
}
