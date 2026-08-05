const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// -------------------------------------------------------------
// 1. Permanent Storage Initialization Engine
// -------------------------------------------------------------
const DATA_DIR = path.join(__dirname, 'storage_data');
const DB_FILE = path.join(DATA_DIR, 'infinity_db.json');
const HOSTS_DIR = path.join(DATA_DIR, 'user_htdocs');

// Create required directories if they don't exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(HOSTS_DIR)) fs.mkdirSync(HOSTS_DIR, { recursive: true });

// Read or Create Persistent Database File
function loadDatabase() {
    if (!fs.existsSync(DB_FILE)) {
        const initialDB = { users: {}, accounts: {}, databases: {} };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2));
        return initialDB;
    }
    try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(raw);
    } catch (e) {
        return { users: {}, accounts: {}, databases: {} };
    }
}

function saveDatabase(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Global Memory State linked with Permanent Storage
let mainDB = loadDatabase();

// -------------------------------------------------------------
// 2. Middlewares & Server Configurations
// -------------------------------------------------------------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 'infinity_permanent_key_2026',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 7 Days Logged in
}));

const requireAuth = (req, res, next) => {
    if (!req.session.user) return res.redirect('/login');
    next();
};

// -------------------------------------------------------------
// 3. Dynamic Hosted Website Resolver (Executes Hosted HTML/JS)
// -------------------------------------------------------------
app.use((req, res, next) => {
    const host = req.headers.host || '';
    const domain = host.split(':')[0];

    // Check if request is coming for a hosted user subdomain
    let matchedAccount = null;
    for (let u in mainDB.accounts) {
        const found = mainDB.accounts[u].find(a => a.domain === domain);
        if (found) {
            matchedAccount = found;
            break;
        }
    }

    if (matchedAccount) {
        const accPath = path.join(HOSTS_DIR, matchedAccount.id);
        const reqFile = req.path === '/' ? 'index.html' : req.path;
        const targetPath = path.join(accPath, reqFile);

        if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
            return res.sendFile(targetPath);
        } else {
            return res.status(404).send(`
                <div style="font-family:sans-serif; text-align:center; padding:50px;">
                    <h1 style="color:#5856d6;">InfinityFree Site Engine</h1>
                    <h2>404 - Page Not Found</h2>
                    <p>Website is active, but target file does not exist in <b>htdocs</b>.</p>
                </div>
            `);
        }
    }
    next();
});

