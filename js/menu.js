/* js/menu.js */

let menuItems = [];
let cart = JSON.parse(localStorage.getItem('delight_cart')) || [];

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('menu-container');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('menu-search');

    updateCartCount();

    if (container) {
        // Show loading state
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem;"><i class="fa-solid fa-spinner fa-spin fa-2x" style="color: var(--color-primary);"></i><p>Loading menu...</p></div>';

        try {
            const res = await fetch("http://localhost:5000/api/menu");
            if (!res.ok) throw new Error('Failed to fetch menu');
            const data = await res.json();
            menuItems = data;
            renderMenu(menuItems);
        } catch (err) {
            console.error('Error fetching menu:', err);
            container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--color-error);">Error loading menu. Please try again later.</p>';
        }
    }

    // Render Items
    function renderMenu(items) {
        if (!container) return;
        container.innerHTML = '';

        if (!items || items.length === 0) {
            container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--color-text-muted);">No items found matching your criteria.</p>';
            return;
        }

        items.forEach((item, index) => {
            const delay = (index * 0.05) + 's';

            // Compatibility for MongoDB _id vs local id, and desc vs description
            const itemId = item._id || item.id;
            const description = item.desc || item.description || '';
            const tags = item.tags || [];

            let tagsHtml = '';
            if (tags.includes('veg')) tagsHtml += '<span class="tag-veg" title="Vegetarian"></span>';
            if (tags.includes('nonveg')) tagsHtml += '<span class="tag-nonveg" title="Non-Vegetarian"></span>';

            const card = document.createElement('div');
            card.className = 'menu-card fade-in-up visible'; // visible immediately since JS triggers it
            card.style.animationDelay = delay;

            card.innerHTML = `
                <img src="${item.image || 'https://via.placeholder.com/600x400?text=No+Image'}" alt="${item.name}" class="menu-card-img" loading="lazy">
                <div class="menu-card-content">
                    <div class="menu-card-header">
                        <h3 class="menu-card-title">${item.name} ${tagsHtml}</h3>
                        <span class="menu-card-price">₹${item.price}</span>
                    </div>
                    <p class="menu-card-desc">${description}</p>
                    <button class="btn btn-outline add-to-cart-btn" data-id="${itemId}" style="width: 100%;">Add to Cart</button>
                </div>
            `;
            container.appendChild(card);
        });

        // Attach event listeners to new buttons
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const item = menuItems.find(i => String(i._id || i.id) === String(id));
                if (item) addToCart(item);

                // Visual feedback
                const originalText = e.target.innerText;
                e.target.innerText = 'Added!';
                e.target.style.backgroundColor = 'var(--color-primary)';
                e.target.style.color = 'white';
                setTimeout(() => {
                    e.target.innerText = originalText;
                    e.target.style.backgroundColor = '';
                    e.target.style.color = '';
                }, 1000);
            });
        });
    }

    // Filtering
    if (filterBtns && filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active class
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Filter logic
                const filter = btn.getAttribute('data-filter');
                filterAndSearch(filter, searchInput ? searchInput.value : '');
            });
        });
    }

    // Searching
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const activeFilterBtn = document.querySelector('.filter-btn.active');
            const activeFilter = activeFilterBtn ? activeFilterBtn.getAttribute('data-filter') : 'all';
            filterAndSearch(activeFilter, e.target.value);
        });
    }

    function filterAndSearch(category, query) {
        let filtered = menuItems;

        if (category && category !== 'all') {
            filtered = filtered.filter(item => (item.category || '').toLowerCase() === category.toLowerCase());
        }

        if (query && query.trim() !== '') {
            const q = query.toLowerCase();
            filtered = filtered.filter(item => {
                const nameMatch = item.name && item.name.toLowerCase().includes(q);
                const desc = item.desc || item.description || '';
                const descMatch = desc.toLowerCase().includes(q);
                return nameMatch || descMatch;
            });
        }

        renderMenu(filtered);
    }

    // Cart Logic
    function addToCart(item) {
        const itemId = item._id || item.id;
        const existing = cart.find(i => String(i._id || i.id) === String(itemId));

        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({ ...item, quantity: 1, _id: itemId }); // Normalize ID
        }
        localStorage.setItem('delight_cart', JSON.stringify(cart));
        updateCartCount();
        if (window.Toast) Toast.success(`Added ${item.name} to cart`);
    }

    function updateCartCount() {
        const counts = document.querySelectorAll('.cart-count');
        const total = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        counts.forEach(c => {
            c.innerText = total;
            // animate
            c.style.transform = 'scale(1.2)';
            setTimeout(() => c.style.transform = 'scale(1)', 200);
        });
    }
});
