const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// -------------------------------------------------------------
// 1. Storage & Persistence Engine
// -------------------------------------------------------------
const STORAGE_FILE = path.join(__dirname, 'infinity_persistent_store.json');

function loadData() {
    if (fs.existsSync(STORAGE_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'));
        } catch (e) {
            console.error("Storage Load Error...", e);
        }
    }
    return { users: {}, accounts: {}, files: {}, databases: {}, otps: {} };
}

function saveData(data) {
    try {
        fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error("Storage Save Error:", e);
    }
}

let db = loadData();

// -------------------------------------------------------------
// 2. Middlewares & Configurations
// -------------------------------------------------------------
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));

app.use(session({
    secret: 'infinity_superfast_secret_key_2026',
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }
}));

const requireAuth = (req, res, next) => {
    if (!req.session.user) return res.redirect('/login');
    next();
};

// Helper: Count accounts per Gmail
function getAccountsByEmail(email) {
    let count = 0;
    for (let user in db.users) {
        if (db.users[user].email === email) {
            count += (db.accounts[user] || []).length;
        }
    }
    return count;
}

// -------------------------------------------------------------
// 3. Dynamic Hosting Engine
// -------------------------------------------------------------
app.use((req, res, next) => {
    const host = (req.headers.host || '').split(':')[0].toLowerCase();

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
                    <p>Upload index.html in File Manager to activate <b>${host}</b>.</p>
                </div>
            `);
        }
    }
    next();
});

// UI Layout Engine
function renderLayout(title, content, user = null) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - InfinityFree</title>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            body { background: #f4f6f9; color: #333; }
            header { background: #fff; padding: 15px 30px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e1e4e8; }
            .logo { font-size: 22px; font-weight: bold; color: #5856d6; text-decoration: none; }
            .container { max-width: 950px; margin: 30px auto; padding: 0 15px; }
            .card { background: #fff; border-radius: 8px; border: 1px solid #e1e4e8; padding: 25px; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.03); }
            .btn { background: #5856d6; color: white; padding: 10px 18px; border: none; border-radius: 6px; text-decoration: none; cursor: pointer; font-weight: bold; display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-size: 14px; }
            .btn:hover { background: #4543c7; }
            .btn-danger { background: #e74c3c; }
            .btn-outline { background: transparent; border: 1px solid #5856d6; color: #5856d6; }
            input, select, textarea { width: 100%; padding: 11px; margin: 8px 0 16px 0; border: 1px solid #ccc; border-radius: 6px; font-size: 14px; }
            .item-row { display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #eee; }
            .item-row:last-child { border: none; }
            .grid-actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-top: 15px; }
            .action-box { text-align: center; border: 1px solid #e1e4e8; padding: 15px; border-radius: 8px; text-decoration: none; color: #333; font-weight: bold; }
            .action-box:hover { border-color: #5856d6; background: #fafafa; }
            .action-box i { font-size: 24px; color: #5856d6; margin-bottom: 8px; display: block; }
            .auth-toggle { text-align: center; margin-top: 15px; font-size: 14px; color: #666; }
            .auth-toggle a { color: #5856d6; font-weight: bold; text-decoration: none; }
            .badge { background: #eef2ff; color: #5856d6; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        </style>
    </head>
    <body>
        <header>
            <a href="/accounts" class="logo"><i class="fa-solid fa-infinity"></i> InfinityFree</a>
            <div>
                ${user ? `<span><i class="fa-solid fa-user"></i> <b>${user}</b></span> | <a href="/logout" style="color:#e74c3c; text-decoration:none; margin-left:10px; font-weight:bold;">Logout</a>` : `
                    <a href="/login" class="btn btn-outline" style="padding:6px 14px; font-size:13px; margin-right:5px;">Sign In</a>
                    <a href="/signup" class="btn" style="padding:6px 14px; font-size:13px;">Sign Up</a>
                `}
            </div>
        </header>
        <div class="container">${content}</div>
    </body>
    </html>`;
}

// -------------------------------------------------------------
// 4. Auth System (Separate Login & Signup + Gmail Limit Engine)
// -------------------------------------------------------------
app.get('/', (req, res) => res.redirect('/accounts'));

// LOGIN PAGE
app.get('/login', (req, res) => {
    res.send(renderLayout('Sign In', `
        <div class="card" style="max-width:400px; margin:40px auto;">
            <h2 style="margin-bottom:20px; text-align:center; color:#5856d6;"><i class="fa-solid fa-right-to-bracket"></i> Sign In to Infinity</h2>
            <form action="/login" method="POST">
                <label>Username or Email</label>
                <input type="text" name="identity" placeholder="Enter username or Gmail" required>
                
                <label>Password</label>
                <input type="password" name="password" placeholder="Enter password" required>
                
                <button type="submit" class="btn" style="width:100%;">Sign In</button>
            </form>
            <div class="auth-toggle">
                Don't have an account? <a href="/signup">Create One Now</a>
            </div>
        </div>
    `));
});

app.post('/login', (req, res) => {
    const { identity, password } = req.body;
    let foundUser = null;

    // Direct Username Check or Gmail Match
    for (let u in db.users) {
        if ((u === identity || db.users[u].email === identity) && db.users[u].password === password) {
            foundUser = u;
            break;
        }
    }

    if (foundUser) {
        req.session.user = foundUser;
        return res.redirect('/accounts');
    }

    res.send('<script>alert("Invalid Username/Gmail or Password!"); window.location="/login";</script>');
});

// SIGNUP PAGE
app.get('/signup', (req, res) => {
    res.send(renderLayout('Sign Up', `
        <div class="card" style="max-width:420px; margin:30px auto;">
            <h2 style="margin-bottom:10px; text-align:center; color:#5856d6;"><i class="fa-solid fa-user-plus"></i> Create Account</h2>
            <p style="font-size:13px; color:#666; text-align:center; margin-bottom:20px;">Register with your Gmail (Max 8 hosting accounts per Gmail)</p>
            
            <form action="/signup" method="POST">
                <label>Username</label>
                <input type="text" name="username" placeholder="Choose unique username" required>

                <label>Gmail Address</label>
                <input type="email" name="email" placeholder="example@gmail.com" required>

                <label>Password</label>
                <input type="password" name="password" placeholder="Create password" required>

                <button type="submit" class="btn" style="width:100%;">Get OTP Verification Code</button>
            </form>
            <div class="auth-toggle">
                Already have an account? <a href="/login">Sign In</a>
            </div>
        </div>
    `));
});

app.post('/signup', (req, res) => {
    const { username, email, password } = req.body;

    if (!email.toLowerCase().endsWith('@gmail.com')) {
        return res.send('<script>alert("Please enter a valid Gmail address (@gmail.com)!"); window.location="/signup";</script>');
    }

    if (db.users[username]) {
        return res.send('<script>alert("Username already taken!"); window.location="/signup";</script>');
    }

    // Check Account Limit per Gmail (Max 8 Hosting Accounts)
    let totalAccsOnEmail = getAccountsByEmail(email);
    if (totalAccsOnEmail >= 8) {
        return res.send('<script>alert("Limit Exceeded! You already have 8 accounts linked to this Gmail."); window.location="/signup";</script>');
    }

    // Generate 6-digit OTP Demo Code
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    db.otps[username] = { email, password, otp: generatedOtp };
    saveData(db);

    res.redirect(`/verify-otp?user=${username}`);
});

// OTP VERIFICATION PAGE
app.get('/verify-otp', (req, res) => {
    const username = req.query.user;
    const tempUser = db.otps[username];

    if (!tempUser) return res.redirect('/signup');

    res.send(renderLayout('Verify OTP', `
        <div class="card" style="max-width:400px; margin:40px auto;">
            <h2 style="margin-bottom:10px; text-align:center; color:#5856d6;"><i class="fa-solid fa-shield-halved"></i> Verify Gmail</h2>
            <p style="font-size:13px; color:#666; text-align:center; margin-bottom:15px;">OTP sent to <b>${tempUser.email}</b></p>
            
            <div style="background:#eef2ff; border:1px dashed #5856d6; padding:10px; border-radius:6px; text-align:center; font-weight:bold; font-size:16px; color:#5856d6; margin-bottom:15px;">
                Your Verification OTP: <span style="font-size:20px; letter-spacing:2px;">${tempUser.otp}</span>
            </div>

            <form action="/verify-otp" method="POST">
                <input type="hidden" name="username" value="${username}">
                <label>Enter 6-Digit OTP</label>
                <input type="text" name="otp" placeholder="Enter OTP code" required style="text-align:center; font-size:18px; letter-spacing:4px;">
                <button type="submit" class="btn" style="width:100%;">Verify & Activate</button>
            </form>
        </div>
    `));
});

app.post('/verify-otp', (req, res) => {
    const { username, otp } = req.body;
    const tempUser = db.otps[username];

    if (tempUser && tempUser.otp === otp) {
        // Complete Registration
        db.users[username] = {
            email: tempUser.email,
            password: tempUser.password,
            created: new Date().toISOString()
        };
        db.accounts[username] = [];
        db.databases[username] = [];
        delete db.otps[username];

        saveData(db);

        req.session.user = username;
        return res.redirect('/accounts');
    }

    res.send('<script>alert("Invalid OTP Code!"); window.location="/signup";</script>');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// -------------------------------------------------------------
// 5. Hosting Accounts Engine (.com, .in, .site, etc)
// -------------------------------------------------------------
app.get('/accounts', requireAuth, (req, res) => {
    const username = req.session.user;
    const userAccs = db.accounts[username] || [];
    const userEmail = db.users[username]?.email || 'N/A';
    const emailAccountCount = getAccountsByEmail(userEmail);

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
        <div class="card" style="display:flex; justify-content:space-between; align-items:center; background:#fafafa;">
            <div>
                <p style="font-size:14px; color:#666;">Linked Gmail: <b>${userEmail}</b></p>
                <small style="color:#5856d6; font-weight:bold;">Gmail Account Usage: ${emailAccountCount} / 8 Accounts Used</small>
            </div>
            <span class="badge">Infinity Pro Engine</span>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <h2>Hosting Accounts</h2>
            <a href="/accounts/create" class="btn"><i class="fa-solid fa-plus"></i> Create Account</a>
        </div>
        ${accCardsHtml || '<div class="card"><p>No accounts created yet. Click "Create Account" to host your website with custom TLDs.</p></div>'}
    `;
    res.send(renderLayout('Dashboard', content, username));
});

app.get('/accounts/create', requireAuth, (req, res) => {
    const username = req.session.user;
    const userEmail = db.users[username]?.email;
    const totalAccs = getAccountsByEmail(userEmail);

    if (totalAccs >= 8) {
        return res.send(renderLayout('Limit Exceeded', `
            <div class="card" style="text-align:center; padding:40px;">
                <h2 style="color:#e74c3c;">Account Limit Reached (8/8)</h2>
                <p style="margin:15px 0; color:#666;">You have reached the maximum allowed limit of 8 hosting accounts for Gmail <b>${userEmail}</b>.</p>
                <a href="/accounts" class="btn">Back to Dashboard</a>
            </div>
        `, username));
    }

    res.send(renderLayout('Create Account', `
        <div class="card" style="max-width:500px; margin:auto;">
            <h2>Create Hosting Account</h2>
            <p style="font-size:13px; color:#666; margin-bottom:15px;">Gmail Account Count: ${totalAccs}/8 Used</p>
            
            <form action="/accounts/create" method="POST">
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

                <button type="submit" class="btn" style="width:100%; margin-top:10px;">Create Hosting Account</button>
            </form>
        </div>
    `, username));
});

app.post('/accounts/create', requireAuth, (req, res) => {
    const username = req.session.user;
    const userEmail = db.users[username]?.email;

    if (getAccountsByEmail(userEmail) >= 8) {
        return res.send('<script>alert("Maximum limit of 8 accounts reached for this Gmail!"); window.location="/accounts";</script>');
    }

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

    const defaultCode = `<!DOCTYPE html>
<html>
<head>
    <title>Welcome to ${fullDomain}</title>
</head>
<body style="font-family:sans-serif; text-align:center; padding:50px; background:#f4f6f9;">
    <h1 style="color:#5856d6;">🚀 Website ${fullDomain} is Live!</h1>
    <p>Host ID: <b>${accId}</b></p>
    <p>Edit this page inside File Manager in your Control Panel.</p>
</body>
</html>`;

    db.files[`${accId}/index.html`] = defaultCode;
    saveData(db);

    res.redirect(`/accounts/${accId}`);
});

// -------------------------------------------------------------
// 6. Control Panel & Instant File Manager
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

// FILE MANAGER
app.get('/accounts/:id/filemanager', requireAuth, (req, res) => {
    const username = req.session.user;
    const accId = req.params.id;

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

// DATABASES
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
// 7. Start Server
// -------------------------------------------------------------
app.listen(PORT, () => {
    console.log(`Infinity Pro Server running at http://localhost:${PORT}`);
});
