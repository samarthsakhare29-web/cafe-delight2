document.addEventListener('DOMContentLoaded', () => {
    const reservationForm = document.getElementById('reservation-form');

    if (reservationForm) {
        reservationForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Gather inputs
            const name = document.getElementById('res-name').value;
            const email = document.getElementById('res-email').value;
            const phone = document.getElementById('res-phone').value;
            const date = document.getElementById('res-date').value;
            const time = document.getElementById('res-time').value;
            const guests = document.getElementById('res-guests').value;
            const tablePref = document.getElementById('res-table').value;
            const requests = document.getElementById('res-requests').value;

            // Submit Button
            const submitBtn = reservationForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

            try {
                // Construct payload
                const payload = {
                    name,
                    email,
                    phone,
                    date,
                    time,
                    guests: parseInt(guests, 10),
                    tablePreference: tablePref,
                    specialRequests: requests
                };

                // Create reservation via API
                await apiFetch('/reservations', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });

                // Show success
                if (window.Toast) {
                    Toast.success('Reservation successful! We will see you soon.');
                } else {
                    alert('Reservation successful!');
                }

                // Reset form
                reservationForm.reset();

            } catch (error) {
                console.error('Reservation error:', error);
                if (window.Toast) {
                    Toast.error(error.message || 'Failed to make reservation. Please try again.');
                } else {
                    alert('Failed to make reservation.');
                }
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = originalText;
            }
        });
    }

    // Set minimum date to today
    const dateInput = document.getElementById('res-date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }
});
