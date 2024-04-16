const express = require('express');
const bcrypt = require('bcrypt');
const db = require('./database');
const path = require('path');

const app = express();

// Correctly point to where your static files are located
app.use(express.static(path.join(__dirname, '..', 'public')));

// Middleware
app.use(express.urlencoded({ extended: true }));

// Serve index.html as the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'index.html'));
});

// Serve registration form and handle submissions
app.get('/register.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'register.html'));
});

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

// Retrieve all users
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

// Register success route
app.get('/success.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'success.html'));
});

// Card collections routes
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

// Retrieve all collections
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

// Retrieve all cards
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

const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
