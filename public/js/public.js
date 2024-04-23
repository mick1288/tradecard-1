
document.addEventListener('DOMContentLoaded', function() {
    fetch('/api/public-collections')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('publicCollectionsContainer');
            data.forEach(item => {
                const div = document.createElement('div');
                div.textContent = `Collection: ${item.collection_name}, Card: ${item.card_name}, Type: ${item.types}, Rarity: ${item.rarity}`;
                container.appendChild(div);
            });
        })
        .catch(error => console.error('Error loading public collections:', error));
});
