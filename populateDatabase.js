const axios = require('axios');
const mysql = require('mysql2');
const moment = require('moment');

// Type to weakness mapping
const typeWeaknesses = {
    'fire': 'water',
    'water': 'electric',
    'electric': 'ground',
    'grass': 'fire',
    'ground': 'water',
    'psychic': 'dark',
    'dark': 'bug',
    'bug': 'fire',
    'rock': 'water',
    'ghost': 'ghost',
    'dragon': 'ice',
    'ice': 'fire',
    'steel': 'fire',
    'fairy': 'poison',
    'poison': 'psychic',
    'flying': 'electric',
    'fighting': 'fairy',
    'normal': 'fighting'
};

// Database connection setup
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
    for (let i = 1; i <= 60; i++) {
        fetchAndInsertPokemon(i);
    }
}

function fetchAndInsertPokemon(pokemonId) {
    const apiUrl = `https://pokeapi.co/api/v2/pokemon/${pokemonId}`;
    const speciesUrl = `https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`;

    axios.get(apiUrl).then(response => {
        const pokemon = response.data;
        const weaknesses = pokemon.types.map(type => typeWeaknesses[type.type.name] || 'none').join(', ');

        // Fetch species for description
        axios.get(speciesUrl).then(speciesResponse => {
            const species = speciesResponse.data;
            const description = species.flavor_text_entries.find(f => f.language.name === 'en').flavor_text.replace(/[\f\n\r]/g, ' ');

            insertPokemonData(pokemon, description, weaknesses);
        }).catch(error => {
            console.error('Error fetching species data:', error);
        });

    }).catch(error => {
        console.error('Error fetching Pokémon data:', error);
    });
}

function insertPokemonData(pokemon, description, weaknesses) {
    const name = pokemon.name;
    const image_url = pokemon.sprites.front_default || '';
    const types = pokemon.types.map(type => type.type.name).join(', ');
    const hp = pokemon.stats.find(stat => stat.stat.name === 'hp').base_stat;
    const attacks = pokemon.moves.map(move => move.move.name).join(', ');
    const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
    const query = `
        INSERT INTO Cards (user_id, card_name, description, image_url, created_at, updated_at, rarity, hp, types, stage, attacks, weakness)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    db.query(query, [1, name, description, image_url, currentTime, currentTime, 'Common', hp, types, 'Basic', attacks, weaknesses], (err, results) => {
        if (err) {
            console.error(`Failed to insert data for ${name}:`, err);
        } else {
            console.log(`Data inserted successfully for ${name}`);
        }
    });
}
