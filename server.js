const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// SQLite Database Connection & Table Creation
const dbFile = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        // Table create karne ke liye taaki leads save ho sakein
        db.run(`CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fullName TEXT,
            phoneNumber TEXT,
            selectedCourse TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (createErr) => {
            if (createErr) {
                console.error('Error creating table:', createErr.message);
            } else {
                console.log('Leads table ready.');
            }
        });
    }
});

// Route for Homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route for Admin Panel Page
app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// 1. API Route to Handle Enquiry Form Submission (From index.html)
app.post('/api/enquiry', (req, res) => {
    const { fullName, phoneNumber, selectedCourse } = req.body;
    
    const query = `INSERT INTO leads (fullName, phoneNumber, selectedCourse) VALUES (?, ?, ?)`;
    db.run(query, [fullName, phoneNumber, selectedCourse], function(err) {
        if (err) {
            console.error('Error saving lead:', err.message);
            res.status(500).json({ success: false, message: 'Server error while saving data.' });
        } else {
            res.json({ success: true, message: 'Enquiry submitted successfully!', id: this.lastID });
        }
    });
});

// 2. API Route to Fetch All Leads for Admin Panel (From admin.html)
app.get('/api/leads', (req, res) => {
    const query = `SELECT id, fullName, phoneNumber, selectedCourse, createdAt FROM leads ORDER BY id DESC`;
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error fetching leads:', err.message);
            res.status(500).json({ success: false, message: 'Failed to load leads from database.' });
        } else {
            res.json(rows);
        }
    });
});

// Server Start
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});