const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname)));

// Hardcoded Admin Credentials
const ADMIN_USER = "admin";
const ADMIN_PASS = "physics123";

// MongoDB Connection (Yahan apni MongoDB connection string daalni hogi, ya Render environment variable me MONGO_URL set kr dena)
const MONGO_URI = process.env.MONGO_URL || "mongodb+srv://your_username:your_password@cluster.mongodb.net/physics_pathshala?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB database successfully.'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Define Mongoose Schema & Model for Leads
const leadSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    selectedCourse: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Lead = mongoose.model('Lead', leadSchema);

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
app.post('/api/enquiry', async (req, res) => {
    try {
        const { fullName, phoneNumber, selectedCourse } = req.body;
        const newLead = new Lead({ fullName, phoneNumber, selectedCourse });
        await newLead.save();
        res.json({ success: true, message: 'Enquiry submitted successfully!', id: newLead._id });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error while saving data.' });
    }
});

// Protected API Route to Fetch Leads
app.get('/api/leads', requireAuth, async (req, res) => {
    try {
        const rows = await Lead.find().sort({ createdAt: -1 });
        // Format for frontend table compatibility (mapping _id to id)
        const formattedRows = rows.map(row => ({
            id: row._id,
            fullName: row.fullName,
            phoneNumber: row.phoneNumber,
            selectedCourse: row.selectedCourse,
            createdAt: row.createdAt
        }));
        res.json(formattedRows);
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to load leads from database.' });
    }
});

// Server Start
app.listen(PORT, () => {
    clientOutput = `Server is running on port ${PORT}`;
    console.log(clientOutput);
});