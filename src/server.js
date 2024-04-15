const express = require('express');
const bcrypt = require('bcrypt');
const db = require('./database'); // Updated the path to the database configuration file
const path = require('path');

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('../public')); // Updated to correctly point to the public directory

// Routes

// Register Route
app.get('/register.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'register.html')); // Updated path
});

app.post('/register', (req, res) => {
    // Registration logic
});

// Users Route
app.get('/users', (req, res) => {
    db.query('SELECT * FROM users', (error, results) => {
        if (error) {
            console.error('Error retrieving users:', error);
            res.status(500).send('Internal Server Error');
        } else {
            res.json(results);
        }
    });
});

// Test Database Connection Route
app.get('/test-db-connection', (req, res) => {
    db.query('SELECT 1', (error, results) => {
        if (error) {
            console.error('Error connecting to the database:', error);
            res.status(500).send('Error connecting to the database');
        } else {
            res.send('Database connected successfully!');
        }
    });
});

// Register Success Route
app.get('/success.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'success.html')); // Updated path
});

// Card Collections Routes

// Create Collection Route
app.post('/collections', (req, res) => {
    // Create collection logic
});

// Get Collections Route
app.get('/collections/:userId', (req, res) => {
    // Get collections logic
});

// Update Collection Route
app.put('/collections/:collectionId', (req, res) => {
    // Update collection logic
});

// Delete Collection Route
app.delete('/collections/:collectionId', (req, res) => {
    // Delete collection logic
});

const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
// Create Collection Route
app.post('/collections', (req, res) => {
    const { userId, collectionName } = req.body;

    // Validate input
    if (!userId || !collectionName) {
        return res.status(400).send('User ID and collection name are required.');
    }

    // Insert new collection into the database
    db.query('INSERT INTO collections (user_id, collection_name) VALUES (?, ?)', [userId, collectionName], (error, results) => {
        if (error) {
            console.error('Error creating collection:', error);
            return res.status(500).send('Internal Server Error');
        }
        
        // Collection created successfully
        res.status(201).send('Collection created successfully.');
    });
});
// Get Collections Route
app.get('/collections', (req, res) => {
    // Logic to retrieve collections
});
