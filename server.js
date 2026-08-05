const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// -------------------------------------------------------------
// 1. Permanent Persistence Storage (Anti-Deletion Engine)
// -------------------------------------------------------------
const STORAGE_FILE = path.join(__dirname, 'infinity_persistent_store.json');

// Auto Load Data from Disk File
function loadData() {
    if (fs.existsSync(STORAGE_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'));
        } catch (e) {
            console.error("Storage Load Error, resetting...", e);
        }
    }
    return { users: {}, accounts: {}, files: {}, databases: {} };
}

// Auto Save Data Immediately on Change
function saveData(data) {
    try {
        fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error("Storage Save Error:", e);
    }
}

// System Database Instance
let db = loadData();

// -------------------------------------------------------------
// 2. Middlewares & Configuration
// -------------------------------------------------------------
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));

app.use(session({
    secret: 'infinity_superfast_secret_key_2026',
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 Days Persistent Session
}));

const requireAuth = (req, res, next) => {
    if (!req.session.user) return res.redirect('/login');
    next();
};

// -------------------------------------------------------------
// 3. Dynamic Multi-Domain Hosting Engine (.com, .in, .site, etc)
// -------------------------------------------------------------
app.use((req, res, next) => {
    const host = (req.headers.host || '').split(':')[0].toLowerCase();

    // Check if domain is registered in system
    let targetAccount = null;
    for (let u in db.accounts) {
        let found = db.accounts[u].find(a => a.domain.toLowerCase() === host);
        if (found) {
            targetAccount = found;
            break;
        }
    }

    if (targetAccount) {
        const reqPath = req.path === '/' ? 'index.html' : req.path.replace('/', '');
        const fileKey = `${targetAccount.id}/${reqPath}`;

        if (db.files[fileKey]) {
            const fileData = db.files[fileKey];
            if (reqPath.endsWith('.css')) res.setHeader('Content-Type', 'text/css');
            else if (reqPath.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript');
            else if (reqPath.endsWith('.html')) res.setHeader('Content-Type', 'text/html');

            return res.send(fileData);
        } else if (db.files[`${targetAccount.id}/index.html`]) {
            res.setHeader('Content-Type', 'text/html');
            return res.send(db.files[`${targetAccount.id}/index.html`]);
        } else {
            return res.status(404).send(`
                <div style="font-family:sans-serif; text-align:center; padding:50px;">
                    <h1 style="color:#5856d6;">InfinityFree Site Engine</h1>
                    <h2>404 - File Not Found</h2>
                    <p>Upload index.html file in your File Manager to activate <b>${host}</b>.</p>
                </div>
            `);
        }
    }
    next();
});

// UI Layout Template
function renderLayout(title, content, user = null) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - InfinityFree Dashboard</title>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            body { background: #f4f6f9; color: #333; }
            header { background: #fff; padding: 15px 30px; display: flex; justify-content: space-between; border-bottom: 1px solid #ddd; }
            .logo { font-size: 22px; font-weight: bold; color: #5856d6; text-decoration: none; }
            .container { max-width: 950px; margin: 25px auto; padding: 0 15px; }
            .card { background: #fff; border-radius: 8px; border: 1px solid #e1e4e8; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
            .btn { background: #5856d6; color: white; padding: 9px 18px; border: none; border-radius: 6px; text-decoration: none; cursor: pointer; font-weight: bold; display: inline-flex; align-items: center; gap: 8px; font-size: 14px; }
            .btn:hover { background: #4543c7; }
            .btn-danger { background: #e74c3c; }
            .btn-outline { background: transparent; border: 1px solid #5856d6; color: #5856d6; }
            input, select, textarea { width: 100%; padding: 10px; margin: 8px 0; border: 1px solid #ccc; border-radius: 6px; box-sizing: border-box; }
            .item-row { display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #eee; }
            .item-row:last-child { border: none; }
            .grid-actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-top: 15px; }
            .action-box { text-align: center; border: 1px solid #e1e4e8; padding: 15px; border-radius: 8px; text-decoration: none; color: #333; font-weight: bold; }
            .action-box:hover { border-color: #5856d6; background: #fafafa; }
            .action-box i { font-size: 24px; color: #5856d6; margin-bottom: 8px; display: block; }
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
// 4. Auth System (Persistent Account Saving)
// -------------------------------------------------------------
app.get('/', (req, res) => res.redirect('/accounts'));

app.get('/login', (req, res) => {
    res.send(renderLayout('Login', `
        <div class="card" style="max-width:380px; margin:40px auto;">
            <h2 style="margin-bottom:15px; text-align:center;">Sign In / Sign Up</h2>
            <form action="/auth" method="POST">
                <label>Username</label>
                <input type="text" name="username" placeholder="Username" required>
                <label>Password</label>
                <input type="password" name="password" placeholder="Password" required>
                <button type="submit" class="btn" style="width:100%; margin-top:10px; justify-content:center;">Access Dashboard</button>
            </form>
        </div>
    `));
});

app.post('/auth', (req, res) => {
    const { username, password } = req.body;
    
    if (!db.users[username]) {
        // Create user permanently
        db.users[username] = { password };
        db.accounts[username] = [];
        db.databases[username] = [];
        saveData(db);
    } else if (db.users[username].password !== password) {
        return res.send('<script>alert("Wrong Password!"); window.location="/login";</script>');
    }

    req.session.user = username;
    res.redirect('/accounts');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// -------------------------------------------------------------
// 5. Hosting Accounts Engine (.com, .in, .site Domain Choice)
// -------------------------------------------------------------
app.get('/accounts', requireAuth, (req, res) => {
    const username = req.session.user;
    const userAccs = db.accounts[username] || [];

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
        ${accCardsHtml || '<div class="card"><p>No accounts found. Click "Create Account" to host your website with custom TLDs.</p></div>'}
    `;
    res.send(renderLayout('Dashboard', content, username));
});

app.get('/accounts/create', requireAuth, (req, res) => {
    res.send(renderLayout('Create Account', `
        <div class="card" style="max-width:500px; margin:auto;">
            <h2>Create Website Account</h2>
            <form action="/accounts/create" method="POST" style="margin-top:15px;">
                <label>Subdomain / Website Name</label>
                <input type="text" name="subdomain" placeholder="e.g. myshop" required>
                
                <label>Domain Extension (TLD)</label>
                <select name="extension">
                    <option value=".com">.com (Commercial Domain)</option>
                    <option value=".in">.in (India Domain)</option>
                    <option value=".site">.site (Web Site Domain)</option>
                    <option value=".site.je">.site.je (Free Subdomain)</option>
                    <option value=".great-site.net">.great-site.net</option>
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

    if (!db.accounts[username]) db.accounts[username] = [];
    db.accounts[username].push(newAcc);

    // Initial Live index.html Code
    const defaultCode = `<!DOCTYPE html>
<html>
<head>
    <title>Welcome to ${fullDomain}</title>
</head>
<body style="font-family:sans-serif; text-align:center; padding:50px; background:#f4f6f9;">
    <h1 style="color:#5856d6;">🚀 Website ${fullDomain} is Live!</h1>
    <p>Host ID: <b>${accId}</b></p>
    <p>Open File Manager in Control Panel to edit this website code live.</p>
</body>
</html>`;

    // Save default index.html directly into Database (Instant Saving)
    db.files[`${accId}/index.html`] = defaultCode;
    saveData(db);

    res.redirect(`/accounts/${accId}`);
});

// -------------------------------------------------------------
// 6. Account Control Panel & Lightning File Manager
// -------------------------------------------------------------
app.get('/accounts/:id', requireAuth, (req, res) => {
    const username = req.session.user;
    const acc = (db.accounts[username] || []).find(a => a.id === req.params.id);

    if (!acc) return res.redirect('/accounts');

    const content = `
        <div style="margin-bottom:20px;">
            <a href="/accounts" style="color:#5856d6; text-decoration:none;"><i class="fa-solid fa-arrow-left"></i> Back to Accounts</a>
            <h2 style="margin-top:10px;">${acc.id} - (${acc.domain})</h2>
        </div>

        <div class="card">
            <h3>Account Tools</h3>
            <div class="grid-actions">
                <a href="/accounts/${acc.id}/filemanager" class="action-box"><i class="fa-solid fa-folder-open"></i> Live File Manager</a>
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

// INSTANT FILE MANAGER
app.get('/accounts/:id/filemanager', requireAuth, (req, res) => {
    const username = req.session.user;
    const accId = req.params.id;

    // Filter files for this account
    let accountFiles = Object.keys(db.files).filter(k => k.startsWith(`${accId}/`));

    let fileListHtml = accountFiles.map(fileKey => {
        let fileName = fileKey.replace(`${accId}/`, '');
        return `
            <div class="item-row">
                <span><i class="fa-solid fa-file-code" style="color:#5856d6; margin-right:8px;"></i> ${fileName}</span>
                <div>
                    <a href="/accounts/${accId}/filemanager/edit?file=${encodeURIComponent(fileName)}" class="btn btn-outline" style="padding:4px 8px; font-size:12px;">Edit Code</a>
                    <a href="/accounts/${accId}/filemanager/delete?file=${encodeURIComponent(fileName)}" class="btn btn-danger" style="padding:4px 8px; font-size:12px;" onclick="return confirm('Delete File?')">Delete</a>
                </div>
            </div>
        `;
    }).join('');

    const content = `
        <div style="margin-bottom:20px;">
            <a href="/accounts/${accId}" style="color:#5856d6; text-decoration:none;"><i class="fa-solid fa-arrow-left"></i> Back to Control Panel</a>
            <h2 style="margin-top:10px;">File Manager (/htdocs)</h2>
        </div>

        <div class="card">
            <h3>Create New File</h3>
            <form action="/accounts/${accId}/filemanager/create" method="POST" style="display:flex; gap:10px;">
                <input type="text" name="filename" placeholder="index.html, style.css, script.js" required>
                <button type="submit" class="btn">Create File</button>
            </form>
        </div>

        <div class="card">
            <h3>Files in htdocs</h3>
            <div>${fileListHtml || '<p style="color:#777;">No files created yet.</p>'}</div>
        </div>
    `;
    res.send(renderLayout('File Manager', content, username));
});

// FILE CREATE, EDIT, SAVE, DELETE
app.post('/accounts/:id/filemanager/create', requireAuth, (req, res) => {
    const accId = req.params.id;
    const filename = req.body.filename;
    const key = `${accId}/${filename}`;

    if (!db.files[key]) {
        db.files[key] = '<!-- Code Here -->';
        saveData(db);
    }
    res.redirect(`/accounts/${accId}/filemanager`);
});

app.get('/accounts/:id/filemanager/edit', requireAuth, (req, res) => {
    const username = req.session.user;
    const accId = req.params.id;
    const filename = req.query.file;
    const key = `${accId}/${filename}`;

    let code = db.files[key] || '';

    const content = `
        <h2>Editing: ${filename}</h2>
        <div class="card">
            <form action="/accounts/${accId}/filemanager/save" method="POST">
                <input type="hidden" name="filename" value="${filename}">
                <textarea name="code" style="height:420px; font-family:monospace; background:#1e1e1e; color:#00ff66; padding:15px; font-size:14px; line-height:1.4;">${code}</textarea>
                <button type="submit" class="btn" style="margin-top:10px;"><i class="fa-solid fa-floppy-disk"></i> Save Code Live</button>
            </form>
        </div>
    `;
    res.send(renderLayout('Code Editor', content, username));
});

app.post('/accounts/:id/filemanager/save', requireAuth, (req, res) => {
    const accId = req.params.id;
    const { filename, code } = req.body;
    const key = `${accId}/${filename}`;

    db.files[key] = code;
    saveData(db);

    res.redirect(`/accounts/${accId}/filemanager`);
});

app.get('/accounts/:id/filemanager/delete', requireAuth, (req, res) => {
    const accId = req.params.id;
    const filename = req.query.file;
    const key = `${accId}/${filename}`;

    delete db.files[key];
    saveData(db);

    res.redirect(`/accounts/${accId}/filemanager`);
});

// -------------------------------------------------------------
// 7. MySQL Databases System
// -------------------------------------------------------------
app.get('/accounts/:id/databases', requireAuth, (req, res) => {
    const username = req.session.user;
    const accId = req.params.id;
    const userDbs = (db.databases[username] || []).filter(d => d.accountId === accId);

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
            <h3>Active Databases</h3>
            <div>${dbListHtml || '<p style="color:#777;">No database created yet.</p>'}</div>
        </div>
    `;
    res.send(renderLayout('Databases', content, username));
});

app.post('/accounts/:id/databases/create', requireAuth, (req, res) => {
    const username = req.session.user;
    const accId = req.params.id;
    const dbName = accId + '_' + req.body.dbname;

    if (!db.databases[username]) db.databases[username] = [];
    db.databases[username].push({ accountId: accId, dbName: dbName });

    saveData(db);
    res.redirect(`/accounts/${accId}/databases`);
});

// -------------------------------------------------------------
// 8. Server Engine Start
// -------------------------------------------------------------
app.listen(PORT, () => {
    console.log(`Infinity Server Running SuperFast at http://localhost:${PORT}`);
});
