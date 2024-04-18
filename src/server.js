const express = require('express');
const bcrypt = require('bcrypt');
const db = require('./database');
const path = require('path');

const app = express();

// Setup static file serving
app.use(express.static(path.join(__dirname, '..', 'public')));

// Middleware to handle URL-encoded data
app.use(express.urlencoded({ extended: true }));

// Root endpoint to serve the homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Endpoint to serve the registration form
app.get('/register.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'register.html'));
});

// Handle registration form submissions
app.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    const saltRounds = 10;

    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
            console.error('Error hashing password:', err);
            res.status(500).send('Error during registration');
        } else {
            db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hash], (error, results) => {
                if (error) {
                    console.error('Error adding user:', error);
                    res.status(500).send('Internal Server Error');
                } else {
                    res.redirect('/success.html');
                }
            });
        }
    });
});

// Endpoint to retrieve all users
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

// Test database connection
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

// Endpoint to serve the registration success page
app.get('/success.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'success.html'));
});

// Endpoint for creating new collections
app.post('/collections', (req, res) => {
    const { userId, collectionName } = req.body;
    if (!userId || !collectionName) {
        res.status(400).send('User ID and collection name are required.');
        return;
    }
    db.query('INSERT INTO collections (user_id, collection_name) VALUES (?, ?)', [userId, collectionName], (error, results) => {
        if (error) {
            console.error('Error creating collection:', error);
            res.status(500).send('Internal Server Error');
        } else {
            res.status(201).send('Collection created successfully.');
        }
    });
});

// Endpoint to retrieve all collections
app.get('/collections', (req, res) => {
    db.query('SELECT * FROM collections', (error, results) => {
        if (error) {
            console.error('Error retrieving collections:', error);
            res.status(500).send('Internal Server Error');
        } else {
            res.json(results);
        }
    });
});

// Comprehensive endpoint for retrieving cards with optional filters
app.get('/cards', (req, res) => {
    let { name, type, rarity, collectionId, sortBy, sortOrder = 'ASC' } = req.query;
    let query = `
        SELECT Cards.*, Collections.collection_name
        FROM Cards
        LEFT JOIN Collections ON Cards.user_id = Collections.user_id
        WHERE 1 = 1
    `;
    let params = [];

    if (name) {
        query += " AND card_name LIKE ?";
        params.push(`%${name}%`);
    }
    if (type) {
        query += " AND types LIKE ?";
        params.push(`%${type}%`);
    }
    if (rarity) {
        query += " AND rarity = ?";
        params.push(rarity);
    }
    if (collectionId) {
        query += " AND Cards.user_id = ?";
        params.push(collectionId);
    }
    if (sortBy) {
        query += ` ORDER BY ${sortBy} ${sortOrder}`;
    } else {
        query += " ORDER BY card_name ASC";
    }

    db.query(query, params, (error, results) => {
        if (error) {
            console.error('Error retrieving cards:', error);
            res.status(500).send('Internal Server Error');
        } else {
            res.json(results);
        }
    });
});

const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
