document.addEventListener('DOMContentLoaded', () => {
    fetch('/collections')
        .then(response => response.json())
        .then(collections => {
            const container = document.getElementById('collectionsContainer');

            container.innerHTML = ''; // Clear previous results

            if (collections.length > 0) {
                collections.forEach(item => {
                    const div = document.createElement('div');
                    div.innerHTML = `
                        <strong>Collection Name:</strong> ${item.collection_name} <br>
                        <strong>Card Name:</strong> ${item.card_name} <br>
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
        .catch;(error => console.error("Error loading collections:", error));
});
