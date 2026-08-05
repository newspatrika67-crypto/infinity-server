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
    saveUninitialized: true
}));

const users = {};

// Root Route
app.get('/', (req, res) => {
    if (req.session.user) return res.redirect('/panel');
    res.redirect('/login');
});

// LOGIN & SIGNUP UI
app.get('/login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>VistaPanel - Infinity Cloud Login</title>
            <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
            <style>
                * { box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                body { background: #0b0f19; color: #e2e8f0; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
                .login-card { background: #151c2c; width: 100%; max-width: 400px; padding: 40px; border-radius: 12px; border: 1px solid #1e293b; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
                .logo { text-align: center; font-size: 24px; font-weight: bold; color: #38bdf8; margin-bottom: 25px; }
                .logo i { margin-right: 8px; }
                .form-group { margin-bottom: 20px; }
                label { display: block; font-size: 13px; color: #94a3b8; margin-bottom: 8px; }
                input { width: 100%; padding: 12px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #fff; font-size: 14px; }
                input:focus { outline: none; border-color: #38bdf8; }
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
                        <label>Hosting Username</label>
                        <input type="text" name="username" placeholder="e.g. epiz_342189" required>
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

// AUTHENTICATION
app.post('/auth', (req, res) => {
    const { username, password } = req.body;
    if (!users[username]) {
        users[username] = { password };
    }
    if (users[username].password === password) {
        req.session.user = username;
        return res.redirect('/panel');
    }
    res.send('Invalid Credentials! <a href="/login">Go Back</a>');
});

// VISTAPANEL DASHBOARD UI
app.get('/panel', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const username = req.session.user;

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>VistaPanel - ${username}</title>
            <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
            <style>
                * { box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; }
                body { background: #0f172a; color: #f8fafc; }
                .navbar { background: #1e293b; padding: 15px 30px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; }
                .brand { font-size: 20px; font-weight: bold; color: #38bdf8; }
                .user-nav { display: flex; align-items: center; gap: 15px; font-size: 14px; }
                .logout-btn { background: #ef4444; color: white; padding: 6px 12px; border-radius: 4px; text-decoration: none; font-size: 12px; font-weight: bold; }
                
                .container { display: grid; grid-template-columns: 1fr 300px; gap: 20px; padding: 25px; max-width: 1400px; margin: auto; }
                
                .module { background: #1e293b; border-radius: 8px; border: 1px solid #334155; margin-bottom: 20px; overflow: hidden; }
                .module-header { background: #0f172a; padding: 12px 20px; font-weight: bold; font-size: 15px; color: #38bdf8; border-bottom: 1px solid #334155; display: flex; align-items: center; gap: 10px; }
                .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 15px; padding: 20px; }
                .icon-box { background: #0f172a; padding: 15px 10px; border-radius: 8px; text-align: center; border: 1px solid #334155; cursor: pointer; transition: 0.2s; text-decoration: none; color: #e2e8f0; display: block; }
                .icon-box:hover { border-color: #38bdf8; transform: translateY(-2px); background: #1e293b; }
                .icon-box i { font-size: 24px; color: #38bdf8; margin-bottom: 8px; display: block; }
                .icon-box span { font-size: 12px; display: block; }

                .sidebar .card { background: #1e293b; padding: 18px; border-radius: 8px; border: 1px solid #334155; margin-bottom: 20px; }
                .sidebar h3 { font-size: 15px; color: #38bdf8; margin-bottom: 15px; border-bottom: 1px solid #334155; padding-bottom: 8px; }
                .stat-item { margin-bottom: 12px; font-size: 13px; }
                .stat-bar { background: #0f172a; height: 8px; border-radius: 4px; overflow: hidden; margin-top: 5px; }
                .stat-fill { background: #10b981; height: 100%; width: 5%; }
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
                            <a href="#" class="icon-box">
                                <i class="fa-solid fa-chart-pie"></i>
                                <span>Disk Usage</span>
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
                            <a href="#" class="icon-box">
                                <i class="fa-solid fa-database" style="color:#0284c7"></i>
                                <span>phpMyAdmin</span>
                            </a>
                        </div>
                    </div>

                    <!-- DOMAINS MODULE -->
                    <div class="module">
                        <div class="module-header"><i class="fa-solid fa-globe"></i> Domains</div>
                        <div class="grid">
                            <a href="#" class="icon-box">
                                <i class="fa-solid fa-plus"></i>
                                <span>Addon Domains</span>
                            </a>
                            <a href="#" class="icon-box">
                                <i class="fa-solid fa-sitemap"></i>
                                <span>Subdomains</span>
                            </a>
                            <a href="#" class="icon-box">
                                <i class="fa-solid fa-shield-halved" style="color:#a855f7"></i>
                                <span>Free SSL</span>
                            </a>
                        </div>
                    </div>

                    <!-- SOFTWARE MODULE -->
                    <div class="module">
                        <div class="module-header"><i class="fa-solid fa-rocket"></i> Software & PHP</div>
                        <div class="grid">
                            <a href="#" class="icon-box">
                                <i class="fa-brands fa-wordpress" style="color:#38bdf8"></i>
                                <span>Softaculous</span>
                            </a>
                            <a href="#" class="icon-box">
                                <i class="fa-brands fa-php" style="color:#818cf8"></i>
                                <span>Alter PHP</span>
                            </a>
                        </div>
                    </div>

                </div>

                <!-- SIDEBAR STATS -->
                <div class="sidebar">
                    <div class="card">
                        <h3><i class="fa-solid fa-circle-info"></i> Account Details</h3>
                        <p style="font-size:13px; color:#94a3b8; margin-bottom:8px;">Username: <b style="color:#fff">${username}</b></p>
                        <p style="font-size:13px; color:#94a3b8; margin-bottom:8px;">Main Domain: <b style="color:#fff">${username}.infinityfreeapp.com</b></p>
                        <p style="font-size:13px; color:#94a3b8;">Status: <b style="color:#10b981">Active</b></p>
                    </div>

                    <div class="card">
                        <h3><i class="fa-solid fa-chart-simple"></i> Statistics</h3>
                        
                        <div class="stat-item">
                            <span>Disk Space Used (0 MB / Unlimited)</span>
                            <div class="stat-bar"><div class="stat-fill"></div></div>
                        </div>

                        <div class="stat-item">
                            <span>Bandwidth (0 MB / Unlimited)</span>
                            <div class="stat-bar"><div class="stat-fill"></div></div>
                        </div>

                        <div class="stat-item">
                            <span>MySQL Databases (0 / 400)</span>
                            <div class="stat-bar"><div class="stat-fill" style="width:0%"></div></div>
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
});

// MONACO CODE EDITOR FILE MANAGER
app.get('/filemanager', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const username = req.session.user;
    const userFolder = path.join(__dirname, 'public_html', username);

    if (!fs.existsSync(userFolder)) {
        fs.mkdirSync(userFolder, { recursive: true });
        // Default index.html
        fs.writeFileSync(path.join(userFolder, 'index.html'), '<h1>Welcome to Infinity Free Site!</h1>');
    }

    const files = fs.readdirSync(userFolder);

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
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
                .file-item.active { background: #094771; }
                #editor { width: 100%; height: 100%; }
                .btn { background: #0e639c; color: white; border: none; padding: 6px 14px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: bold; }
                .btn:hover { background: #1177bb; }
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
                    <h4 style="color:#888; font-size:12px; margin-bottom:10px;">PUBLIC_HTML</h4>
                    ${files.map(f => `<div class="file-item" onclick="loadFile('${f}')"><i class="fa-solid fa-file-code" style="color:#38bdf8"></i> ${f}</div>`).join('')}
                </div>
                <div id="editor"></div>
            </div>

            <script>
                let editor;
                let currentFile = 'index.html';

                require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs' }});
                require(['vs/editor/editor.main'], function() {
                    editor = monaco.editor.create(document.getElementById('editor'), {
                        value: "<!-- Select a file from left sidebar -->",
                        language: 'html',
                        theme: 'vs-dark'
                    });
                    loadFile('index.html');
                });

                function loadFile(fileName) {
                    currentFile = fileName;
                    fetch('/get-file?file=' + fileName)
                        .then(res => res.text())
                        .then(data => {
                            editor.setValue(data);
                        });
                }

                function saveFile() {
                    const content = editor.getValue();
                    fetch('/save-file', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ file: currentFile, content: content })
                    }).then(res => res.text()).then(msg => alert(msg));
                }
            </script>
        </body>
        </html>
    `);
});

// GET & SAVE FILE ROUTES
app.get('/get-file', (req, res) => {
    if (!req.session.user) return res.status(403).send('Unauthorized');
    const userFolder = path.join(__dirname, 'public_html', req.session.user);
    const filePath = path.join(userFolder, req.query.file);
    if (fs.existsSync(filePath)) {
        res.send(fs.readFileSync(filePath, 'utf8'));
    } else {
        res.send('');
    }
});

app.post('/save-file', (req, res) => {
    if (!req.session.user) return res.status(403).send('Unauthorized');
    const { file, content } = req.body;
    const userFolder = path.join(__dirname, 'public_html', req.session.user);
    fs.writeFileSync(path.join(userFolder, file), content);
    res.send('File saved successfully!');
});

// LOGOUT
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.listen(PORT, () => {
    console.log('VistaPanel running on port ' + PORT);
});
