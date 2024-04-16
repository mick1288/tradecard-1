const axios = require('axios');
const mysql = require('mysql2');
const moment = require('moment');

// Set up database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',  // Update with your actual username
    password: '',  // If there's no password
    database: 'tradecard'  // Ensure this is the correct database name
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the database successfully');
    fetchData();
});

function fetchData() {
    console.log("Starting to fetch data...");
    for (let i = 1; i <= 60; i++) {
        fetchAndInsertPokemon(i);
    }
}

function fetchAndInsertPokemon(pokemonId) {
    const apiUrl = `https://pokeapi.co/api/v2/pokemon/${pokemonId}`;
    const speciesUrl = `https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`;

    axios.get(apiUrl).then(response => {
        const pokemon = response.data;
        console.log(`Received data for ${pokemon.name}`);
        const name = pokemon.name;
        const image_url = pokemon.sprites.front_default || '';
        const types = pokemon.types.map(type => type.type.name).join(', ');
        const hp = pokemon.stats.find(stat => stat.stat.name === 'hp').base_stat;
        const attacks = pokemon.moves.map(move => move.move.name).join(', ');

        // Fetching additional species information for description
        axios.get(speciesUrl).then(speciesResponse => {
            const species = speciesResponse.data;
            const description = species.flavor_text_entries.find(f => f.language.name === 'en').flavor_text.replace(/[\n\f\r]/g, ' ');
            const rarity = 'Common'; // Simplified example, adjust as needed
            const stage = 'Basic'; // Simplified example, adjust as needed
            const weakness = 'None'; // Simplified example, you might need more logic to determine this

            const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
            const query = `
                INSERT INTO Cards (user_id, card_name, description, image_url, created_at, updated_at, rarity, hp, types, stage, attacks, weakness)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            `;
            db.query(query, [1, name, description, image_url, currentTime, currentTime, rarity, hp, types, stage, attacks, weakness], (err, results) => {
                if (err) {
                    console.error(`Failed to insert data for ${name}:`, err);
                } else {
                    console.log(`Data inserted successfully for ${name}`);
                }
            });
        }).catch(error => {
            console.error('Error fetching species data:', error);
        });
    }).catch(error => {
        console.error('Error fetching data:', error);
    });
}
    