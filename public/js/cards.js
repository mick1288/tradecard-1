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
            container.innerHTML = ''; // Clear previous results

            data.forEach(card => {
                const cardElem = document.createElement('div');
                cardElem.classList.add('card', 'mb-3');
                cardElem.style.width = '18rem';
                cardElem.innerHTML = `
                    <img src="${card.image_path}" class="card-img-top" alt="Image of ${card.card_name}">
                    <div class="card-body">
                        <h5 class="card-title">${card.card_name}</h5>
                        <p class="card-text"><strong>Type:</strong> ${card.types}</p>
                        <p class="card-text"><strong>Rarity:</strong> ${card.rarity}</p>
                        <p class="card-text"><strong>Set:</strong> ${card.set_name}</p>
                        <p class="card-text"><strong>Series:</strong> ${card.series}</p>
                        <a href="${card.cardmarket_url}" class="btn btn-primary">View Pricing</a>
                    </div>
                `;
                container.appendChild(cardElem);
            });
        })
        .catch(error => console.error('Error loading the cards:', error));
}
