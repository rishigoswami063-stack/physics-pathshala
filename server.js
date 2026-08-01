const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname)));

// Hardcoded Admin Credentials (Production me env variables use hote hain)
const ADMIN_USER = "admin";
const ADMIN_PASS = "physics123";

// SQLite Database Connection & Table Creation
const dbFile = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fullName TEXT,
            phoneNumber TEXT,
            selectedCourse TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (createErr) => {
            if (createErr) console.error('Error creating table:', createErr.message);
        });
    }
});

// Middleware to Check Admin Session
function requireAuth(req, res, next) {
    if (req.cookies && req.cookies.admin_logged_in === 'true') {
        next();
    } else {
        res.redirect('/login.html');
    }
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Protected Admin Dashboard Route
app.get('/admin.html', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Handle Login Form Submission
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        res.cookie('admin_logged_in', 'true', { httpOnly: true, secure: true, maxAge: 86400000 }); // 1 Day
        res.json({ success: true, message: 'Login successful' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
});

// Handle Logout
app.post('/api/logout', (req, res) => {
    res.clearCookie('admin_logged_in');
    res.json({ success: true, message: 'Logged out successfully' });
});

// API Route to Handle Enquiry Form Submission
app.post('/api/enquiry', (req, res) => {
    const { fullName, phoneNumber, selectedCourse } = req.body;
    const query = `INSERT INTO leads (fullName, phoneNumber, selectedCourse) VALUES (?, ?, ?)`;
    db.run(query, [fullName, phoneNumber, selectedCourse], function(err) {
        if (err) {
            res.status(500).json({ success: false, message: 'Server error while saving data.' });
        } else {
            res.json({ success: true, message: 'Enquiry submitted successfully!', id: this.lastID });
        }
    });
});

// Protected API Route to Fetch Leads
app.get('/api/leads', requireAuth, (req, res) => {
    const query = `SELECT id, fullName, phoneNumber, selectedCourse, createdAt FROM leads ORDER BY id DESC`;
    db.all(query, [], (err, rows) => {
        if (err) {
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