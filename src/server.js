const express = require('express');
const bcrypt = require('bcrypt');
const db = require('./database');
const path = require('path');
const app = express();
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.urlencoded({ extended: true }));
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, '..', 'public', 'index.html')); });
app.get('/register.html', (req, res) => { res.sendFile(path.join(__dirname, '..', 'views', 'register.html')); });
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
                } else { res.redirect('/success.html'); }
            });
        }
    });
});
app.get('/users', (req, res) => {
    db.query('SELECT * FROM users', (error, results) => {
        if (error) {
            console.error('Error retrieving users:', error);
            res.status(500).send('Internal Server Error');
        } else { res.json(results); }
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
        } else { res.json(results); }
    });
});
const PORT = process.env.PORT || 5500;
app.listen(PORT, () => { console.log(`Server is running on port ${PORT}`); });
