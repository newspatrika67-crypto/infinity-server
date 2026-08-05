const express = require('express');
const fileUpload = require('express-fileupload');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(fileUpload());

app.use(session({
    secret: 'infinity_vistapanel_secret_2026',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Setup Public Dir & Ensure Files Exist automatically
const PUBLIC_DIR = path.join(__dirname, 'public');

if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// Auto-create login.html if missing to prevent ENOENT crashes
const loginFilePath = path.join(PUBLIC_DIR, 'login.html');
if (!fs.existsSync(loginFilePath)) {
    const defaultLoginHtml = `<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VistaPanel - Infinity Cloud Login</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        * { box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin:0; padding:0; }
        body { background: #0f172a; color: #f8fafc; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
        .login-card { background: #1e293b; width: 100%; max-width: 420px; padding: 35px; border-radius: 12px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .logo { text-align: center; font-size: 26px; font-weight: bold; color: #38bdf8; margin-bottom: 25px; display: flex; align-items: center; justify-content: center; gap: 10px; }
        .form-group { margin-bottom: 18px; }
        label { display: block; font-size: 13px; color: #94a3b8; margin-bottom: 6px; font-weight: 600; }
        input { width: 100%; padding: 12px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #fff; font-size: 14px; outline: none; }
        input:focus { border-color: #38bdf8; }
        button { width: 100%; padding: 12px; background: #0284c7; border: none; border-radius: 6px; color: white; font-weight: bold; font-size: 15px; cursor: pointer; transition: 0.2s; }
        button:hover { background: #0369a1; }
        .footer-text { text-align: center; margin-top: 20px; font-size: 12px; color: #64748b; }
    </style>
</head>
<body>
    <div class="login-card">
        <div class="logo"><i class="fa-solid fa-infinity"></i> VistaPanel</div>
        <form action="/auth" method="POST">
            <div class="form-group">
                <label>Hosting Username / Email</label>
                <input type="text" name="username" placeholder="e.g. if0_42538004" required>
            </div>
            <div class="form-group">
                <label>Account Password</label>
                <input type="password" name="password" placeholder="••••••••" required>
            </div>
            <button type="submit"><i class="fa-solid fa-right-to-bracket"></i> Login to Panel</button>
        </form>
        <div class="footer-text">Infinity Free Cloud Hosting Architecture v2.0</div>
    </div>
</body>
</html>`;
    fs.writeFileSync(loginFilePath, defaultLoginHtml);
}

app.use(express.static(PUBLIC_DIR));

// Memory Store
const users = {};
const accounts = {};

// Routes
app.get('/', (req, res) => {
    if (req.session.user) return res.redirect('/panel');
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    res.sendFile(loginFilePath);
});

app.post('/auth', (req, res) => {
    const { username, password } = req.body;
    if (!users[username]) {
        users[username] = { password };
        accounts[username] = [];
    }
    if (users[username].password === password) {
        req.session.user = username;
        return res.redirect('/panel');
    }
    res.send('Invalid Credentials! <a href="/login">Go Back</a>');
});

app.get('/panel', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.send(`<h1>Welcome ${req.session.user} to VistaPanel Dashboard</h1><a href="/logout">Logout</a>`);
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.listen(PORT, () => console.log(`VistaPanel Engine running on port ${PORT}`));
