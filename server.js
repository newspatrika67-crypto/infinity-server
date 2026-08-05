const express = require('express');
const fileUpload = require('express-fileupload');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(fileUpload());
app.use(session({
    secret: 'infinity_vistapanel_secret_2026',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

const users = {};
const accounts = {};
const DOMAIN_CONFIG = {
    free: ['.infinity.in', '.je.vi', '.site.de', '.site.in'],
    paid: [{ name: '.com', price: 799 }, { name: '.in', price: 499 }]
};

// --- ROUTES ---

app.get('/', (req, res) => {
    if (req.session.user) return res.redirect('/panel');
    res.redirect('/login');
});

// Login Page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
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

// Panel Page (Data Inject करने के लिए हम Template या Simple Replace इस्तेमाल कर सकते हैं)
app.get('/panel', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const username = req.session.user;
    
    // views/panel.html फाइल पढ़कर उसमे डेटा डालकर भेजेंगे
    let html = fs.readFileSync(path.join(__dirname, 'views', 'panel.html'), 'utf8');
    html = html.replace(/__USERNAME__/g, username);
    res.send(html);
});

// Create Account Page
app.get('/create-account', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.sendFile(path.join(__dirname, 'views', 'create-account.html'));
});

app.post('/create-account', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const username = req.session.user;
    const { domain_type, subdomain, free_ext, paid_subdomain, paid_ext } = req.body;

    let finalDomain = domain_type === 'free' ? (subdomain || 'site') + free_ext : (paid_subdomain || 'domain') + paid_ext;
    const userFolder = path.join(__dirname, 'public_html', username, finalDomain);

    if (!fs.existsSync(userFolder)) {
        fs.mkdirSync(userFolder, { recursive: true });
        fs.writeFileSync(path.join(userFolder, 'index.html'), `<h1>Welcome to ${finalDomain}!</h1>`);
    }

    if (!accounts[username]) accounts[username] = [];
    accounts[username].push({ domain: finalDomain, type: domain_type });

    res.redirect('/panel');
});

// File Manager Page
app.get('/filemanager', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.sendFile(path.join(__dirname, 'views', 'filemanager.html'));
});

// File APIs
app.get('/get-file', (req, res) => {
    if (!req.session.user) return res.status(403).send('Unauthorized');
    const { file, domain } = req.query;
    let filePath = path.join(__dirname, 'public_html', req.session.user, domain || '', file);
    if (fs.existsSync(filePath)) res.send(fs.readFileSync(filePath, 'utf8'));
    else res.send('');
});

app.post('/save-file', (req, res) => {
    if (!req.session.user) return res.status(403).send('Unauthorized');
    const { file, content, domain } = req.body;
    let filePath = path.join(__dirname, 'public_html', req.session.user, domain || '', file);
    fs.writeFileSync(filePath, content);
    res.send('File saved successfully!');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
