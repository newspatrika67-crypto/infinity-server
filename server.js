const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// -------------------------------------------------------------
// 1. Middlewares & App Configuration
// -------------------------------------------------------------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 'infinity_clone_secret_key_2026',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 Hours
}));

const PUBLIC_DIR = path.join(__dirname, 'public');
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
app.use(express.static(PUBLIC_DIR));

// Auth Middleware
const requireAuth = (req, res, next) => {
    if (!req.session.user) return res.redirect('/login');
    next();
};

// -------------------------------------------------------------
// 2. Mock Database (State Management)
// -------------------------------------------------------------
const db = {
    users: {
        'admin': { password: '123' }
    },
    accounts: {
        'admin': [
            {
                id: 'if0_42538004',
                label: 'Website for indianshop.site.je',
                domain: 'indianshop.site.je',
                status: 'Active',
                ip: '185.27.134.144',
                volume: 'vol10_4',
                homeDir: '/home/vol10_4/infinityfree.com/if0_42538004',
                created: '2026-07-30',
                dbUser: 'if0_42538004',
                databases: ['if0_42538004_shop_db'],
                files: ['htdocs', '.htaccess', '.lastlogin', '.override']
            }
        ]
    }
};

// Global Layout Template function for InfinityFree Theme
function renderLayout(title, content, activeTab = 'accounts', user = null) {
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
            body { background-color: #f4f6f9; color: #333; }
            header { background: #fff; border-bottom: 1px solid #e1e4e8; padding: 15px 30px; display: flex; justify-content: space-between; align-items: center; }
            .logo { font-size: 22px; font-weight: bold; color: #5856d6; text-decoration: none; display: flex; align-items: center; gap: 10px; }
            .nav { display: flex; gap: 20px; background: #fff; padding: 0 30px; border-bottom: 1px solid #e1e4e8; }
            .nav a { text-decoration: none; color: #555; padding: 15px 0; font-size: 15px; border-bottom: 2px solid transparent; font-weight: 500; }
            .nav a.active { color: #5856d6; border-bottom: 2px solid #5856d6; }
            .container { max-width: 1000px; margin: 25px auto; padding: 0 15px; }
            .card { background: #fff; border-radius: 8px; border: 1px solid #e1e4e8; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
            .btn { background: #5856d6; color: white; padding: 10px 18px; border: none; border-radius: 6px; cursor: pointer; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; }
            .btn:hover { background: #4543c7; }
            .btn-outline { background: transparent; border: 1px solid #5856d6; color: #5856d6; }
            .btn-outline:hover { background: #f0f0ff; }
            .btn-danger { background: #e74c3c; }
            .btn-danger:hover { background: #c0392b; }
            .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .badge-success { background: #e6f9ed; color: #2ecc71; }
            .grid-btns { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px; }
            .grid-btn { border: 1px solid #e1e4e8; padding: 15px; border-radius: 8px; text-align: center; text-decoration: none; color: #333; font-weight: 600; transition: 0.2s; }
            .grid-btn:hover { border-color: #5856d6; background: #fafafa; }
            .grid-btn i { font-size: 24px; color: #5856d6; margin-bottom: 8px; display: block; }
            .detail-row { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding: 10px 0; font-size: 14px; }
            .detail-row:last-child { border: none; }
            .code-box { background: #282c34; color: #abb2bf; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 13px; }
        </style>
    </head>
    <body>
        <header>
            <a href="/accounts" class="logo"><i class="fa-solid fa-infinity"></i> InfinityFree</a>
            <div>
                ${user ? `<span style="margin-right: 15px;"><i class="fa-solid fa-user"></i> ${user}</span> <a href="/logout" style="color:#e74c3c; text-decoration:none;"><i class="fa-solid fa-right-from-bracket"></i> Logout</a>` : `<a href="/login" class="btn">Login</a>`}
            </div>
        </header>
        ${user ? `
        <div class="nav">
            <a href="/accounts" class="${activeTab === 'accounts' ? 'active' : ''}">Accounts</a>
            <a href="/profile" class="${activeTab === 'profile' ? 'active' : ''}">Edit Profile</a>
        </div>
        ` : ''}
        <div class="container">
            ${content}
        </div>
    </body>
    </html>
    `;
}

// -------------------------------------------------------------
// 3. Auth Routes (Login / Register)
// -------------------------------------------------------------
app.get('/', (req, res) => res.redirect('/accounts'));

app.get('/login', (req, res) => {
    const html = `
    <div style="max-width: 400px; margin: 50px auto;" class="card">
        <h2 style="margin-bottom: 20px; text-align:center;">Sign In to InfinityFree</h2>
        <form action="/auth" method="POST">
            <div style="margin-bottom: 15px;">
                <label style="display:block; margin-bottom:5px; font-size:14px;">Username</label>
                <input type="text" name="username" required value="admin" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:5px;">
            </div>
            <div style="margin-bottom: 20px;">
                <label style="display:block; margin-bottom:5px; font-size:14px;">Password</label>
                <input type="password" name="password" required value="123" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:5px;">
            </div>
            <button type="submit" class="btn" style="width:100%; justify-content:center;">Sign In</button>
        </form>
        <p style="margin-top:15px; font-size:12px; text-align:center; color:#777;">Demo Acc: username <b>admin</b> / pass <b>123</b></p>
    </div>
    `;
    res.send(renderLayout('Login', html));
});

app.post('/auth', (req, res) => {
    const { username, password } = req.body;
    if (!db.users[username]) {
        db.users[username] = { password };
        db.accounts[username] = [];
    }
    if (db.users[username].password === password) {
        req.session.user = username;
        return res.redirect('/accounts');
    }
    res.send('<script>alert("Invalid Credentials"); window.location="/login";</script>');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// -------------------------------------------------------------
// 4. InfinityFree Hosting Accounts Dashboard
// -------------------------------------------------------------
app.get('/accounts', requireAuth, (req, res) => {
    const username = req.session.user;
    const userAccs = db.accounts[username] || [];

    let accCards = userAccs.map(acc => `
        <div class="card" style="display:flex; justify-content:space-between; align-items:center;">
            <div>
                <h3 style="color:#5856d6;"><i class="fa-solid fa-globe"></i> ${acc.id}</h3>
                <p style="font-size:14px; color:#666; margin-top:5px;">${acc.domain}</p>
            </div>
            <div>
                <a href="/accounts/${acc.id}" class="btn"><i class="fa-solid fa-gear"></i> Manage</a>
            </div>
        </div>
    `).join('');

    const content = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <h2>Hosting Accounts</h2>
            <a href="/accounts/create" class="btn"><i class="fa-solid fa-plus"></i> Create Account</a>
        </div>
        <div class="card" style="margin-bottom:15px;">
            <span style="font-size:14px;">Active Accounts: <b>${userAccs.length} / 3</b></span>
        </div>
        ${accCards || '<div class="card"><p>No hosting accounts found. Click "Create Account" to start.</p></div>'}
    `;
    res.send(renderLayout('Hosting Accounts', content, 'accounts', username));
});

// CREATE ACCOUNT
app.get('/accounts/create', requireAuth, (req, res) => {
    const username = req.session.user;
    const content = `
        <h2>Create Hosting Account</h2>
        <div class="card" style="margin-top:20px;">
            <form action="/accounts/create" method="POST">
                <label style="display:block; margin-bottom:8px;">Domain Subdomain Name</label>
                <div style="display:flex; gap:10px; margin-bottom:20px;">
                    <input type="text" name="domainPrefix" placeholder="mywebsite" required style="flex:1; padding:10px; border:1px solid #ccc; border-radius:5px;">
                    <select name="domainSuffix" style="padding:10px; border:1px solid #ccc; border-radius:5px;">
                        <option value=".site.je">.site.je</option>
                        <option value=".great-site.net">.great-site.net</option>
                        <option value=".infinityfreeapp.com">.infinityfreeapp.com</option>
                    </select>
                </div>
                <button type="submit" class="btn">Create Account Now</button>
            </form>
        </div>
    `;
    res.send(renderLayout('Create Account', content, 'accounts', username));
});

app.post('/accounts/create', requireAuth, (req, res) => {
    const username = req.session.user;
    const { domainPrefix, domainSuffix } = req.body;
    const fullDomain = domainPrefix + domainSuffix;
    const newAccId = 'if0_' + Math.floor(10000000 + Math.random() * 90000000);

    const newAccount = {
        id: newAccId,
        label: `Website for ${fullDomain}`,
        domain: fullDomain,
        status: 'Active',
        ip: '185.27.134.144',
        volume: 'vol10_4',
        homeDir: `/home/vol10_4/infinityfree.com/${newAccId}`,
        created: new Date().toISOString().split('T')[0],
        dbUser: newAccId,
        databases: [],
        files: ['htdocs', '.htaccess']
    };

    if (!db.accounts[username]) db.accounts[username] = [];
    db.accounts[username].push(newAccount);

    res.redirect(`/accounts/${newAccId}`);
});

// -------------------------------------------------------------
// 5. Account Overview & Tools Panel (Main Control Center)
// -------------------------------------------------------------
app.get('/accounts/:id', requireAuth, (req, res) => {
    const username = req.session.user;
    const acc = (db.accounts[username] || []).find(a => a.id === req.params.id);

    if (!acc) return res.redirect('/accounts');

    const content = `
        <div style="margin-bottom:20px;">
            <a href="/accounts" style="color:#5856d6; text-decoration:none;"><i class="fa-solid fa-arrow-left"></i> Back to Accounts</a>
            <h2 style="margin-top:10px;">${acc.id} (${acc.domain})</h2>
        </div>

        <div class="card">
            <h3>Quick Control Actions</h3>
            <div class="grid-btns">
                <a href="/accounts/${acc.id}/filemanager" class="grid-btn"><i class="fa-solid fa-folder-open"></i> File Manager</a>
                <a href="/accounts/${acc.id}/databases" class="grid-btn"><i class="fa-solid fa-database"></i> MySQL Databases</a>
                <a href="/accounts/${acc.id}/phpmyadmin" class="grid-btn" target="_blank"><i class="fa-solid fa-server"></i> phpMyAdmin</a>
                <a href="/accounts/${acc.id}/resources" class="grid-btn"><i class="fa-solid fa-chart-pie"></i> Resource Usage</a>
            </div>
        </div>

        <div class="card">
            <h3>Account Details</h3>
            <div class="detail-row"><span>Username:</span> <b>${acc.id}</b></div>
            <div class="detail-row"><span>Status:</span> <span class="badge badge-success">${acc.status}</span></div>
            <div class="detail-row"><span>Main Domain:</span> <b>${acc.domain}</b></div>
            <div class="detail-row"><span>Website IP:</span> <b>${acc.ip}</b></div>
            <div class="detail-row"><span>Hosting Volume:</span> <b>${acc.volume}</b></div>
            <div class="detail-row"><span>Home Directory:</span> <b>${acc.homeDir}</b></div>
            <div class="detail-row"><span>Creation Date:</span> <b>${acc.created}</b></div>
        </div>

        <div class="card" style="border-color:#ffc107;">
            <h3 style="color:#d39e00;">Danger Zone</h3>
            <p style="font-size:13px; color:#666; margin:10px 0;">Deactivating or deleting this hosting account will remove all files.</p>
            <a href="/accounts/${acc.id}/delete" class="btn btn-danger"><i class="fa-solid fa-trash"></i> Delete Account</a>
        </div>
    `;
    res.send(renderLayout('Account Overview', content, 'accounts', username));
});

// FILE MANAGER PAGE
app.get('/accounts/:id/filemanager', requireAuth, (req, res) => {
    const username = req.session.user;
    const acc = (db.accounts[username] || []).find(a => a.id === req.params.id);

    let fileList = acc.files.map(f => `
        <div class="detail-row">
            <span><i class="fa-solid ${f.includes('.') ? 'fa-file' : 'fa-folder'}" style="color:#5856d6; margin-right:10px;"></i> ${f}</span>
            <span style="color:#777; font-size:12px;">755 / Read-Write</span>
        </div>
    `).join('');

    const content = `
        <div style="margin-bottom:20px;">
            <a href="/accounts/${acc.id}" style="color:#5856d6; text-decoration:none;"><i class="fa-solid fa-arrow-left"></i> Back to Overview</a>
            <h2 style="margin-top:10px;">File Manager - /home/${acc.id}</h2>
        </div>
        <div class="card">
            <div style="display:flex; gap:10px; margin-bottom:15px;">
                <button class="btn btn-outline" onclick="alert('File Upload Simulation')"><i class="fa-solid fa-upload"></i> Upload</button>
                <button class="btn btn-outline" onclick="alert('New File Created')"><i class="fa-solid fa-file-circle-plus"></i> New File</button>
                <button class="btn btn-outline" onclick="alert('New Folder Created')"><i class="fa-solid fa-folder-plus"></i> New Folder</button>
            </div>
            ${fileList}
        </div>
    `;
    res.send(renderLayout('File Manager', content, 'accounts', username));
});

// MYSQL DATABASES PAGE
app.get('/accounts/:id/databases', requireAuth, (req, res) => {
    const username = req.session.user;
    const acc = (db.accounts[username] || []).find(a => a.id === req.params.id);

    let dbList = acc.databases.map(d => `
        <div class="detail-row">
            <span><i class="fa-solid fa-database" style="color:#5856d6; margin-right:10px;"></i> ${d}</span>
            <div>
                <a href="/accounts/${acc.id}/phpmyadmin" class="btn btn-outline" style="padding:4px 8px; font-size:12px;" target="_blank">phpMyAdmin</a>
            </div>
        </div>
    `).join('');

    const content = `
        <div style="margin-bottom:20px;">
            <a href="/accounts/${acc.id}" style="color:#5856d6; text-decoration:none;"><i class="fa-solid fa-arrow-left"></i> Back to Overview</a>
            <h2 style="margin-top:10px;">MySQL Databases</h2>
        </div>

        <div class="card">
            <h3>MySQL Connection Details</h3>
            <div class="detail-row"><span>MySQL Username:</span> <b>${acc.dbUser}</b></div>
            <div class="detail-row"><span>MySQL Password:</span> <b>(Your Account Password)</b></div>
            <div class="detail-row"><span>MySQL Hostname:</span> <b>sql305.infinityfree.com</b></div>
            <div class="detail-row"><span>MySQL Port:</span> <b>3306</b></div>
        </div>

        <div class="card">
            <h3>Create Database</h3>
            <form action="/accounts/${acc.id}/databases/create" method="POST" style="display:flex; gap:10px; margin-top:10px;">
                <span style="padding:10px; background:#eee; border-radius:5px;">${acc.id}_</span>
                <input type="text" name="dbname" placeholder="shop_db" required style="padding:10px; border:1px solid #ccc; border-radius:5px; flex:1;">
                <button type="submit" class="btn">Create Database</button>
            </form>
        </div>

        <div class="card">
            <h3>List of Databases</h3>
            ${dbList || '<p style="margin-top:10px; color:#777;">No databases created yet.</p>'}
        </div>
    `;
    res.send(renderLayout('MySQL Databases', content, 'accounts', username));
});

app.post('/accounts/:id/databases/create', requireAuth, (req, res) => {
    const username = req.session.user;
    const acc = (db.accounts[username] || []).find(a => a.id === req.params.id);
    if (acc) {
        acc.databases.push(`${acc.id}_${req.body.dbname}`);
    }
    res.redirect(`/accounts/${req.params.id}/databases`);
});

// PHPMYADMIN LINK SIMULATION
app.get('/accounts/:id/phpmyadmin', requireAuth, (req, res) => {
    res.send(`
        <h2 style="font-family:sans-serif; text-align:center; margin-top:50px;">phpMyAdmin (sql305.infinityfree.com)</h2>
        <p style="font-family:sans-serif; text-align:center;">Redirecting/Connecting to MySQL Database Interface...</p>
    `);
});

// RESOURCE USAGE
app.get('/accounts/:id/resources', requireAuth, (req, res) => {
    const username = req.session.user;
    const acc = (db.accounts[username] || []).find(a => a.id === req.params.id);

    const content = `
        <div style="margin-bottom:20px;">
            <a href="/accounts/${acc.id}" style="color:#5856d6; text-decoration:none;"><i class="fa-solid fa-arrow-left"></i> Back to Overview</a>
            <h2 style="margin-top:10px;">Resource Usage Limits</h2>
        </div>
        <div class="card">
            <div class="detail-row"><span>Daily Hits Used:</span> <b>12 / 50,000 (0%)</b></div>
            <div class="detail-row"><span>CPU Usage:</span> <b>1 % / 100%</b></div>
            <div class="detail-row"><span>RAM Usage:</span> <b>8 MB / 512 MB</b></div>
            <div class="detail-row"><span>Disk Space Used:</span> <b>1.2 MB / Unlimited</b></div>
            <div class="detail-row"><span>Inodes Used:</span> <b>14 / 30,000</b></div>
        </div>
    `;
    res.send(renderLayout('Resource Usage', content, 'accounts', username));
});

// DELETE ACCOUNT LOGIC
app.get('/accounts/:id/delete', requireAuth, (req, res) => {
    const username = req.session.user;
    if (db.accounts[username]) {
        db.accounts[username] = db.accounts[username].filter(a => a.id !== req.params.id);
    }
    res.redirect('/accounts');
});

// -------------------------------------------------------------
// 6. Start Server
// -------------------------------------------------------------
app.listen(PORT, () => {
    console.log(`InfinityFree Server running on port ${PORT}`);
});
