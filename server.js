const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs-extra'); // File system operations
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const app = express();
const PORT = process.env.PORT || 3000;

// Root directory for hosted user files
const USER_HOSTS_DIR = path.join(__dirname, 'user_hosting');
if (!fs.existsSync(USER_HOSTS_DIR)) fs.mkdirSync(USER_HOSTS_DIR, { recursive: true });

// -------------------------------------------------------------
// 1. Database & App Setup
// -------------------------------------------------------------
let db;
(async () => {
    db = await open({
        filename: path.join(__dirname, 'hosting_system.db'),
        driver: sqlite3.Database
    });

    // Create Tables
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT);
        CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY, username TEXT, domain TEXT, created TEXT);
        CREATE TABLE IF NOT EXISTS databases (id INTEGER PRIMARY KEY AUTOINCREMENT, account_id TEXT, db_name TEXT);
    `);
})();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 'live_infinity_engine_2026',
    resave: false,
    saveUninitialized: true
}));

const requireAuth = (req, res, next) => {
    if (!req.session.user) return res.redirect('/login');
    next();
};

// -------------------------------------------------------------
// 2. Multi-Domain Dynamic Hosting Engine (Subdomain Execution)
// -------------------------------------------------------------
// यह मिडलवेयर चेक करता है कि क्या कोई यूजर का डोमेन रिक्वेस्ट हुआ है
app.use(async (req, res, next) => {
    const host = req.headers.host || '';
    const domain = host.split(':')[0]; // Domain or IP

    // अगर रूट/एडमिन पैनल एक्सेस हो रहा है तो आगे बढ़ें
    if (domain === 'localhost' || domain.includes('render.com') || !domain.includes('.')) {
        return next();
    }

    // अगर कोई यूजर का होस्टेड डोमेन कॉल हुआ है
    if (db) {
        const acc = await db.get('SELECT * FROM accounts WHERE domain = ?', [domain]);
        if (acc) {
            const htdocsPath = path.join(USER_HOSTS_DIR, acc.id, 'htdocs');
            const reqPath = req.path === '/' ? '/index.html' : req.path;
            const targetFile = path.join(htdocsPath, reqPath);

            if (fs.existsSync(targetFile) && fs.statSync(targetFile).isFile()) {
                return res.sendFile(targetFile);
            } else if (fs.existsSync(path.join(htdocsPath, 'index.html'))) {
                return res.sendFile(path.join(htdocsPath, 'index.html'));
            } else {
                return res.status(404).send('<h1>404 Not Found - Welcome to your new website!</h1><p>Upload files in htdocs.</p>');
            }
        }
    }
    next();
});

// UI Layout Template
function renderUI(title, content, user = null) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>${title} - Infinity Panel Engine</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
        <style>
            body { font-family: sans-serif; background: #f0f2f5; margin:0; }
            header { background: #fff; padding: 15px 30px; display:flex; justify-content:space-between; border-bottom:1px solid #ddd; }
            .logo { font-size:20px; font-weight:bold; color:#5856d6; text-decoration:none; }
            .container { max-width: 900px; margin: 30px auto; padding: 0 15px; }
            .card { background: #fff; border-radius: 8px; border:1px solid #e1e4e8; padding:20px; margin-bottom:20px; }
            .btn { background: #5856d6; color:white; padding:8px 16px; border:none; border-radius:5px; text-decoration:none; cursor:pointer; font-weight:bold; display:inline-block; }
            .btn-danger { background: #e74c3c; }
            input, select, textarea { width:100%; padding:10px; margin:8px 0; border:1px solid #ccc; border-radius:5px; box-sizing:border-box; }
            .file-list { border-top:1px solid #eee; margin-top:10px; }
            .file-item { display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee; align-items:center; }
        </style>
    </head>
    <body>
        <header>
            <a href="/accounts" class="logo"><i class="fa-solid fa-infinity"></i> InfinityFree Engine</a>
            <div>${user ? `<b>${user}</b> | <a href="/logout" style="color:red;">Logout</a>` : ''}</div>
        </header>
        <div class="container">${content}</div>
    </body>
    </html>`;
}

// -------------------------------------------------------------
// 3. Auth Routes
// -------------------------------------------------------------
app.get('/', (req, res) => res.redirect('/accounts'));

app.get('/login', (req, res) => {
    res.send(renderUI('Login', `
        <div class="card" style="max-width:350px; margin:auto;">
            <h2>Sign In / Register</h2>
            <form action="/auth" method="POST">
                <input type="text" name="username" placeholder="Username" required>
                <input type="password" name="password" placeholder="Password" required>
                <button class="btn" style="width:100%;">Continue</button>
            </form>
        </div>
    `));
});

