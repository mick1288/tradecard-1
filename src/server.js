const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5500;

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.static(path.join(__dirname, '..', 'views')));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

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

app.get('/dashboard.html', (req, res) => {
    if (req.session.user) {
        res.sendFile(path.join(__dirname, '..', 'views', 'dashboard.html'));
    } else {
        res.send('Please login to view this page.');
    }
});

app.get('/collections.html', (req, res) => {
    if (req.session.user) {
        res.sendFile(path.join(__dirname, '..', 'views', 'collections.html'));
    } else {
        res.send('Please login to view this page.');
    }
});

app.get('/api/public-collections', (req, res) => {
    // Ensure there's a logged-in user
    if (!req.session.user) {
        return res.status(401).send('Unauthorized');
    }
    
    // Query to fetch collections and their card details
    const query = `
        SELECT c.collection_name, ca.card_name, ca.types, ca.rarity
        FROM collections c
        JOIN collection_items ci ON c.collection_id = ci.collection_id
        JOIN cards ca ON ci.card_id = ca.card_id
        WHERE c.user_id = ?;
    `;
    
    db.query(query, [req.session.user.id], (error, results) => {
        if (error) {
            console.error('Error retrieving public collections:', error);
            res.status(500).send('Internal Server Error');
        } else {
            res.json(results);
        }
    });
});

app.get('/cards.html', (req, res) => {
    if (req.session.user) {
        res.sendFile(path.join(__dirname, '..', 'views', 'cards.html'));
    } else {
        res.send('Please login to view this page.');
    }
});

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

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
