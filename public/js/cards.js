function searchCards() {
    const name = document.getElementById('name').value;
    const type = document.getElementById('type').value;
    const rarity = document.getElementById('rarity').value;
    const price = document.getElementById('price').value;
    const set = document.getElementById('set').value;
    const series = document.getElementById('series').value;

    const query = `?name=${name}&type=${type}&rarity=${rarity}&price=${price}&set=${set}&series=${series}`;

    fetch(`/cards${query}`)
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('cardsContainer');
            container.innerHTML = ''; // Clear previous results
            data.forEach(card => {
                const cardElem = document.createElement('div');
                cardElem.textContent = `Name: ${card.card_name}, Type: ${card.types}, Rarity: ${card.rarity}, Price: ${card.price}, Set: ${card.set_name}, Series: ${card.series}`;
                container.appendChild(cardElem);
            });
        })
        .catch(error => console.error('Error loading the cards:', error));
}
