const express = require('express');
const fileUpload = require('express-fileupload');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware Setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(fileUpload());
app.use(session({
    secret: 'infinity_secret_key_123',
    resave: false,
    saveUninitialized: true
}));

// Temporary In-Memory User Database
const users = {};

// Root Route - Redirect to Dashboard or Login
app.get('/', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    res.redirect('/login');
});

// LOGIN & SIGNUP PAGE
app.get('/login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Infinity Hosting - Login / Signup</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #fff; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
                .card { background: #1e293b; padding: 30px; border-radius: 12px; width: 90%; max-width: 380px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 1px solid #334155; }
                h2 { color: #38bdf8; text-align: center; margin-bottom: 20px; }
                input { width: 100%; padding: 12px; margin: 8px 0; border-radius: 6px; border: 1px solid #475569; background: #0f172a; color: white; box-sizing: border-box; }
                button { width: 100%; padding: 12px; background: #0284c7; border: none; color: white; font-weight: bold; border-radius: 6px; cursor: pointer; margin-top: 10px; }
                button:hover { background: #0369a1; }
                .tab { display: flex; justify-content: space-around; margin-bottom: 20px; cursor: pointer; }
                .tab div { padding: 8px 16px; border-bottom: 2px solid transparent; }
                .tab .active { border-color: #38bdf8; font-weight: bold; color: #38bdf8; }
            </style>
        </head>
        <body>
            <div class="card">
                <h2>⚡ Infinity Cloud</h2>
                <div class="tab">
                    <div class="active">Login / Signup</div>
                </div>
                <form action="/auth" method="POST">
                    <input type="text" name="username" placeholder="Username" required />
                    <input type="password" name="password" placeholder="Password" required />
                    <button type="submit">Continue to Hosting</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

// AUTHENTICATION LOGIC
app.post('/auth', (req, res) => {
    const { username, password } = req.body;
    if (!users[username]) {
        users[username] = { password, files: [] };
    }
    if (users[username].password === password) {
        req.session.user = username;
        return res.redirect('/dashboard');
    }
    res.send('Invalid password! <a href="/login">Try again</a>');
});

// USER DASHBOARD & FILE MANAGER
app.get('/dashboard', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const username = req.session.user;

    const userFolder = path.join(__dirname, 'public_html', username);
    if (!fs.existsSync(userFolder)) {
        fs.mkdirSync(userFolder, { recursive: true });
    }

    const files = fs.readdirSync(userFolder);

    let fileListHtml = files.length > 0 
        ? files.map(f => `<li>📄 <a href="/sites/${username}/${f}" target="_blank" style="color:#38bdf8">${f}</a></li>`).join('') 
        : '<p style="color:#94a3b8">No files uploaded yet.</p>';

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Dashboard - Infinity Hosting</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #fff; margin: 0; padding: 20px; }
                .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 20px; border-bottom: 1px solid #334155; }
                .box { background: #1e293b; padding: 20px; border-radius: 8px; margin-top: 20px; border: 1px solid #334155; }
                .btn { padding: 8px 16px; background: #ef4444; color: white; border-radius: 4px; text-decoration: none; font-size: 14px; }
                input[type="file"] { background: #0f172a; padding: 10px; border-radius: 6px; border: 1px solid #475569; color: white; }
                button { padding: 10px 20px; background: #10b981; border: none; color: white; border-radius: 6px; cursor: pointer; font-weight: bold; }
                ul { list-style: none; padding: 0; }
                li { padding: 10px; background: #0f172a; margin: 5px 0; border-radius: 6px; border: 1px solid #334155; }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>🚀 Welcome, ${username}!</h2>
                <a href="/logout" class="btn">Logout</a>
            </div>

            <div class="box">
                <h3>📤 Upload Website File (HTML, CSS, JS)</h3>
                <form action="/upload" method="POST" enctype="multipart/form-data">
                    <input type="file" name="webfile" required />
                    <button type="submit">Upload File</button>
                </form>
            </div>

            <div class="box">
                <h3>📁 Your Hosted Files</h3>
                <ul>${fileListHtml}</ul>
            </div>
        </body>
        </html>
    `);
});

// FILE UPLOAD HANDLER
app.post('/upload', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    if (!req.files || !req.files.webfile) {
        return res.status(400).send('No file uploaded.');
    }

    const username = req.session.user;
    const uploadedFile = req.files.webfile;
    const userFolder = path.join(__dirname, 'public_html', username);

    uploadedFile.mv(path.join(userFolder, uploadedFile.name), (err) => {
        if (err) return res.status(500).send(err);
        res.redirect('/dashboard');
    });
});

// SERVE USER WEBSITE FILES
app.use('/sites', express.static(path.join(__dirname, 'public_html')));

// LOGOUT ROUTE
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.listen(PORT, () => {
    console.log('Infinity Hosting Panel running on port ' + PORT);
});
