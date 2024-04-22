const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');
const db = require('./database'); // Ensure this path is correct

const app = express();

// Set up session middleware
app.use(session({
    secret: 'your_secret_key', // Replace 'your_secret_key' with a real secret string in production
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Serve static files from 'public' and 'views' directories
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.static(path.join(__dirname, '..', 'views')));

// Middleware to parse URL-encoded data (from forms)
app.use(express.urlencoded({ extended: true }));

// Serve the homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Registration routes
app.get('/register.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'register.html'));
});

app.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            console.error('Error hashing password:', err);
            res.status(500).send('Error during registration');
        } else {
            db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hash], (error) => {
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

// Login routes
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'login.html'));
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ?', [username], (error, results) => {
        if (error) {
            console.error('Error fetching user:', error);
            res.status(500).send('Internal Server Error');
        } else if (results.length > 0) {
            bcrypt.compare(password, results[0].password, (err, result) => {
                if (result) {
                    req.session.user = { id: results[0].user_id, username: results[0].username };
                    res.redirect('/dashboard.html');
                } else {
                    res.send('Username or password is incorrect');
                }
            });
        } else {
            res.send('Username does not exist');
        }
    });
});

// Dashboard route
app.get('/dashboard.html', (req, res) => {
    if (req.session.user) {
        res.sendFile(path.join(__dirname, '..', 'views', 'dashboard.html'));
    } else {
        res.send('Please login to view this page.');
    }
});

// API to view collections
app.get('/api/collections', (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('Unauthorized');
    }
    db.query('SELECT * FROM collections WHERE user_id = ?', [req.session.user.id], (error, results) => {
        if (error) {
            console.error('Error retrieving collections:', error);
            res.status(500).send('Internal Server Error');
        } else {
            res.json(results);
        }
    });
});

// View collections route
app.get('/collections.html', (req, res) => {
    if (req.session.user) {
        res.sendFile(path.join(__dirname, '..', 'views', 'collections.html'));
    } else {
        res.send('Please login to view this page.');
    }
});

// View cards route
app.get('/cards.html', (req, res) => {
    if (req.session.user) {
        res.sendFile(path.join(__dirname, '..', 'views', 'cards.html'));
    } else {
        res.send('Please login to view this page.');
    }
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

// Retrieve all cards
app.get('/cards', (req, res) => {
    let { name, type, rarity, sortBy, sortOrder = 'ASC', attack } = req.query;
    let query = "SELECT * FROM Cards WHERE 1=1";
    let params = [];
    if (name) { query += " AND card_name LIKE ?"; params.push(`%${name}%`); }
    if (type) { query += " AND types LIKE ?"; params.push(`%${type}%`); }
    if (rarity) { query += " AND rarity = ?"; params.push(rarity); }
    if (attack) { query += " AND attacks LIKE ?"; params.push(`%${attack}%`); }
    if (sortBy) { query += ` ORDER BY ${sortBy} ${sortOrder}`; }
    else { query += " ORDER BY card_name ASC"; }
    db.query(query, params, (error, results) => {
        if (error) {
            console.error('Error retrieving cards:', error);
            res.status(500).send('Internal Server Error');
        } else {
            res.json(results);
        }
    });
});

// Start the server
const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
