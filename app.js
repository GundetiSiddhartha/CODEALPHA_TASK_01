let userSession = null;
let shoppingCart = [];
let mode = 'login';

function showPage(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    
    if (id === 'store-page') fetchProducts();
    if (id === 'cart-page') renderCart();
    if (id === 'account-page') renderAccount();
}

function toggleAuth(targetMode) {
    mode = targetMode;
    document.getElementById('tab-login').classList.toggle('active', mode === 'login');
    document.getElementById('tab-signup').classList.toggle('active', mode === 'signup');
    document.getElementById('username-group').classList.toggle('hidden', mode === 'login');
    document.getElementById('auth-btn').innerText = mode === 'login' ? 'Login' : 'Create Profile';
}

// Auth Submit Logic
async function handleAuth(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const username = document.getElementById('auth-username').value;

    const targetUrl = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
    const bodyData = mode === 'login' ? { email, password } : { username, email, password };

    try {
        const res = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });
        const data = await res.json();

        if (!res.ok) {
            alert(data.error);
            return;
        }

        userSession = data.user;
        document.getElementById('main-nav').classList.remove('hidden');
        showPage('store-page');
        document.getElementById('auth-form').reset();
    } catch (err) {
        alert("Server communication error. Check your terminal logs.");
    }
}

function handleLogout() {
    userSession = null;
    shoppingCart = [];
    document.getElementById('cart-count').innerText = '0';
    document.getElementById('main-nav').classList.add('hidden');
    showPage('auth-page');
}

// Products Engine
async function fetchProducts(query = '') {
    try {
        const url = query ? `/api/products?search=${query}` : '/api/products';
        const res = await fetch(url);
        const items = await res.json();
        
        const grid = document.getElementById('product-grid');
        grid.innerHTML = '';

        items.forEach(p => {
            const div = document.createElement('div');
            div.className = 'card';
            div.innerHTML = `
                <img src="${p.img}">
                <h3>${p.name}</h3>
                <p style="color:#2563eb; font-weight:bold; margin:5px 0;">$${p.price.toFixed(2)}</p>
                <div style="display:flex; gap:5px;">
                    <button class="btn-sub" style="flex:1" onclick='viewDetails(${JSON.stringify(p)})'>Details</button>
                    <button class="btn-main" style="flex:1; font-size:14px;" onclick='addToCart(${JSON.stringify(p)})'>Add</button>
                </div>
            `;
            grid.appendChild(div);
        });
    } catch(e) { console.log(e); }
}

function handleSearch() {
    const txt = document.getElementById('search-input').value;
    fetchProducts(txt);
}

function viewDetails(p) {
    const container = document.getElementById('details-content');
    container.innerHTML = `
        <img src="${p.img}">
        <div>
            <h2>${p.name}</h2>
            <h3 style="color:#2563eb; margin:10px 0;">$${p.price.toFixed(2)}</h3>
            <p style="color:#666; margin-bottom:20px;">${p.description}</p>
            <button class="btn-main" onclick='addToCart(${JSON.stringify(p)})'>Add to Cart</button>
        </div>
    `;
    showPage('details-page');
}

// Cart Mechanics
function addToCart(p) {
    const match = shoppingCart.find(item => item.id === p.id);
    if (match) match.qty++;
    else shoppingCart.push({ ...p, qty: 1 });
    
    document.getElementById('cart-count').innerText = shoppingCart.reduce((a, b) => a + b.qty, 0);
    alert(`${p.name} added!`);
}

function renderCart() {
    const box = document.getElementById('cart-items');
    box.innerHTML = shoppingCart.length === 0 ? '<p>Empty Cart</p>' : '';
    
    let total = 0;
    shoppingCart.forEach(item => {
        total += item.price * item.qty;
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <img src="${item.img}">
            <div style="flex:1"><h4>${item.name}</h4><p>$${item.price}</p></div>
            <div><strong>Qty: ${item.qty}</strong></div>
        `;
        box.appendChild(div);
    });

    document.getElementById('cart-total').innerText = `$${total.toFixed(2)}`;
    document.getElementById('cart-summary').classList.toggle('hidden', shoppingCart.length === 0);
}

// Order & Profile Actions
async function processOrder(e) {
    e.preventDefault();
    const address = document.getElementById('checkout-address').value;
    const phone = document.getElementById('checkout-phone').value;
    const total = shoppingCart.reduce((a, b) => a + (b.price * b.qty), 0);

    await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: userSession.email, items: shoppingCart, total })
    });

    const upd = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userSession.email, username: userSession.username, address, phone })
    });
    const saved = await upd.json();
    userSession = saved.user;

    alert("Order Completed successfully!");
    shoppingCart = [];
    document.getElementById('cart-count').innerText = '0';
    showPage('account-page');
}

async function renderAccount() {
    document.getElementById('prof-name').value = userSession.username;
    document.getElementById('prof-email').value = userSession.email;
    document.getElementById('prof-address').value = userSession.address || '';
    document.getElementById('prof-phone').value = userSession.phone || '';

    const res = await fetch(`/api/orders/${userSession.email}`);
    const orders = await res.json();
    const history = document.getElementById('order-history');
    history.innerHTML = orders.length === 0 ? '<p>No orders yet</p>' : '';

    orders.forEach(o => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `<strong>${o.id}</strong> - ${o.date}<br>Total Paid: $${o.total.toFixed(2)}`;
        history.appendChild(div);
    });
}

async function updateProfile(e) {
    e.preventDefault();
    const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: userSession.email,
            username: document.getElementById('prof-name').value,
            address: document.getElementById('prof-address').value,
            phone: document.getElementById('prof-phone').value
        })
    });
    const d = await res.json();
    userSession = d.user;
    alert("Profile Updated!");
}