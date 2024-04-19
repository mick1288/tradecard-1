const axios = require('axios');
const mysql = require('mysql2');

// Set up database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // make sure to use your actual password, if any
    database: 'tradecard',
    port: 3306 // default MySQL port
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Database connected successfully');
});

// Function to fetch and insert Pokémon data
function fetchAndInsertPokemon(pokemonId) {
    const apiUrl = `https://pokeapi.co/api/v2/pokemon/${pokemonId}`;

    axios.get(apiUrl).then(response => {
        const pokemon = response.data;
        const name = pokemon.name;
        const image_url = pokemon.sprites.front_default || '';
        const types = pokemon.types.map(type => type.type.name).join(', ');
        const hp = pokemon.stats.find(stat => stat.stat.name === 'hp').base_stat;
        const attacks = pokemon.moves.map(move => move.move.name).join(', ');
        const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

        const query = 'INSERT INTO Cards (user_id, card_name, description, image_url, created_at, updated_at, rarity, hp, types, stage, attacks, weakness) VALUES (?, ?, "Auto-generated description", ?, ?, ?, "Common", ?, ?, "Basic", ?, "None")';
        const values = [1, name, image_url, currentTime, currentTime, hp, types, attacks];

        db.query(query, values, (err, results) => {
            if (err) {
                console.error('Failed to insert data for ' + name + ': ', err);
                return;
            }
            console.log('Data inserted for ' + name);
        });
    }).catch(error => {
        console.error('Error fetching Pokémon data:', error);
    });
}

// Function to populate data for a range of Pokémon IDs
function populateData() {
    for (let i = 61; i <= 120; i++) {
        fetchAndInsertPokemon(i);
    }
}

populateData();