app.post('/auth', async (req, res) => {
    const { username, password } = req.body;
    let user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
        await db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, password]);
    } else if (user.password !== password) {
        return res.send('<script>alert("Invalid Pass");window.location="/login";</script>');
    }
    req.session.user = username;
    res.redirect('/accounts');
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/login'); });

// -------------------------------------------------------------
// 4. Hosting Accounts (Real File Creation)
// -------------------------------------------------------------
app.get('/accounts', requireAuth, async (req, res) => {
    const accs = await db.all('SELECT * FROM accounts WHERE username = ?', [req.session.user]);
    let accCards = accs.map(a => `
        <div class="card" style="display:flex; justify-content:space-between; align-items:center;">
            <div>
                <h3>${a.id}</h3>
                <p>Domain: <a href="http://${a.domain}:${PORT}" target="_blank">${a.domain}</a></p>
            </div>
            <a href="/accounts/${a.id}" class="btn">Manage</a>
        </div>
    `).join('');

    res.send(renderUI('Accounts', `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h2>Your Accounts</h2>
            <a href="/accounts/create" class="btn">+ Create Account</a>
        </div>
        ${accCards || '<p>No accounts created yet.</p>'}
    `, req.session.user));
});

app.get('/accounts/create', requireAuth, (req, res) => {
    res.send(renderUI('Create Account', `
        <div class="card">
            <h2>Create New Subdomain</h2>
            <form action="/accounts/create" method="POST">
                <input type="text" name="subdomain" placeholder="mysite" required>
                <p>.localhost / site.test</p>
                <button class="btn">Create Now</button>
            </form>
        </div>
    `, req.session.user));
});

app.post('/accounts/create', requireAuth, async (req, res) => {
    const accId = 'if0_' + Math.floor(10000000 + Math.random() * 90000000);
    const domain = req.body.subdomain + '.localhost';

    // 1. Create In Database
    await db.run('INSERT INTO accounts VALUES (?, ?, ?, ?)', [accId, req.session.user, domain, new Date().toLocaleDateString()]);

    // 2. Create Real Directory Structure On Server Disk
    const accPath = path.join(USER_HOSTS_DIR, accId, 'htdocs');
    fs.mkdirSync(accPath, { recursive: true });

    // Create Default Live Index Page
    fs.writeFileSync(path.join(accPath, 'index.html'), `
        <!DOCTYPE html>
        <html>
        <head><title>Welcome to ${domain}</title></head>
        <body style="font-family:sans-serif; text-align:center; padding:50px;">
            <h1 style="color:#5856d6;">🚀 ${domain} is Live!</h1>
            <p>Your website files are successfully hosting from <b>htdocs</b> folder.</p>
        </body>
        </html>
    `);

    res.redirect(`/accounts/${accId}`);
});

// -------------------------------------------------------------
// 5. REAL File Manager Logic (Live File Operations)
// -------------------------------------------------------------
app.get('/accounts/:id', requireAuth, async (req, res) => {
    const acc = await db.get('SELECT * FROM accounts WHERE id = ?', [req.params.id]);
    res.send(renderUI('Manage Account', `
        <h2>Account: ${acc.id} (${acc.domain})</h2>
        <div class="card" style="display:flex; gap:15px;">
            <a href="/accounts/${acc.id}/filemanager" class="btn"><i class="fa-solid fa-folder"></i> Live File Manager</a>
            <a href="/accounts/${acc.id}/databases" class="btn"><i class="fa-solid fa-database"></i> Databases</a>
        </div>
    `, req.session.user));
});

