const express = require('express');
const fileUpload = require('express-fileupload');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(fileUpload());

app.use(session({
    secret: 'infinity_vistapanel_secret_2026',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// 2. Setup Public Folder
const PUBLIC_DIR = path.join(__dirname, 'public');
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });

app.use(express.static(PUBLIC_DIR));

// 3. Database Memory Store
const users = {};
const accounts = {};

// 4. Routes
app.get('/', (req, res) => {
    if (req.session.user) return res.redirect('/panel');
    res.redirect('/login');
});

// Login UI Check
app.get('/login', (req, res) => {
    const loginPath = path.join(PUBLIC_DIR, 'login.html');
    if (fs.existsSync(loginPath)) {
        res.sendFile(loginPath);
    } else {
        res.send('Login file missing in public/ folder!');
    }
});

// Login Logic
app.post('/auth', (req, res) => {
    const { username, password } = req.body;
    if (!users[username]) {
        users[username] = { password };
        accounts[username] = [{
            account_username: 'if0_42538004',
            domain: 'indianshop.site.je',
            type: 'free'
        }];
    }
    if (users[username].password === password) {
        req.session.user = username;
        return res.redirect('/panel');
    }
    res.send('Invalid Credentials! <a href="/login">Go Back</a>');
});

// Serve Panel HTML File
app.get('/panel', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.sendFile(path.join(PUBLIC_DIR, 'panel.html'));
});

// API for panel.html JS Fetch
app.get('/api/user-data', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
    const username = req.session.user;
    res.json({
        username: username,
        accounts: accounts[username] || []
    });
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
