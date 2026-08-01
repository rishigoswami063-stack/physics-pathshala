const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // Agar public folder hai toh

// MongoDB Connection
const MONGO_URL = process.env.MONGO_URL;

mongoose.connect(MONGO_URL)
  .then(() => console.log('Connected to MongoDB database successfully.'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Define Schema & Model (Apne form ke fields ke hisab se, e.g., Name, Phone, Course)
const enquirySchema = new mongoose.Schema({
    name: String,
    phone: String,
    goal: String,
    date: { type: Date, default: Date.now }
});

const Enquiry = mongoose.model('Enquiry', enquirySchema);

// Form Submit Route (Yahan naya async/await method use kiya hai)
app.post('/submit-enquiry', async (req, res) => {
    try {
        const newEnquiry = new Enquiry({
            name: req.body.name,
            phone: req.body.phone,
            goal: req.body.goal
        });

        await newEnquiry.save();
        res.status(200).json({ success: true, message: "Data saved successfully!" });
    } catch (err) {
        console.error("Error saving data:", err);
        res.status(500).json({ success: false, error: "Server error while saving data." });
    }
});

// Admin / View Data Route (Agar data dekhne ke liye route chahiye)
app.get('/get-enquiries', async (req, res) => {
    try {
        const data = await Enquiry.find().sort({ date: -1 });
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch data" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});