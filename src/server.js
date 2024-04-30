const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');
const db = require('./database'); // Ensure this is pointing to the correct path where your database configuration is set up
const axios = require('axios'); // Ensure Axios is included for API requests

const app = express();
const PORT = process.env.PORT || 5500;

// Session configuration
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Middleware to serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.static(path.join(__dirname, '..', 'views')));
app.use(express.urlencoded({ extended: true }));

// Routes to serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
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

app.get('/collections', (req, res) => {
    const user_id = req.session.user?.id; 

    if (!user_id) {
        return res.status(401).send("User not logged in.");
    }

    const query = `
        SELECT 
            c.collection_name, 
            u.username, 
            ca.card_name, 
            ca.types, 
            ca.rarity 
        FROM Collections c
        JOIN collection_items ci ON c.collection_id = ci.collection_id
        JOIN Cards ca ON ci.card_id = ca.card_id
        JOIN users u ON c.user_id = u.user_id
        WHERE c.user_id = ?
    `;

    db.query(query, [user_id], (error, results) => {
        if (error) {
            console.error("Error retrieving collections:", error);
            return res.status(500).send("Internal Server Error.");
        }

        res.json(results); 
    });
});




app.get('/create-collection', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'create-collection.html'));
});

app.post('/create-collection', (req, res) => {
    const { collection_name, card_ids } = req.body;
    const user_id = req.session.user?.id;

    if (!user_id) {
        return res.status(401).send("User not logged in.");
    }

    db.query("INSERT INTO Collections (user_id, collection_name) VALUES (?, ?)", [user_id, collection_name], (error, result) => {
        if (error) {
            console.error("Error creating collection:", error);
            return res.status(500).send("Internal Server Error.");
        }

        const collection_id = result.insertId; // New collection ID

        const items = card_ids.map(card_id => [collection_id, card_id]);

        db.query("INSERT INTO collection_items (collection_id, card_id) VALUES ?", [items], (error) => {
            if (error) {
                console.error("Error adding collection items:", error);
                return res.status(500).send("Internal Server Error.");
            }

            res.redirect('/collections');
        });
    });
});


app.get('/api/card-names', (req, res) => {
    db.query("SELECT card_id, card_name FROM Cards", (error, results) => {
        if (error) {
            console.error("Error retrieving cards:", error);
            return res.status(500).send("Internal Server Error.");
        }

        res.json(results);
    });
});




app.get('/api/public-collections', (req, res) => {
    const query = `
        SELECT 
            c.collection_name, 
            ca.card_name, 
            ca.types, 
            ca.rarity, 
            u.username 
        FROM Collections c
        JOIN collection_items ci ON c.collection_id = ci.collection_id
        JOIN Cards ca ON ci.card_id = ca.card_id
        JOIN users u ON c.user_id = u.user_id
    `;

    db.query(query, (error, results) => {
        if (error) {
            console.error("Error retrieving public collections:", error);
            return res.status(500).send("Internal Server Error.");
        }

        res.json(results);
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
    db.query('SELECT username FROM users', (error, results) => {
        if (error) {
            console.error('Error retrieving users:', error);
            res.status(500).send('Internal Server Error');
        } else {
            res.json(results);
        }
    });
});

app.get('/cards', (req, res) => {
    let { name, type, rarity, price, set, series } = req.query;
    let query = "SELECT * FROM Cards WHERE 1=1";
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
    if (price) {
        query += " AND price <= ?";
        params.push(price);
    }
    if (set) {
        query += " AND set_name = ?";
        params.push(set);
    }
    if (series) {
        query += " AND series = ?";
        params.push(series);
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

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Failed to log out');
        }
        res.sendFile(path.join(__dirname, '..', 'views', 'logout-success.html')); // Make sure the path is correct
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
