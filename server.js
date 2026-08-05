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
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 Hours
}));

// Mock Database (In-Memory for Users & Hosting Accounts)
const users = {};
const accounts = {};

// Domain Configuration (Free & Paid Rules)
const DOMAIN_CONFIG = {
    free: ['.infinity.in', '.je.vi', '.site.de', '.infinityfree.le', '.site.in', '.site.net.in'],
    paid: [
        { name: '.com.in', price: 299 },
        { name: '.in', price: 499 },
        { name: '.com', price: 799 },
        { name: '.org.in', price: 399 }
    ]
};

// ==================== ROUTES ====================

// Root Route
app.get('/', (req, res) => {
    if (req.session.user) return res.redirect('/panel');
    res.redirect('/login');
});

// 1. LOGIN PAGE UI
app.get('/login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
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
        </html>
    `);
});

// AUTHENTICATION LOGIC
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

// 2. MAIN VISTAPANEL DASHBOARD
app.get('/panel', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const username = req.session.user;
    const userAccs = accounts[username] || [];

    res.send(`
        <!DOCTYPE html>
        <html lang="hi">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>VistaPanel - ${username}</title>
            <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
            <style>
                * { box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; }
                body { background: #0f172a; color: #f8fafc; }
                .navbar { background: #1e293b; padding: 15px 30px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; }
                .brand { font-size: 20px; font-weight: bold; color: #38bdf8; display: flex; align-items: center; gap: 8px; }
                .user-nav { display: flex; align-items: center; gap: 15px; font-size: 14px; }
                .logout-btn { background: #ef4444; color: white; padding: 6px 12px; border-radius: 4px; text-decoration: none; font-size: 12px; font-weight: bold; }
                
                .container { display: grid; grid-template-columns: 1fr 320px; gap: 20px; padding: 25px; max-width: 1400px; margin: auto; }
                
                .module { background: #1e293b; border-radius: 8px; border: 1px solid #334155; margin-bottom: 20px; overflow: hidden; }
                .module-header { background: #0f172a; padding: 12px 20px; font-weight: bold; font-size: 15px; color: #38bdf8; border-bottom: 1px solid #334155; display: flex; align-items: center; gap: 10px; }
                .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 15px; padding: 20px; }
                .icon-box { background: #0f172a; padding: 15px 10px; border-radius: 8px; text-align: center; border: 1px solid #334155; cursor: pointer; transition: 0.2s; text-decoration: none; color: #e2e8f0; display: block; }
                .icon-box:hover { border-color: #38bdf8; transform: translateY(-2px); background: #1e293b; }
                .icon-box i { font-size: 24px; color: #38bdf8; margin-bottom: 8px; display: block; }
                .icon-box span { font-size: 12px; display: block; }

                .sidebar .card { background: #1e293b; padding: 18px; border-radius: 8px; border: 1px solid #334155; margin-bottom: 20px; }
                .sidebar h3 { font-size: 15px; color: #38bdf8; margin-bottom: 15px; border-bottom: 1px solid #334155; padding-bottom: 8px; }
                .btn-create { background: #10b981; color: white; border: none; padding: 8px 12px; border-radius: 4px; width: 100%; font-weight: bold; cursor: pointer; text-decoration: none; display: block; text-align: center; margin-top: 10px; }
                .stat-item { margin-bottom: 12px; font-size: 13px; color: #94a3b8; }
            </style>
        </head>
        <body>
            <div class="navbar">
                <div class="brand"><i class="fa-solid fa-infinity"></i> VistaPanel</div>
                <div class="user-nav">
                    <span><i class="fa-solid fa-user"></i> ${username}</span>
                    <a href="/logout" class="logout-btn">Logout</a>
                </div>
            </div>

            <div class="container">
                <div class="main-content">
                    
                    <!-- DOMAIN MANAGEMENT MODULE -->
                    <div class="module">
                        <div class="module-header"><i class="fa-solid fa-globe"></i> Active Hosting Domains</div>
                        <div style="padding:20px;">
                            ${userAccs.length === 0 ? '<p style="color:#888;">No active hosting domain found. Create one from the sidebar!</p>' : ''}
                            ${userAccs.map(acc => `
                                <div style="background:#0f172a; padding:12px; border-radius:6px; border:1px solid #334155; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                                    <div>
                                        <b style="color:#38bdf8">${acc.domain}</b>
                                        <div style="font-size:12px; color:#888;">Type: ${acc.type.toUpperCase()} | User: ${acc.account_username}</div>
                                    </div>
                                    <a href="/filemanager?domain=${acc.domain}" class="icon-box" style="padding:6px 12px;"><i class="fa-solid fa-folder-open" style="font-size:14px; margin:0;"></i> Manage</a>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- FILES MODULE -->
                    <div class="module">
                        <div class="module-header"><i class="fa-solid fa-folder-open"></i> Files</div>
                        <div class="grid">
                            <a href="/filemanager" class="icon-box">
                                <i class="fa-solid fa-folder-tree" style="color:#f59e0b"></i>
                                <span>File Manager</span>
                            </a>
                            <a href="#" class="icon-box">
                                <i class="fa-solid fa-network-wired"></i>
                                <span>FTP Accounts</span>
                            </a>
                        </div>
                    </div>

                    <!-- DATABASES MODULE -->
                    <div class="module">
                        <div class="module-header"><i class="fa-solid fa-database"></i> Databases</div>
                        <div class="grid">
                            <a href="#" class="icon-box">
                                <i class="fa-solid fa-server" style="color:#10b981"></i>
                                <span>MySQL DBs</span>
                            </a>
                        </div>
                    </div>

                </div>

                <!-- SIDEBAR STATS & CREATE ACC -->
                <div class="sidebar">
                    <div class="card">
                        <h3><i class="fa-solid fa-plus-circle"></i> Create Domain</h3>
                        <p style="font-size:12px; color:#94a3b8;">Setup new free or paid domain hosting.</p>
                        <a href="/create-account" class="btn-create"><i class="fa-solid fa-plus"></i> New Hosting Account</a>
                    </div>

                    <div class="card">
                        <h3><i class="fa-solid fa-circle-info"></i> Account Details</h3>
                        <div class="stat-item">Main Username: <b style="color:#fff">${username}</b></div>
                        <div class="stat-item">Status: <b style="color:#10b981">Active</b></div>
                        <div class="stat-item">Active Accounts: <b style="color:#fff">${userAccs.length} / 3</b></div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
});

// 3. CREATE ACCOUNT & DOMAIN SELECTION UI
app.get('/create-account', (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    res.send(`
        <!DOCTYPE html>
        <html lang="hi">
        <head>
            <meta charset="UTF-8">
            <title>Create Hosting Account</title>
            <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
            <style>
                * { box-sizing: border-box; font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0; }
                body { background: #0f172a; color: #fff; padding: 40px; display: flex; justify-content: center; }
                .card { background: #1e293b; border: 1px solid #334155; padding: 30px; border-radius: 8px; width: 100%; max-width: 500px; }
                .form-group { margin-bottom: 20px; }
                label { display: block; margin-bottom: 8px; font-size: 13px; color: #94a3b8; }
                input, select { width: 100%; padding: 10px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #fff; outline: none; }
                .input-group { display: flex; }
                .input-group input { border-radius: 6px 0 0 6px; }
                .input-group select { border-radius: 0 6px 6px 0; border-left: none; width: 160px; }
                .btn { background: #0284c7; color: white; border: none; padding: 10px 15px; border-radius: 6px; cursor: pointer; width: 100%; font-weight: bold; }
                .hidden { display: none; }
            </style>
        </head>
        <body>
            <div class="card">
                <a href="/panel" style="color:#38bdf8; text-decoration:none;">&larr; Back to Panel</a>
                <h2 style="margin: 15px 0;">Create Hosting Account</h2>
                
                <form action="/create-account" method="POST">
                    <div class="form-group">
                        <label>Domain Type</label>
                        <select name="domain_type" id="domainType" onchange="toggleType()">
                            <option value="free">Free Subdomain</option>
                            <option value="paid">Custom Paid Domain</option>
                        </select>
                    </div>

                    <div class="form-group" id="freeGroup">
                        <label>Subdomain</label>
                        <div class="input-group">
                            <input type="text" name="subdomain" placeholder="mywebsite">
                            <select name="free_ext">
                                ${DOMAIN_CONFIG.free.map(d => `<option value="${d}">${d}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <div class="form-group hidden" id="paidGroup">
                        <label>Custom Domain</label>
                        <div class="input-group">
                            <input type="text" name="paid_subdomain" placeholder="example">
                            <select name="paid_ext">
                                ${DOMAIN_CONFIG.paid.map(d => `<option value="${d.name}">${d.name} (₹${d.price}/yr)</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <button type="submit" class="btn">Create Account Now</button>
                </form>
            </div>

            <script>
                function toggleType() {
                    const type = document.getElementById('domainType').value;
                    if(type === 'free') {
                        document.getElementById('freeGroup').classList.remove('hidden');
                        document.getElementById('paidGroup').classList.add('hidden');
                    } else {
                        document.getElementById('freeGroup').classList.add('hidden');
                        document.getElementById('paidGroup').classList.remove('hidden');
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// CREATE ACCOUNT LOGIC
app.post('/create-account', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const username = req.session.user;
    const { domain_type, subdomain, free_ext, paid_subdomain, paid_ext } = req.body;

    let finalDomain = '';
    if (domain_type === 'free') {
        finalDomain = (subdomain || 'site') + free_ext;
    } else {
        finalDomain = (paid_subdomain || 'domain') + paid_ext;
    }

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

// 4. MONACO CODE EDITOR & FILE MANAGER
app.get('/filemanager', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const username = req.session.user;
    const targetDomain = req.query.domain;
    
    let basePath = path.join(__dirname, 'public_html', username);
    if (targetDomain) {
        basePath = path.join(basePath, targetDomain);
    }

    if (!fs.existsSync(basePath)) {
        fs.mkdirSync(basePath, { recursive: true });
        fs.writeFileSync(path.join(basePath, 'index.html'), '<h1>Welcome to Infinity Site!</h1>');
    }

    const files = fs.readdirSync(basePath);

    res.send(`
        <!DOCTYPE html>
        <html lang="hi">
        <head>
            <meta charset="UTF-8">
            <title>Monaco File Manager - ${username}</title>
            <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
            <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs/loader.min.js"></script>
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; }
                body { background: #1e1e1e; color: #fff; display: grid; grid-template-rows: 50px 1fr; height: 100vh; }
                .topbar { background: #252526; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333; }
                .editor-container { display: grid; grid-template-columns: 250px 1fr; height: calc(100vh - 50px); }
                .file-list { background: #252526; border-right: 1px solid #333; padding: 15px; }
                .file-item { padding: 8px; border-radius: 4px; cursor: pointer; font-size: 14px; margin-bottom: 5px; display: flex; align-items: center; gap: 8px; }
                .file-item:hover { background: #37373d; }
                #editor { width: 100%; height: 100%; }
                .btn { background: #0e639c; color: white; border: none; padding: 6px 14px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="topbar">
                <div><i class="fa-solid fa-code" style="color:#38bdf8"></i> <b>Infinity Code Editor (Monaco IDE)</b></div>
                <div>
                    <button class="btn" onclick="saveFile()"><i class="fa-solid fa-floppy-disk"></i> Save File</button>
                    <a href="/panel" class="btn" style="background:#444; text-decoration:none; margin-left:10px;">Back to Panel</a>
                </div>
            </div>

            <div class="editor-container">
                <div class="file-list">
                    <h4 style="color:#888; font-size:12px; margin-bottom:10px;">PUBLIC_HTML ${targetDomain ? '('/'+targetDomain+')' : ''}</h4>
                    ${files.map(f => `<div class="file-item" onclick="loadFile('${f}')"><i class="fa-solid fa-file-code" style="color:#38bdf8"></i> ${f}</div>`).join('')}
                </div>
                <div id="editor"></div>
            </div>

            <script>
                let editor;
                let currentFile = 'index.html';
                const targetDomain = "${targetDomain || ''}";

                require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs' }});
                require(['vs/editor/editor.main'], function() {
                    editor = monaco.editor.create(document.getElementById('editor'), {
                        value: "<!-- Select file to edit -->",
                        language: 'html',
                        theme: 'vs-dark'
                    });
                    loadFile('index.html');
                });

                function loadFile(fileName) {
                    currentFile = fileName;
                    fetch('/get-file?file=' + fileName + '&domain=' + targetDomain)
                        .then(res => res.text())
                        .then(data => editor.setValue(data));
                }

                function saveFile() {
                    const content = editor.getValue();
                    fetch('/save-file', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ file: currentFile, content: content, domain: targetDomain })
                    }).then(res => res.text()).then(msg => alert(msg));
                }
            </script>
        </body>
        </html>
    `);
});

// FILE FETCH & SAVE ENDPOINTS
app.get('/get-file', (req, res) => {
    if (!req.session.user) return res.status(403).send('Unauthorized');
    const { file, domain } = req.query;
    let filePath = path.join(__dirname, 'public_html', req.session.user);
    if (domain) filePath = path.join(filePath, domain);
    filePath = path.join(filePath, file);

    if (fs.existsSync(filePath)) res.send(fs.readFileSync(filePath, 'utf8'));
    else res.send('');
});

app.post('/save-file', (req, res) => {
    if (!req.session.user) return res.status(403).send('Unauthorized');
    const { file, content, domain } = req.body;
    let filePath = path.join(__dirname, 'public_html', req.session.user);
    if (domain) filePath = path.join(filePath, domain);
    filePath = path.join(filePath, file);

    fs.writeFileSync(filePath, content);
    res.send('File saved successfully!');
});

// LOGOUT
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// START SERVER
app.listen(PORT, () => {
    console.log(`VistaPanel Engine running on port ${PORT}`);
});
