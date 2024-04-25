const axios = require('axios');
const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',  // Your database password
    database: 'tradecard'
};

function ensureDefined(value, defaultValue = null) {
    return value !== undefined ? value : defaultValue;
}

async function populateCards() {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const response = await axios.get('https://api.pokemontcg.io/v2/cards?pageSize=60', {
            headers: { 'X-Api-Key': '3dc955ac-f17f-4c5e-9373-bce12455641e' }  // Your API key
        });
        const cards = response.data.data;

        for (const card of cards) {
            const {
                id, name, images, rarity, hp, types, evolvesFrom, abilities, attacks, weaknesses,
                retreatCost, set, flavorText, artist, releaseDate, updated_at, tcgplayer, cardmarket
            } = card;

            const description = flavorText || 'No description available.'; // Use flavor text as description

            const query = `
                INSERT INTO cards (
                    card_id, card_name, description, image_url, image_large_url, rarity, hp, types, evolves_from, abilities, attacks, weaknesses,
                    retreat_cost, set_id, set_name, series, printed_total, total, legalities, artist, release_date, 
                    updated_at, tcgplayer_url, tcgplayer_prices, cardmarket_url, cardmarket_prices
                ) VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                ) ON DUPLICATE KEY UPDATE
                    card_name = VALUES(card_name),
                    description = VALUES(description),
                    image_url = VALUES(image_url),
                    image_large_url = VALUES(image_large_url),
                    rarity = VALUES(rarity),
                    hp = VALUES(hp),
                    types = VALUES(types),
                    evolves_from = VALUES(evolves_from),
                    abilities = VALUES(abilities),
                    attacks = VALUES(attacks),
                    weaknesses = VALUES(weaknesses),
                    retreat_cost = VALUES(retreat_cost),
                    set_id = VALUES(set_id),
                    set_name = VALUES(set_name),
                    series = VALUES(series),
                    printed_total = VALUES(printed_total),
                    total = VALUES(total),
                    legalities = VALUES(legalities),
                    artist = VALUES(artist),
                    release_date = VALUES(release_date),
                    updated_at = VALUES(updated_at),
                    tcgplayer_url = VALUES(tcgplayer_url),
                    tcgplayer_prices = VALUES(tcgplayer_prices),
                    cardmarket_url = VALUES(cardmarket_url),
                    cardmarket_prices = VALUES(cardmarket_prices);
            `;

            await connection.execute(query, [
                ensureDefined(id), ensureDefined(name), description, ensureDefined(images?.small), ensureDefined(images?.large), ensureDefined(rarity),
                ensureDefined(hp), ensureDefined(types?.join(', ')), ensureDefined(evolvesFrom), JSON.stringify(abilities || {}),
                JSON.stringify(attacks || {}), JSON.stringify(weaknesses || {}), JSON.stringify(retreatCost || []), ensureDefined(set?.id),
                ensureDefined(set?.name), ensureDefined(set?.series), ensureDefined(set?.printedTotal), ensureDefined(set?.total),
                JSON.stringify(set?.legalities || {}), ensureDefined(artist), ensureDefined(releaseDate),
                ensureDefined(updated_at), ensureDefined(tcgplayer?.url), JSON.stringify(tcgplayer?.prices || {}),
                ensureDefined(cardmarket?.url), JSON.stringify(cardmarket?.prices || {})
            ]);
        }
        console.log('Cards have been successfully populated with descriptions.');
    } catch (error) {
        console.error('Failed to fetch or update database:', error);
    } finally {
        connection.end();
    }
}

populateCards();
