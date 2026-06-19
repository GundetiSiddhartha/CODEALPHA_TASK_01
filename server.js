const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Enable JSON data reading middleware
app.use(express.json());

// Mock Databases
let users = []; 
let orders = [];
const products = [
    { id: 1, name: "Wireless Headphones", price: 99.99, category: "Electronics", description: "High-quality sound with noise-canceling capabilities.", img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300" },
    { id: 2, name: "Minimalist Leather Watch", price: 149.50, category: "Accessories", description: "Sleek and elegant timepiece with premium leather straps.", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300" },
    { id: 3, name: "Ergonomic Running Shoes", price: 85.00, category: "Footwear", description: "Lightweight mesh sneakers built for ultimate comfort and speed.", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300" },
    { id: 4, name: "Smart Fitness Band", price: 45.00, category: "Electronics", description: "Track your steps, heart rate, and sleep quality 24/7.", img: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=300" }
];

// --- BACKEND API ENDPOINTS ---

// Signup Route
app.post('/api/auth/signup', (req, res) => {
    const { username, email, password } = req.body;
    const userExists = users.find(u => u.email === email);
    if (userExists) {
        return res.status(400).json({ error: "User already exists!" });
    }
    const newUser = { username, email, password, address: "", phone: "" };
    users.push(newUser);
    return res.status(201).json({ message: "Success", user: newUser });
});

// Login Route
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        return res.status(401).json({ error: "Invalid credentials!" });
    }
    return res.json({ message: "Success", user });
});

// Update Profile Route
app.put('/api/user/profile', (req, res) => {
    const { email, username, address, phone } = req.body;
    const userIndex = users.findIndex(u => u.email === email);
    if (userIndex === -1) return res.status(404).json({ error: "User not found" });
    
    users[userIndex] = { ...users[userIndex], username, address, phone };
    return res.json({ message: "Success", user: users[userIndex] });
});

// Get Products Route
app.get('/api/products', (req, res) => {
    const { search } = req.query;
    if (search) {
        const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
        return res.json(filtered);
    }
    return res.json(products);
});

// Place Order Route
app.post('/api/orders', (req, res) => {
    const { userEmail, items, total } = req.body;
    const newOrder = { id: 'ORD-' + Math.floor(Math.random() * 900000 + 100000), userEmail, items, total, date: new Date().toLocaleDateString() };
    orders.push(newOrder);
    return res.status(201).json({ message: "Success", order: newOrder });
});

// Get Orders Route
app.get('/api/orders/:email', (req, res) => {
    const userOrders = orders.filter(o => o.userEmail === req.params.email);
    return res.json(userOrders);
});

// Serve frontend files
app.use(express.static(path.join(__dirname, 'public')));

// New Node.js v24 friendly wildcard rule
app.get('*all', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));