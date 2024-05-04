document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('publicCollectionsContainer');
    if (!container) return;  // Only runs if the container is found

    fetch('/api/public-collections')
        .then(response => response.json())
        .then(collections => {
            container.innerHTML = '';

            if (collections.length > 0) {
                collections.forEach(item => {
                    const div = document.createElement('div');
                    div.innerHTML = `
                        <strong>Collection:</strong> ${item.collection_name} <br>
                        <strong>Card:</strong> ${item.card_name} <br>
                        <strong>Type:</strong> ${item.types} <br>
                        <strong>Rarity:</strong> ${item.rarity} <br>
                        <strong>Username:</strong> ${item.username} <br>
                    `;
                    container.appendChild(div);
                });
            } else {
                container.innerHTML = '<p>No collections found.</p>';
            }
        })
        .catch(error => console.error("Error loading public collections:", error));
});
