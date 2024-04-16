const express = require('express');
const bcrypt = require('bcrypt');
const db = require('./database'); // Ensure this path matches where your database module is stored
const path = require('path');

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
// Ensure this path correctly points to where your static files are located
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes

// Root Route - Serve the main page
app.get('/', (req, res) => {
    // Serve index.html as the main page
    res.sendFile(path.join(__dirname, '..', 'views', 'index.html'));
});

// Register Route - Serve the registration form and handle submissions
app.get('/register.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'register.html'));
});

app.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    const saltRounds = 10;

    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
            console.error('Error hashing password:', err);
            return res.status(500).send('Error during registration');
        }
        db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hash], (error, results) => {
            if (error) {
                console.error('Error adding user:', error);
                return res.status(500).send('Internal Server Error');
            }
            res.redirect('/success.html');
        });
    });
});

// Users Route - Retrieve all users
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
    res.sendFile(path.join(__dirname, '..', 'views', 'success.html'));
});

// Card Collections Routes

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
        
        res.status(201).send('Collection created successfully.');
    });
});

// Retrieve Collections Route
app.get('/collections', (req, res) => {
    db.query('SELECT * FROM collections', (error, results) => {
        if (error) {
            console.error('Error retrieving collections:', error);
            return res.status(500).send('Internal Server Error');
        }
        
        res.json(results);
    });
});

// Get all cards
app.get('/cards', (req, res) => {
    const query = 'SELECT * FROM Cards;';
    db.query(query, (error, results) => {
        if (error) {
            console.error('Error retrieving cards:', error);
            res.status(500).send('Internal Server Error');
        } else {
            res.json(results);
        }
    });
});
