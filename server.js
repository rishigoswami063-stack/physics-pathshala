const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Ab ye direct root folder se index.html ko serve karega
app.use(express.static(__dirname));

// Database Setup (SQLite)
const dbFile = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.error('Database opening error: ', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS enquiries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            course TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
    }
});

// API Route to handle form submission
app.post('/api/enquiry', (req, res) => {
    const { name, phone, course } = req.body;
    
    if (!name || !phone || !course) {
        return res.status(400).json({ success: false, message: 'All fields are required!' });
    }

    const query = `INSERT INTO enquiries (name, phone, course) VALUES (?, ?, ?)`;
    db.run(query, [name, phone, course], function(err) {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error: ' + err.message });
        }
        res.json({ success: true, message: 'Enquiry submitted successfully!', id: this.lastID });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running live at http://localhost:${PORT}`);
});