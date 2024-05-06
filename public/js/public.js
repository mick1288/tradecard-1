document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('collectionsContainer');
    if (!container) return;  // Only runs if the container is found

    fetch('/api/public-collections')
        .then(response => response.json())
        .then(collections => {
            container.innerHTML = '';  // Clear existing content

            if (collections.length > 0) {
                collections.forEach(item => {
                    const col = document.createElement('div');
                    col.className = 'col-md-4 mb-4'; // Bootstrap grid layout for responsive columns

                    const card = document.createElement('div');
                    card.className = 'card';

                    const cardBody = document.createElement('div');
                    cardBody.className = 'card-body';

                    cardBody.innerHTML = `
                        <h5 class="card-title">${item.collection_name}</h5>
                        <p class="card-text">Card: ${item.card_name}</p>
                        <p class="card-text">Rarity: ${item.rarity}</p>
                        <p class="card-text">Type: ${item.types}</p>
                        <p class="card-text">Owned by: ${item.username}</p>
                    `;

                    card.appendChild(cardBody);
                    col.appendChild(card);
                    container.appendChild(col);
                });
            } else {
                container.innerHTML = '<div class="col-12"><p class="text-center">No collections found.</p></div>';
            }
        })
        .catch(error => console.error("Error loading public collections:", error));
});
