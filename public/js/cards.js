window.onload = function() {
    fetch('/cards')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('cardsContainer');
            data.forEach(card => {
                const cardElem = document.createElement('div');
                cardElem.textContent = `Name: ${card.card_name}, Description: ${card.description}`;
                container.appendChild(cardElem);
            });
        })
        .catch(error => console.error('Error loading the cards:', error));
};
