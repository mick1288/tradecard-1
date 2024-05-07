const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');
const db = require('./database'); 
const axios = require('axios'); 

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
            ca.rarity,
            ca.image_path  
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

        
        results = results.map(item => ({
            ...item,
            image_path: item.image_path.startsWith('/') ? item.image_path : `/images/${item.image_path}`
        }));

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

        const collection_id = result.insertId;
        const itemsArray = Array.isArray(card_ids) ? card_ids : [card_ids];
        const items = itemsArray.map(card_id => [collection_id, card_id]);

        db.query("INSERT INTO collection_items (collection_id, card_id) VALUES ?", [items], (error) => {
            if (error) {
                console.error("Error adding collection items:", error);
                return res.status(500).send("Internal Server Error.");
            }

            res.redirect('/collections.html');
        });
    });
});


app.post('/delete-collection', (req, res) => {
    const collectionName = req.body.collection_name;
    const userId = req.session.user?.id;

    if (!userId) {
        return res.status(401).send("User not logged in.");
    }

    db.query("SELECT collection_id FROM collections WHERE collection_name = ? AND user_id = ?", [collectionName, userId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send("Internal Server Error.");
        }

        if (results.length === 0) {
            return res.status(404).send("Collection not found.");
        }

        const collectionId = results[0].collection_id;

        db.query("DELETE FROM collection_items WHERE collection_id = ?", [collectionId], (error) => {
            if (error) {
                console.error("Error deleting collection items:", error);
                return res.status(500).send("Failed to delete collection items.");
            }

            db.query("DELETE FROM collections WHERE collection_id = ?", [collectionId], (error) => {
                if (error) {
                    console.error("Error deleting the collection:", error);
                    return res.status(500).send("Failed to delete collection.");
                }

                
                res.redirect('/collection-deleted.html'); 
            });
        });
    });
});




app.get('/api/card-names', (req, res) => {
    db.query("SELECT card_id, card_name, image_path FROM Cards", (error, results) => {
        if (error) {
            console.error("Error retrieving cards:", error);
            return res.status(500).send("Internal Server Error.");
        }

        res.json(results);
    });
});

app.get('/public-collections.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'public-collections.html'));
});



app.get('/api/public-collections', (req, res) => {
    const query = `
        SELECT 
            Collections.collection_name, 
            Cards.card_name, 
            Cards.image_path, 
            Cards.types, 
            Cards.rarity,
            Users.username
        FROM 
            Collections
        JOIN 
            Collection_Items ON Collections.collection_id = Collection_Items.collection_id
        JOIN 
            Cards ON Collection_Items.card_id = Cards.card_id
        JOIN 
            Users ON Collections.user_id = Users.user_id;
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
    res.sendFile(path.join(__dirname, '..', 'views', 'cards.html'));
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



app.post('/delete-user', (req, res) => {
    const user_id = req.session.user?.id; 

    if (!user_id) {
        return res.status(401).send("User not logged in.");
    }

    
    const deleteCollectionItemsQuery = `
        DELETE FROM collection_items WHERE collection_id IN (
            SELECT collection_id FROM Collections WHERE user_id = ?
        )
    `;

    db.query(deleteCollectionItemsQuery, [user_id], (error) => {
        if (error) {
            console.error("Error deleting collection items:", error);
            return res.status(500).send("Internal Server Error.");
        }

        
        const deleteCollectionsQuery = `
            DELETE FROM Collections WHERE user_id = ?
        `;

        db.query(deleteCollectionsQuery, [user_id], (error) => {
            if (error) {
                console.error("Error deleting collections:", error);
                return res.status(500).send("Internal Server Error.");
            }

            
            const deleteUserQuery = `
                DELETE FROM users WHERE user_id = ?
            `;

            db.query(deleteUserQuery, [user_id], (error) => {
                if (error) {
                    console.error("Error deleting user:", error);
                    return res.status(500).send("Internal Server Error.");
                }

                req.session.destroy(err => {
                    if (err) {
                        console.error("Error ending session:", err);
                        return res.status(500).send("Failed to log out.");
                    }

                    res.redirect('/account-deleted'); 
                });
            });
        });
    });
});

app.get('/delete-user', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'delete-user.html')); 
});

app.get('/account-deleted', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'account-deleted.html')); 
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


app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Failed to log out');
        }
        res.sendFile(path.join(__dirname, '..', 'views', 'logout-success.html')); 
    });
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
