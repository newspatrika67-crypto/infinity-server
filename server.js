const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send(`
        <html>
            <head><title>Free Server - Infinity Style</title></head>
            <body style="font-family: Arial; text-align: center; padding: 50px; background: #f4f7f6;">
                <div style="background: white; padding: 40px; border-radius: 8px; display: inline-block; box-shadow: 0px 0px 10px rgba(0,0,0,0.1);">
                    <h1 style="color: #007bff;">Your Free Server is Live!</h1>
                    <p>Managed via Render & GitHub successfully.</p>
                </div>
            </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log('Server running on port ' + PORT);
});