// UI Layout Function
function renderLayout(title, content, user = null) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - InfinityFree Live Engine</title>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            body { background: #f4f6f9; color: #333; }
            header { background: #fff; padding: 15px 30px; display: flex; justify-content: space-between; border-bottom: 1px solid #ddd; }
            .logo { font-size: 22px; font-weight: bold; color: #5856d6; text-decoration: none; }
            .container { max-width: 950px; margin: 25px auto; padding: 0 15px; }
            .card { background: #fff; border-radius: 8px; border: 1px solid #e1e4e8; padding: 20px; margin-bottom: 20px; }
            .btn { background: #5856d6; color: white; padding: 8px 16px; border: none; border-radius: 5px; text-decoration: none; cursor: pointer; font-weight: bold; display: inline-flex; align-items: center; gap: 8px; font-size: 14px; }
            .btn:hover { background: #4543c7; }
            .btn-danger { background: #e74c3c; }
            .btn-outline { background: transparent; border: 1px solid #5856d6; color: #5856d6; }
            input, select, textarea { width: 100%; padding: 10px; margin: 8px 0; border: 1px solid #ccc; border-radius: 5px; box-sizing: border-box; }
            .item-row { display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #eee; }
            .item-row:last-child { border: none; }
            .grid-actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-top: 15px; }
            .action-box { text-align: center; border: 1px solid #e1e4e8; padding: 15px; border-radius: 8px; text-decoration: none; color: #333; font-weight: bold; }
            .action-box:hover { border-color: #5856d6; background: #fafafa; }
            .action-box i { font-size: 22px; color: #5856d6; margin-bottom: 8px; display: block; }
        </style>
    </head>
    <body>
        <header>
            <a href="/accounts" class="logo"><i class="fa-solid fa-infinity"></i> InfinityFree</a>
            <div>
                ${user ? `<span><i class="fa-solid fa-user"></i> <b>${user}</b></span> | <a href="/logout" style="color:#e74c3c; text-decoration:none; margin-left:10px;">Logout</a>` : ''}
            </div>
        </header>
        <div class="container">${content}</div>
    </body>
    </html>`;
}

// -------------------------------------------------------------
// 4. Authentication Routes
// -------------------------------------------------------------
app.get('/', (req, res) => res.redirect('/accounts'));

app.get('/login', (req, res) => {
    res.send(renderLayout('Login', `
        <div class="card" style="max-width:380px; margin:40px auto;">
            <h2 style="margin-bottom:15px; text-align:center;">Sign In / Sign Up</h2>
            <form action="/auth" method="POST">
                <label>Username</label>
                <input type="text" name="username" placeholder="Enter username" required>
                <label>Password</label>
                <input type="password" name="password" placeholder="Enter password" required>
                <button type="submit" class="btn" style="width:100%; margin-top:10px; justify-content:center;">Continue to Panel</button>
            </form>
        </div>
    `));
});

app.post('/auth', (req, res) => {
    const { username, password } = req.body;
    
    if (!mainDB.users[username]) {
        // Auto-Register user
        mainDB.users[username] = { password };
        mainDB.accounts[username] = [];
        mainDB.databases[username] = [];
        saveDatabase(mainDB);
    } else if (mainDB.users[username].password !== password) {
        return res.send('<script>alert("Incorrect Password!"); window.location="/login";</script>');
    }

    req.session.user = username;
    res.redirect('/accounts');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// -------------------------------------------------------------
// 5. Account Management Center
// -------------------------------------------------------------
app.get('/accounts', requireAuth, (req, res) => {
    const username = req.session.user;
    const userAccs = mainDB.accounts[username] || [];

    let accCardsHtml = userAccs.map(acc => `
        <div class="card" style="display:flex; justify-content:space-between; align-items:center;">
            <div>
                <h3 style="color:#5856d6;"><i class="fa-solid fa-globe"></i> ${acc.id}</h3>
                <p style="font-size:14px; color:#666; margin-top:4px;">Domain: <b>${acc.domain}</b></p>
                <small style="color:#2ecc71;">Status: Active</small>
            </div>
            <a href="/accounts/${acc.id}" class="btn"><i class="fa-solid fa-gear"></i> Control Panel</a>
        </div>
    `).join('');

    const content = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <h2>Hosting Accounts</h2>
            <a href="/accounts/create" class="btn"><i class="fa-solid fa-plus"></i> Create Account</a>
        </div>
        ${accCardsHtml || '<div class="card"><p>No active hosting accounts found. Click "Create Account" to host your website.</p></div>'}
    `;
    res.send(renderLayout('Dashboard', content, username));
});

app.get('/accounts/create', requireAuth, (req, res) => {
    res.send(renderLayout('Create Account', `
        <div class="card" style="max-width:500px; margin:auto;">
            <h2>Create New Subdomain Account</h2>
            <form action="/accounts/create" method="POST" style="margin-top:15px;">
                <label>Subdomain Prefix</label>
                <input type="text" name="subdomain" placeholder="e.g. my-shop" required>
                <label>Domain Extension</label>
                <select name="extension">
                    <option value=".site.je">.site.je</option>
                    <option value=".great-site.net">.great-site.net</option>
                    <option value=".infinityfreeapp.com">.infinityfreeapp.com</option>
                </select>
                <button type="submit" class="btn" style="width:100%; margin-top:15px; justify-content:center;">Create Hosting Account</button>
            </form>
        </div>
    `, req.session.user));
});

app.post('/accounts/create', requireAuth, (req, res) => {
    const username = req.session.user;
    const { subdomain, extension } = req.body;
    const fullDomain = subdomain + extension;
    const accId = 'if0_' + Math.floor(10000000 + Math.random() * 90000000);

    const newAcc = {
        id: accId,
        domain: fullDomain,
        created: new Date().toISOString().split('T')[0]
    };

    if (!mainDB.accounts[username]) mainDB.accounts[username] = [];
    mainDB.accounts[username].push(newAcc);

    // Create Physical Folder for User Files
    const userHtdocsPath = path.join(HOSTS_DIR, accId);
    if (!fs.existsSync(userHtdocsPath)) fs.mkdirSync(userHtdocsPath, { recursive: true });

    // Create Initial Live index.html File
    const indexCode = `<!DOCTYPE html>
<html>
<head>
    <title>Welcome to ${fullDomain}</title>
</head>
<body style="font-family:sans-serif; text-align:center; padding:50px;">
    <h1 style="color:#5856d6;">🚀 Your Website is Live!</h1>
    <p>Account ID: <b>${accId}</b></p>
    <p>Edit this page inside File Manager in your Control Panel.</p>
</body>
</html>`;
    fs.writeFileSync(path.join(userHtdocsPath, 'index.html'), indexCode, 'utf8');

    // Save Persistent DB
    saveDatabase(mainDB);

    res.redirect(`/accounts/${accId}`);
});

// -------------------------------------------------------------
// 6. Account Control Center (File Manager & DB Management)
// -------------------------------------------------------------
app.get('/accounts/:id', requireAuth, (req, res) => {
    const username = req.session.user;
    const acc = (mainDB.accounts[username] || []).find(a => a.id === req.params.id);

    if (!acc) return res.redirect('/accounts');

    const content = `
        <div style="margin-bottom:20px;">
            <a href="/accounts" style="color:#5856d6; text-decoration:none;"><i class="fa-solid fa-arrow-left"></i> Back to Accounts</a>
            <h2 style="margin-top:10px;">${acc.id} - (${acc.domain})</h2>
        </div>

        <div class="card">
            <h3>Account Tools</h3>
            <div class="grid-actions">
                <a href="/accounts/${acc.id}/filemanager" class="action-box"><i class="fa-solid fa-folder-open"></i> File Manager</a>
                <a href="/accounts/${acc.id}/databases" class="action-box"><i class="fa-solid fa-database"></i> MySQL Databases</a>
            </div>
        </div>

        <div class="card">
            <h3>Account Details</h3>
            <div class="item-row"><span>Account Username:</span> <b>${acc.id}</b></div>
            <div class="item-row"><span>Main Domain:</span> <b>${acc.domain}</b></div>
            <div class="item-row"><span>Creation Date:</span> <b>${acc.created}</b></div>
        </div>
    `;
    res.send(renderLayout('Control Panel', content, username));
});

// REAL LIVE FILE MANAGER
app.get('/accounts/:id/filemanager', requireAuth, (req, res) => {
    const username = req.session.user;
    const accId = req.params.id;
    const accPath = path.join(HOSTS_DIR, accId);

    if (!fs.existsSync(accPath)) fs.mkdirSync(accPath, { recursive: true });

    const files = fs.readdirSync(accPath);

    let fileListHtml = files.map(file => `
        <div class="item-row">
            <span><i class="fa-solid fa-file-code" style="color:#5856d6; margin-right:8px;"></i> ${file}</span>
            <div>
                <a href="/accounts/${accId}/filemanager/edit?file=${encodeURIComponent(file)}" class="btn btn-outline" style="padding:4px 8px; font-size:12px;">Edit Code</a>
                <a href="/accounts/${accId}/filemanager/delete?file=${encodeURIComponent(file)}" class="btn btn-danger" style="padding:4px 8px; font-size:12px;" onclick="return confirm('Delete File?')">Delete</a>
            </div>
        </div>
    `).join('');

    const content = `
        <div style="margin-bottom:20px;">
            <a href="/accounts/${accId}" style="color:#5856d6; text-decoration:none;"><i class="fa-solid fa-arrow-left"></i> Back to Control Panel</a>
            <h2 style="margin-top:10px;">File Manager (/htdocs)</h2>
        </div>

        <div class="card">
            <h3>Create File</h3>
            <form action="/accounts/${accId}/filemanager/create" method="POST" style="display:flex; gap:10px;">
                <input type="text" name="filename" placeholder="about.html, style.css, script.js" required>
                <button type="submit" class="btn">Create File</button>
            </form>
        </div>

        <div class="card">
            <h3>File Directory</h3>
            <div>${fileListHtml || '<p style="color:#777;">No files created yet.</p>'}</div>
        </div>
    `;
    res.send(renderLayout('File Manager', content, username));
});

// FILE MANAGER OPERATIONS (CREATE, EDIT, SAVE, DELETE)
app.post('/accounts/:id/filemanager/create', requireAuth, (req, res) => {
    const accId = req.params.id;
    const filename = req.body.filename;
    const filePath = path.join(HOSTS_DIR, accId, filename);

    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '<!-- New Code File -->', 'utf8');
    }
    res.redirect(`/accounts/${accId}/filemanager`);
});

app.get('/accounts/:id/filemanager/edit', requireAuth, (req, res) => {
    const username = req.session.user;
    const accId = req.params.id;
    const filename = req.query.file;
    const filePath = path.join(HOSTS_DIR, accId, filename);

    let fileContent = '';
    if (fs.existsSync(filePath)) {
        fileContent = fs.readFileSync(filePath, 'utf8');
    }

    const content = `
        <h2>Editing File: ${filename}</h2>
        <div class="card">
            <form action="/accounts/${accId}/filemanager/save" method="POST">
                <input type="hidden" name="filename" value="${filename}">
                <textarea name="code" style="height:400px; font-family:monospace; background:#1e1e1e; color:#00ff66; padding:15px; font-size:14px; line-height:1.4;">${fileContent}</textarea>
                <button type="submit" class="btn" style="margin-top:10px;"><i class="fa-solid fa-floppy-disk"></i> Save Code Live</button>
            </form>
        </div>
    `;
    res.send(renderLayout('Code Editor', content, username));
});

app.post('/accounts/:id/filemanager/save', requireAuth, (req, res) => {
    const accId = req.params.id;
    const { filename, code } = req.body;
    const filePath = path.join(HOSTS_DIR, accId, filename);

    fs.writeFileSync(filePath, code, 'utf8');
    res.redirect(`/accounts/${accId}/filemanager`);
});

app.get('/accounts/:id/filemanager/delete', requireAuth, (req, res) => {
    const accId = req.params.id;
    const filename = req.query.file;
    const filePath = path.join(HOSTS_DIR, accId, filename);

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
    res.redirect(`/accounts/${accId}/filemanager`);
});

// DATABASES ENGINE
app.get('/accounts/:id/databases', requireAuth, (req, res) => {
    const username = req.session.user;
    const accId = req.params.id;
    const userDbs = (mainDB.databases[username] || []).filter(d => d.accountId === accId);

    let dbListHtml = userDbs.map(d => `
        <div class="item-row">
            <span><i class="fa-solid fa-database" style="color:#5856d6; margin-right:8px;"></i> ${d.dbName}</span>
            <small style="color:#777;">MySQL Host: sql305.infinityfree.com</small>
        </div>
    `).join('');

    const content = `
        <div style="margin-bottom:20px;">
            <a href="/accounts/${accId}" style="color:#5856d6; text-decoration:none;"><i class="fa-solid fa-arrow-left"></i> Back to Control Panel</a>
            <h2 style="margin-top:10px;">MySQL Databases</h2>
        </div>

        <div class="card">
            <h3>Create Database</h3>
            <form action="/accounts/${accId}/databases/create" method="POST" style="display:flex; gap:10px;">
                <input type="text" name="dbname" placeholder="database_name" required>
                <button type="submit" class="btn">Create Database</button>
            </form>
        </div>

        <div class="card">
            <h3>Your Databases</h3>
            <div>${dbListHtml || '<p style="color:#777;">No database created yet.</p>'}</div>
        </div>
    `;
    res.send(renderLayout('Databases', content, username));
});

app.post('/accounts/:id/databases/create', requireAuth, (req, res) => {
    const username = req.session.user;
    const accId = req.params.id;
    const dbName = accId + '_' + req.body.dbname;

    if (!mainDB.databases[username]) mainDB.databases[username] = [];
    mainDB.databases[username].push({ accountId: accId, dbName: dbName });

    saveDatabase(mainDB);
    res.redirect(`/accounts/${accId}/databases`);
});

// -------------------------------------------------------------
// 7. Server Start
// -------------------------------------------------------------
app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});
