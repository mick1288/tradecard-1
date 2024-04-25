
document.addEventListener('DOMContentLoaded', function() {
    fetch('/api/public-collections')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('publicCollectionsContainer');
            if (data.length === 0) {
                container.innerHTML = '<p>No collections found.</p>';
            } else {
                data.forEach(item => {
                    const div = document.createElement('div');
                    div.innerHTML = `<strong>Collection:</strong> ${item.collection_name}, <strong>Card:</strong> ${item.card_name}, <strong>Type:</strong> ${item.types}, <strong>Rarity:</strong> ${item.rarity}`;
                    container.appendChild(div);
                });
            }
        })
        .catch(error => {
            console.error('Error loading public collections:', error);
            container.innerHTML = '<p>Error loading collections.</p>';
        });
});
