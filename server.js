const express = require('express');
const fileUpload = require('express-fileupload');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Body Parsers & File Upload Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(fileUpload());

// Session Configuration
app.use(session({
    secret: 'infinity_vistapanel_secret_2026',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Public Folder to Serve Static HTML/CSS Files
const PUBLIC_DIR = path.join(__dirname, 'public');
app.use(express.static(PUBLIC_DIR));

// Mock Database
const users = {};
const accounts = {};

// --- ROUTES ---

// Root Route
app.get('/', (req, res) => {
    if (req.session.user) return res.redirect('/panel');
    res.redirect('/login');
});

// Login Page UI
app.get('/login', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'login.html'));
});

// Authentication Logic
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

// Main Panel UI
app.get('/panel', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.sendFile(path.join(PUBLIC_DIR, 'panel.html'));
});

// Create Account UI
app.get('/create-account', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.sendFile(path.join(PUBLIC_DIR, 'create-account.html'));
});

// Create Account Logic
app.post('/create-account', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const username = req.session.user;
    const { domain_type, subdomain, free_ext, paid_subdomain, paid_ext } = req.body;

    let finalDomain = domain_type === 'free' ? (subdomain || 'site') + free_ext : (paid_subdomain || 'domain') + paid_ext;
    const accountUsername = 'if0_' + Math.floor(10000000 + Math.random() * 90000000);
    const userFolder = path.join(__dirname, 'public_html', username, finalDomain);

    if (!fs.existsSync(userFolder)) {
        fs.mkdirSync(userFolder, { recursive: true });
        fs.writeFileSync(path.join(userFolder, 'index.html'), `<h1>Welcome to ${finalDomain}!</h1>`);
    }

    if (!accounts[username]) accounts[username] = [];
    accounts[username].push({
        domain: finalDomain,
        type: domain_type,
        account_username: accountUsername
    });

    res.redirect('/panel');
});

// File Manager UI
app.get('/filemanager', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.sendFile(path.join(PUBLIC_DIR, 'filemanager.html'));
});

// API Routes for File Manager
app.get('/get-file', (req, res) => {
    if (!req.session.user) return res.status(403).send('Unauthorized');
    const { file, domain } = req.query;
    let filePath = path.join(__dirname, 'public_html', req.session.user);
    if (domain) filePath = path.join(filePath, domain);
    filePath = path.join(filePath, file || 'index.html');

    if (fs.existsSync(filePath)) res.send(fs.readFileSync(filePath, 'utf8'));
    else res.send('');
});

app.post('/save-file', (req, res) => {
    if (!req.session.user) return res.status(403).send('Unauthorized');
    const { file, content, domain } = req.body;
    let filePath = path.join(__dirname, 'public_html', req.session.user);
    if (domain) filePath = path.join(filePath, domain);
    filePath = path.join(filePath, file || 'index.html');

    fs.writeFileSync(filePath, content);
    res.send('File saved successfully!');
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Start Server
app.listen(PORT, () => console.log(`VistaPanel Engine running on port ${PORT}`));