// File Manager: List Real Files
app.get('/accounts/:id/filemanager', requireAuth, async (req, res) => {
    const accId = req.params.id;
    const currentSubPath = req.query.path || '';
    const targetDir = path.join(USER_HOSTS_DIR, accId, 'htdocs', currentSubPath);

    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    const files = fs.readdirSync(targetDir);
    let fileListHtml = files.map(f => {
        const fullFilePath = path.join(targetDir, f);
        const isDir = fs.statSync(fullFilePath).isDirectory();
        return `
            <div class="file-item">
                <span><i class="fa-solid ${isDir ? 'fa-folder' : 'fa-file'}"></i> ${f}</span>
                <div>
                    ${!isDir ? `<a href="/accounts/${accId}/filemanager/edit?file=${encodeURIComponent(path.join(currentSubPath, f))}" class="btn" style="padding:4px 8px; font-size:12px;">Edit Code</a>` : ''}
                    <a href="/accounts/${accId}/filemanager/delete?file=${encodeURIComponent(path.join(currentSubPath, f))}" class="btn btn-danger" style="padding:4px 8px; font-size:12px;">Delete</a>
                </div>
            </div>
        `;
    }).join('');

    res.send(renderUI('File Manager', `
        <h2>File Manager - /htdocs/${currentSubPath}</h2>
        <div class="card">
            <h3>Create File in htdocs</h3>
            <form action="/accounts/${accId}/filemanager/create" method="POST" style="display:flex; gap:10px;">
                <input type="text" name="filename" placeholder="index.html or style.css" required>
                <button class="btn">Create File</button>
            </form>
        </div>
        <div class="card">
            <h3>Directory Files</h3>
            <div class="file-list">${fileListHtml || '<p>No files in this folder.</p>'}</div>
        </div>
    `, req.session.user));
});

// File Manager: Create File Live
app.post('/accounts/:id/filemanager/create', requireAuth, (req, res) => {
    const accId = req.params.id;
    const filename = req.body.filename;
    const filePath = path.join(USER_HOSTS_DIR, accId, 'htdocs', filename);

    fs.writeFileSync(filePath, '<!-- New File Created -->');
    res.redirect(`/accounts/${accId}/filemanager`);
});

// File Manager: Real Code Editor
app.get('/accounts/:id/filemanager/edit', requireAuth, (req, res) => {
    const accId = req.params.id;
    const relativePath = req.query.file;
    const fullPath = path.join(USER_HOSTS_DIR, accId, 'htdocs', relativePath);

    const code = fs.readFileSync(fullPath, 'utf8');

    res.send(renderUI('Edit File', `
        <h2>Editing: ${relativePath}</h2>
        <div class="card">
            <form action="/accounts/${accId}/filemanager/save" method="POST">
                <input type="hidden" name="file" value="${relativePath}">
                <textarea name="code" style="height:350px; font-family:monospace; background:#1e1e1e; color:#fff;">${code}</textarea>
                <button class="btn">Save File Code</button>
            </form>
        </div>
    `, req.session.user));
});

// File Manager: Save Code Live
app.post('/accounts/:id/filemanager/save', requireAuth, (req, res) => {
    const accId = req.params.id;
    const relativePath = req.body.file;
    const code = req.body.code;
    const fullPath = path.join(USER_HOSTS_DIR, accId, 'htdocs', relativePath);

    fs.writeFileSync(fullPath, code, 'utf8');
    res.redirect(`/accounts/${accId}/filemanager`);
});

// File Manager: Delete File Live
app.get('/accounts/:id/filemanager/delete', requireAuth, (req, res) => {
    const accId = req.params.id;
    const relativePath = req.query.file;
    const fullPath = path.join(USER_HOSTS_DIR, accId, 'htdocs', relativePath);

    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    res.redirect(`/accounts/${accId}/filemanager`);
});

// -------------------------------------------------------------
// 6. Databases Engine System
// -------------------------------------------------------------
app.get('/accounts/:id/databases', requireAuth, async (req, res) => {
    const accId = req.params.id;
    const dbs = await db.all('SELECT * FROM databases WHERE account_id = ?', [accId]);

    let dbListHtml = dbs.map(d => `<div class="file-item"><span><i class="fa-solid fa-database"></i> ${d.db_name}</span></div>`).join('');

    res.send(renderUI('Databases', `
        <h2>Databases System</h2>
        <div class="card">
            <form action="/accounts/${accId}/databases/create" method="POST" style="display:flex; gap:10px;">
                <input type="text" name="dbname" placeholder="my_shop_db" required>
                <button class="btn">Create Database</button>
            </form>
        </div>
        <div class="card">
            <h3>Active Databases</h3>
            ${dbListHtml || '<p>No databases found.</p>'}
        </div>
    `, req.session.user));
});

app.post('/accounts/:id/databases/create', requireAuth, async (req, res) => {
    const accId = req.params.id;
    const dbName = accId + '_' + req.body.dbname;
    await db.run('INSERT INTO databases (account_id, db_name) VALUES (?, ?)', [accId, dbName]);
    res.redirect(`/accounts/${accId}/databases`);
});

// Server Start
app.listen(PORT, () => {
    console.log(`Live Infinity Hosting Engine Running at http://localhost:${PORT}`);
});
