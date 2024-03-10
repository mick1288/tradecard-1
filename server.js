const express = require('express');
const bcrypt = require('bcrypt');
const db = require('./index');
const path = require('path');

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes

app.get('/register.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
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

app.get('/register.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.post('/register', (req, res) => {
    const { username, email, password } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], (error, results) => {
        if (error) {
            console.error('Error checking existing email:', error);
            res.status(500).send('Internal Server Error');
            return;
        }

        if (results.length > 0) {
            res.status(400).send('Email already registered');
            return;
        }

        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                console.error('Error hashing password:', err);
                res.status(500).send('Internal Server Error');
                return;
            }

            db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword], (error, results) => {
                if (error) {
                    console.error('Error registering user:', error);
                    res.status(500).send('Internal Server Error');
                    return;
                }

                res.redirect('/success.html');
            });
        });
    });
});
app.get('/success.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'success.html'));
});


const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
