/* js/main.js */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Theme Toggle Logic
    const themeToggleBtn = document.getElementById('theme-toggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

    // Check local storage for theme
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme == 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        updateThemeIcon('dark');
    } else if (currentTheme == 'light') {
        document.body.removeAttribute('data-theme');
        updateThemeIcon('light');
    } else if (prefersDarkScheme.matches) {
        document.body.setAttribute('data-theme', 'dark');
        updateThemeIcon('dark');
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            if (document.body.getAttribute('data-theme') === 'dark') {
                document.body.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
                updateThemeIcon('light');
            } else {
                document.body.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                updateThemeIcon('dark');
            }
        });
    }

    function updateThemeIcon(theme) {
        if (!themeToggleBtn) return;
        if (theme === 'dark') {
            themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
        } else {
            themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
        }
    }

    // 2. Scroll Animations (Intersection Observer)
    const fadeElements = document.querySelectorAll('.fade-in-up');

    const appearOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const appearOnScroll = new IntersectionObserver(function (entries, appearOnScroll) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('visible');
                appearOnScroll.unobserve(entry.target);
            }
        });
    }, appearOptions);

    fadeElements.forEach(el => {
        appearOnScroll.observe(el);
    });

    // 3. Navbar logic (background change on scroll)
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('glass');
            } else {
                navbar.classList.remove('glass');
            }
        });

        // initial check
        if (window.scrollY > 50) {
            navbar.classList.add('glass');
        }
    }

    // 4. Mobile Menu Simulation
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            alert('Mobile menu placeholder function - would open a drawer/modal here.');
        });
    }

    // 5. Auth State UI Update
    const navLinksList = document.querySelector('.nav-links');
    if (navLinksList) {
        const isPagesDir = window.location.pathname.includes('/pages/');
        const pagesPath = isPagesDir ? './' : 'pages/';

        if (typeof isLoggedIn === 'function' && isLoggedIn()) {
            const user = getUser();

            if (user && user.role === 'admin') {
                const adminLi = document.createElement('li');
                adminLi.innerHTML = `<a href="${pagesPath}admin.html" class="nav-link">Dashboard</a>`;
                navLinksList.appendChild(adminLi);
            }

            const logoutLi = document.createElement('li');
            logoutLi.innerHTML = `<a href="#" class="nav-link" id="nav-logout-btn">Logout</a>`;
            navLinksList.appendChild(logoutLi);

            document.getElementById('nav-logout-btn').addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof logout === 'function') logout();
            });

        } else {
            const loginLi = document.createElement('li');
            loginLi.innerHTML = `<a href="${pagesPath}login.html" class="nav-link">Login</a>`;
            navLinksList.appendChild(loginLi);
        }
    }

    // 6. Featured Menu Logic (Home Page)
    const featuredContainer = document.getElementById('featured-menu-container');
    if (featuredContainer) {
        async function loadFeaturedMenu() {
            try {
                const res = await fetch("http://localhost:5000/api/menu");
                if (!res.ok) throw new Error('Failed to fetch menu');
                const data = await res.json();

                // Filter for specific favourites
                const favourites = ["Burger", "Pizza", "Cold Coffee"];
                const featuredItems = data.filter(item => favourites.includes(item.name));

                renderFeaturedMenu(featuredItems);
            } catch (err) {
                console.error('Error fetching featured menu:', err);
                featuredContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--color-error);">Error loading favourites. Please try again later.</p>';
            }
        }

        function renderFeaturedMenu(items) {
            featuredContainer.innerHTML = '';

            if (!items || items.length === 0) {
                featuredContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--color-text-muted);">No favourites available.</p>';
                return;
            }

            items.forEach((item, index) => {
                const delay = (index * 0.05) + 's';
                const itemId = item._id || item.id;
                let badgeHtml = '';

                if (item.name === "Masala Chai" || item.name === "Cold Coffee") {
                    badgeHtml = '<div class="badge-bestseller">Best Seller</div>';
                } else if (item.name === "Maggi" || item.name === "Pizza") {
                    badgeHtml = '<div class="badge-bestseller">Must Try</div>';
                }

                // Adjust path for image if we are on the homepage, images should be 'images/...' instead of just image paths, but the backend returns absolute paths starting with '/images/' which works from root. Wait, backend returns '/images/burger.jpg' so it works on any page. If it doesn't have a leading slash we need one, but the backend uses '/images/...'. Actually, in menu html the path is just used as is.
                let imgPath = item.image;
                if (imgPath && imgPath.startsWith('/')) { imgPath = `.${imgPath}` } else { imgPath = `./images/${imgPath}` }
                if (item.image && item.image.startsWith('/images/')) { imgPath = `.${item.image}`; }

                const card = document.createElement('div');
                card.className = 'menu-card fade-in-up visible'; // visible immediately
                card.style.animationDelay = delay;

                card.innerHTML = `
                    ${badgeHtml}
                    <img src="${imgPath}" alt="${item.name}" class="menu-card-img" loading="lazy">
                    <div class="menu-card-content">
                        <div class="menu-card-header">
                            <h3 class="menu-card-title">${item.name}</h3>
                            <span class="menu-card-price">₹${item.price}</span>
                        </div>
                        <p class="menu-card-desc">${item.desc || item.description || ''}</p>
                        <button class="btn btn-outline feature-add-to-cart-btn" data-id="${itemId}" style="width: 100%;">Add to Cart</button>
                    </div>
                `;
                featuredContainer.appendChild(card);
            });

            // Attach event listeners to new buttons
            document.querySelectorAll('.feature-add-to-cart-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const id = e.target.getAttribute('data-id');
                    const item = items.find(i => String(i._id || i.id) === String(id));
                    if (item) addFeatureToCart(item);

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

        function addFeatureToCart(item) {
            let cart = JSON.parse(localStorage.getItem('delight_cart')) || [];
            const itemId = item._id || item.id;
            const existing = cart.find(i => String(i._id || i.id) === String(itemId));

            if (existing) {
                existing.quantity += 1;
            } else {
                cart.push({ ...item, quantity: 1, _id: itemId });
            }
            localStorage.setItem('delight_cart', JSON.stringify(cart));

            // update global cart count UI
            updateGlobalCartCountFromStorage();

            if (window.Toast) Toast.success(`Added ${item.name} to cart`);
        }

        loadFeaturedMenu();
    }

    // Initial Cart Count update 
    function updateGlobalCartCountFromStorage() {
        const cart = JSON.parse(localStorage.getItem('delight_cart')) || [];
        const counts = document.querySelectorAll('.cart-count');
        const total = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        counts.forEach(c => {
            c.innerText = total;
            c.style.transform = 'scale(1.2)';
            setTimeout(() => c.style.transform = 'scale(1)', 200);
        });
    }

    // Call it immediately so all pages get right count
    updateGlobalCartCountFromStorage();
});
