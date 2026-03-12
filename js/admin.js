/* js/admin.js */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Route Protection
    function verifyAdmin() {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
            window.location.href = 'login.html';
            return false;
        }

        try {
            const user = JSON.parse(userStr);
            if (user.role !== 'admin') {
                alert('Access Denied. Admins only.');
                window.location.href = '../index.html';
                return false;
            }
            return true;
        } catch (e) {
            window.location.href = 'login.html';
            return false;
        }
    }

    if (!verifyAdmin()) return;

    // 2. Tab Navigation
    const navLinks = document.querySelectorAll('.admin-nav a');
    const panels = document.querySelectorAll('.admin-panel');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            // UI Update
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            panels.forEach(p => p.classList.remove('active'));
            const targetId = link.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');

            // Fetch data based on tab
            if (targetId === 'orders-panel') {
                fetchOrders();
            }
        });
    });

    // 3. Fetch Data Functions
    const ordersTbody = document.querySelector('#orders-table tbody');
    const statOrders = document.getElementById('stat-orders');

    async function fetchOrders() {
        if (!ordersTbody) return;
        ordersTbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading...</td></tr>';

        try {
            const orders = await apiFetch('/orders');

            if (statOrders) statOrders.innerText = orders.length;

            ordersTbody.innerHTML = '';

            if (orders.length === 0) {
                ordersTbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No orders found.</td></tr>';
                return;
            }

            // Sort newest first
            orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            orders.forEach(order => {
                const tr = document.createElement('tr');
                const id = order._id;

                const itemsStr = order.items.map(i => `${i.quantity}x ${i.product ? i.product.name : 'Unknown'}`).join(', ');

                tr.innerHTML = `
                    <td>...${id.slice(-6)}</td>
                    <td>${order.user ? order.user.name : 'Guest'}</td>
                    <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${itemsStr}">${itemsStr}</td>
                    <td>₹${order.totalAmount}</td>
                    <td>
                        <span class="status-badge status-${order.status}" id="badge-${id}">${order.status}</span>
                    </td>
                    <td>
                        <select class="form-control" style="padding: 0.25rem; width: auto;" onchange="updateOrderStatus('${id}', this.value)">
                            <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                            <option value="Preparing" ${order.status === 'Preparing' ? 'selected' : ''}>Preparing</option>
                            <option value="Completed" ${order.status === 'Completed' ? 'selected' : ''}>Completed</option>
                            <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </td>
                `;
                ordersTbody.appendChild(tr);
            });

        } catch (error) {
            ordersTbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: red;">Failed to load orders.</td></tr>';
            if (window.Toast) Toast.error('Failed to load orders');
        }
    }

    // Attach to window so onchange works
    window.updateOrderStatus = async function (orderId, newStatus) {
        try {
            await apiFetch(`/orders/${orderId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });

            if (window.Toast) Toast.success('Status updated');

            // update badge visually
            const badge = document.getElementById(`badge-${orderId}`);
            if (badge) {
                badge.className = `status-badge status-${newStatus}`;
                badge.innerText = newStatus;
            }

        } catch (error) {
            if (window.Toast) Toast.error('Failed to update status');
            fetchOrders(); // reload to revert select box
        }
    }

    // 4. Add Product
    const addProductForm = document.getElementById('add-product-form');
    if (addProductForm) {
        addProductForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = document.getElementById('add-prod-btn');
            const origText = btn.innerText;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
            btn.disabled = true;

            const payload = {
                name: document.getElementById('prod-name').value,
                category: document.getElementById('prod-category').value,
                price: parseFloat(document.getElementById('prod-price').value),
                description: document.getElementById('prod-desc').value,
                image: document.getElementById('prod-image').value
            };

            try {
                await apiFetch('/products', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });

                if (window.Toast) Toast.success('Product added successfully!');
                addProductForm.reset();

            } catch (error) {
                if (window.Toast) Toast.error(error.message || 'Failed to add product');
            } finally {
                btn.innerHTML = origText;
                btn.disabled = false;
            }
        });
    }

    // Initial load
    fetchOrders();
});
