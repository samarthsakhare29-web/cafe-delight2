/* js/cart.js */

document.addEventListener('DOMContentLoaded', () => {
    const cartContainer = document.getElementById('cart-items-container');
    const subtotalEl = document.getElementById('subtotal-amount');
    const taxEl = document.getElementById('tax-amount');
    const discountRow = document.getElementById('discount-row');
    const discountEl = document.getElementById('discount-amount');
    const totalEl = document.getElementById('total-amount');
    const promoInput = document.getElementById('promo-code');
    const applyPromoBtn = document.getElementById('apply-promo');
    const promoMessage = document.getElementById('promo-message');

    let cart = JSON.parse(localStorage.getItem('delight_cart')) || [];
    let discountApplied = false;
    let discountAmount = 0;

    async function renderCart() {
        if (!cartContainer) return;

        cartContainer.innerHTML = '<div style="text-align: center; padding: 2rem;"><i class="fa-solid fa-spinner fa-spin fa-2x" style="color: var(--color-primary);"></i><p>Loading cart...</p></div>';

        // Validate cart against current menu
        try {
            const res = await fetch("http://localhost:5000/api/menu");
            if (res.ok) {
                const currentMenuOptions = await res.json();
                const validIds = currentMenuOptions.map(item => item.id || item._id);
                const updatedCart = [];

                cart.forEach(cartItem => {
                    const itemId = cartItem.id || cartItem._id;
                    const liveItem = currentMenuOptions.find(m => (m.id || m._id) === itemId);
                    if (liveItem) {
                        // Keep item, update details like price and image
                        updatedCart.push({
                            ...cartItem,
                            name: liveItem.name,
                            price: liveItem.price,
                            image: liveItem.image
                        });
                    }
                });

                if (updatedCart.length !== cart.length) {
                    cart = updatedCart;
                    localStorage.setItem('delight_cart', JSON.stringify(cart));
                }
            }
        } catch (err) {
            console.error('Failed to validate cart items with the server:', err);
        }

        cartContainer.innerHTML = '';

        if (cart.length === 0) {
            cartContainer.innerHTML = `
                <div style="text-align: center; padding: 3rem 0;">
                    <i class="fa-solid fa-basket-shopping" style="font-size: 3rem; color: var(--color-text-muted); margin-bottom: 1rem;"></i>
                    <h2 style="margin-bottom: 1rem;">Your Cart is Empty</h2>
                    <p style="color: var(--color-text-muted); margin-bottom: 2rem;">Looks like you haven't added anything to your cart yet.</p>
                    <a href="menu.html" class="btn btn-primary">Browse Menu</a>
                </div>
            `;
            updateSummary();
            return;
        }

        cart.forEach((item, index) => {
            const el = document.createElement('div');
            el.className = 'cart-item';
            el.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-details">
                    <h3 class="cart-item-title">${item.name}</h3>
                    <p class="cart-item-price">₹${item.price}</p>
                </div>
                <div class="quantity-controls">
                    <button class="qty-btn minus-btn" data-id="${item.id || item._id}" aria-label="Decrease quantity"><i class="fa-solid fa-minus"></i></button>
                    <span style="font-weight: 700; font-family: var(--font-body); min-width: 20px; text-align: center;">${item.quantity}</span>
                    <button class="qty-btn plus-btn" data-id="${item.id || item._id}" aria-label="Increase quantity"><i class="fa-solid fa-plus"></i></button>
                </div>
                <button class="removeItem" data-id="${item.id || item._id}" aria-label="Remove item"><i class="fa-regular fa-trash-can"></i></button>
            `;
            cartContainer.appendChild(el);
        });

        attachListeners();
        updateSummary();
        updateGlobalCartCount(); // In main.js technically, but we update cart count elements here
    }

    function attachListeners() {
        document.querySelectorAll('.minus-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                updateQuantity(id, -1);
            });
        });

        document.querySelectorAll('.plus-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                updateQuantity(id, 1);
            });
        });

        document.querySelectorAll('.removeItem').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                removeItem(id);
            });
        });
    }

    function updateQuantity(id, change) {
        const index = cart.findIndex(i => i.id === id);
        if (index > -1) {
            cart[index].quantity += change;
            if (cart[index].quantity <= 0) {
                cart.splice(index, 1);
            }
            saveAndRender();
        }
    }

    function removeItem(id) {
        cart = cart.filter(i => i.id !== id);
        saveAndRender();
    }

    function saveAndRender() {
        localStorage.setItem('delight_cart', JSON.stringify(cart));
        renderCart();
    }

    function updateSummary() {
        if (!subtotalEl) return;

        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        if (discountApplied && subtotal > 0) {
            discountAmount = subtotal * 0.10; // 10% off
            discountRow.style.display = 'flex';
        } else {
            discountAmount = 0;
            discountRow.style.display = 'none';
        }

        const discountedSubtotal = subtotal - discountAmount;
        const tax = discountedSubtotal * 0.05; // 5% tax
        const total = discountedSubtotal + tax;

        subtotalEl.innerText = `₹${subtotal}`;
        discountEl.innerText = `-₹${discountAmount}`;
        taxEl.innerText = `₹${tax}`;
        totalEl.innerText = `₹${total}`;

        // Disable checkout button if empty
        const checkoutBtn = document.getElementById('place-order-btn');
        if (checkoutBtn) {
            checkoutBtn.disabled = cart.length === 0;
            if (cart.length === 0) {
                checkoutBtn.style.opacity = '0.5';
                checkoutBtn.style.cursor = 'not-allowed';
            } else {
                checkoutBtn.style.opacity = '1';
                checkoutBtn.style.cursor = 'pointer';
            }
        }
    }

    function updateGlobalCartCount() {
        const counts = document.querySelectorAll('.cart-count');
        const total = cart.reduce((sum, item) => sum + item.quantity, 0);
        counts.forEach(c => c.innerText = total);
    }

    // Promo code logic
    if (applyPromoBtn) {
        applyPromoBtn.addEventListener('click', () => {
            const code = promoInput.value.trim().toUpperCase();
            if (code === 'DELIGHT10') {
                discountApplied = true;
                promoMessage.innerText = '10% discount applied!';
                promoMessage.style.color = '#4CAF50';
                promoMessage.style.display = 'block';
                updateSummary();
            } else if (code === '') {
                discountApplied = false;
                promoMessage.style.display = 'none';
                updateSummary();
            } else {
                discountApplied = false;
                promoMessage.innerText = 'Invalid promo code.';
                promoMessage.style.color = '#F44336';
                promoMessage.style.display = 'block';
                updateSummary();
            }
        });
    }

    // Payment Option Selection
    const paymentOptions = document.querySelectorAll('.payment-option');
    paymentOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            paymentOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
        });
    });

    // Checkout Form Submission (API integration)
    const checkoutForm = document.getElementById('checkout-form');
    const trackerModal = document.getElementById('tracker-modal');
    const closeTracker = document.getElementById('close-tracker');
    const progressFill = document.getElementById('progress-fill');
    const trackerStatus = document.getElementById('tracker-status');
    const trackerIcon = document.getElementById('tracker-icon');
    const trackerDesc = document.getElementById('tracker-desc');
    const placeOrderBtn = document.getElementById('place-order-btn');

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (cart.length === 0) return;

            // Gather form data
            const items = cart.map(item => ({
                product: item._id || item.id, // Ensure product ID is correctly mapped
                quantity: item.quantity,
                price: item.price
            }));

            const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) - discountAmount + (cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) - discountAmount) * 0.05;

            // Loading state
            if (placeOrderBtn) {
                placeOrderBtn.disabled = true;
                placeOrderBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
            }

            try {
                // Determine payment option
                const activePaymentOption = document.querySelector('.payment-option.active');
                const paymentMethod = activePaymentOption ? activePaymentOption.innerText.trim() : 'Cash';

                // Construct order payload (adapting to standard API structures)
                const orderData = {
                    items: items,
                    totalAmount: totalAmount,
                    paymentMethod: paymentMethod,
                    deliveryAddress: {
                        street: document.getElementById('address') ? document.getElementById('address').value : '',
                        city: document.getElementById('city') ? document.getElementById('city').value : ''
                    },
                    specialInstructions: document.getElementById('instructions') ? document.getElementById('instructions').value : ''
                };

                // Create Order on Backend
                const res = await fetch('http://localhost:5000/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                });

                if (!res.ok) {
                    throw new Error(`Request failed with status ${res.status}`);
                }
                const response = await res.json();

                if (window.Toast) Toast.success('Order placed successfully!');

                // Display tracking modal
                const orderIdStr = response.orderId || response._id || Math.floor(Math.random() * 90000) + 10000;
                const orderIdElement = document.getElementById('order-id');
                if (orderIdElement) orderIdElement.innerText = orderIdStr;

                if (trackerModal) trackerModal.classList.add('active');

                // Clear cart
                cart = [];
                localStorage.removeItem('delight_cart');
                updateGlobalCartCount();
                renderCart(); // re-render empty state behind modal

                // Simulate progression visually in the modal
                if (progressFill && trackerStatus && trackerIcon && trackerDesc) {
                    setTimeout(() => {
                        progressFill.style.width = '33%';
                        trackerStatus.innerText = 'Preparing...';
                        trackerIcon.className = 'fa-solid fa-mug-hot tracker-icon';
                        trackerDesc.innerText = 'Our baristas are crafting your order.';
                    }, 2000);

                    setTimeout(() => {
                        progressFill.style.width = '66%';
                        trackerStatus.innerText = 'Ready soon';
                        trackerIcon.className = 'fa-solid fa-bell tracker-icon';
                        trackerDesc.innerText = 'Your order is almost ready for pickup.';
                    }, 5000);

                    setTimeout(() => {
                        progressFill.style.width = '100%';
                        trackerStatus.innerText = 'Ready for Pickup!';
                        trackerIcon.className = 'fa-solid fa-bag-shopping tracker-icon';
                        trackerDesc.innerText = 'Please proceed to the counter.';
                    }, 8000);
                }

            } catch (error) {
                console.error('Checkout error:', error);
                if (window.Toast) Toast.error(error.message || 'Failed to place order.');
            } finally {
                if (placeOrderBtn) {
                    placeOrderBtn.disabled = false;
                    placeOrderBtn.innerText = 'Place Order';
                }
            }
        });
    }

    if (closeTracker) {
        closeTracker.addEventListener('click', () => {
            trackerModal.classList.remove('active');
            window.location.href = '../index.html'; // redirect home after clear
        });
    }

    // Initialize
    renderCart();
});
