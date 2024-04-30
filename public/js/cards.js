function searchCards() {
    const name = document.getElementById('name').value;
    const type = document.getElementById('type').value;
    const rarity = document.getElementById('rarity').value;
    const set = document.getElementById('set').value;
    const series = document.getElementById('series').value;

    const query = `?name=${name}&type=${type}&rarity=${rarity}&set=${set}&series=${series}`;

    fetch(`/cards${query}`)
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('cardsContainer');
            container.innerHTML = ''; 

            data.forEach(card => {
                const cardElem = document.createElement('div');
                cardElem.innerHTML = `
                    <strong>Name:</strong> ${card.card_name}<br>
                    <strong>Type:</strong> ${card.types}<br>
                    <strong>Rarity:</strong> ${card.rarity}<br>
                    <strong>Set:</strong> ${card.set_name}<br>
                    <strong>Series:</strong> ${card.series}<br>
                    <a href="${card.cardmarket_url}">View Pricing</a>
                `;
                container.appendChild(cardElem);
            });
        })
        .catch(error => console.error('Error loading the cards:', error));
}
