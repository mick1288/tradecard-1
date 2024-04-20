const axios = require('axios');
const mysql = require('mysql2');

// Establish database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // Add your password if needed
    database: 'tradecard',
    port: 3306
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Database connected successfully');
});

// Function to get a random rarity
function getRandomRarity() {
    const rarities = ['Common', 'Uncommon', 'Rare', 'Ultra Rare', 'Secret Rare'];
    const index = Math.floor(Math.random() * rarities.length);
    return rarities[index];
}

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
        const rarity = getRandomRarity();  // Get a random rarity for each Pokémon

        const query = 'INSERT INTO Cards (user_id, card_name, description, image_url, created_at, updated_at, rarity, hp, types, stage, attacks, weakness) VALUES (?, ?, "Auto-generated description", ?, ?, ?, ?, ?, ?, "Basic", ?, "None")';
        const values = [1, name, image_url, currentTime, currentTime, rarity, hp, types, attacks];

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
    for (let i = 1; i <= 120; i++) {
        fetchAndInsertPokemon(i);
    }
}

populateData();
