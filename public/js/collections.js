document.addEventListener('DOMContentLoaded', function() {
    fetch('/api/collections')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('collectionsContainer');
            if (data.length === 0) {
                container.innerHTML = '<p>No collections found.</p>';
            } else {
                data.forEach(item => {
                    const div = document.createElement('div');
                    div.innerHTML = `<strong>Collection Name:</strong> ${item.collection_name}<br>
                                     <strong>Card Name:</strong> ${item.card_name}<br>
                                     <strong>Created At:</strong> ${item.created_at}`;
                    container.appendChild(div);
                });
            }
        })
        .catch(error => {
            console.error('Error loading collections:', error);
            container.innerHTML = '<p>Error loading collections. Please try again later.</p>';
        });
});
