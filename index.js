const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'tradecard',
    password: '',
    port: '3306'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Database connected successfully');
});

module.exports = db;
