// My Bookings page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    loadMyBookings();
});

// Load user's bookings
async function loadMyBookings() {
    const container = document.getElementById('bookingsContainer');
    
    try {
        container.innerHTML = '<div class="loading">Loading your bookings...</div>';
        
        const response = await fetch('/api/my-bookings', {
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                showNotification('Session expired. Please login again.', 'error');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1500);
                return;
            }
            throw new Error('Failed to load bookings');
        }
        
        const bookings = await response.json();
        
        if (bookings.length === 0) {
            container.innerHTML = `
                <div class="no-bookings">
                    <h3>No bookings found</h3>
                    <p>You haven't made any bookings yet.</p>
                    <a href="/hotels" class="search-btn">Browse Hotels</a>
                </div>
            `;
            return;
        }
        
        container.innerHTML = bookings.map(booking => createBookingCard(booking)).join('');
        
    } catch (error) {
        console.error('Error loading bookings:', error);
        container.innerHTML = '<div class="error">Error loading bookings. Please try again.</div>';
    }
}

// Create booking card HTML
function createBookingCard(booking) {
    const checkInDate = new Date(booking.check_in);
    const checkOutDate = new Date(booking.check_out);
    const isPast = checkOutDate < new Date();
    const isUpcoming = checkInDate > new Date();
    
    return `
        <div class="booking-card fade-in">
            <div class="booking-header-info">
                <div>
                    <div class="booking-title">${booking.hotel_name}</div>
                    <div class="hotel-city">📍 ${booking.city}</div>
                </div>
                <div class="booking-status ${booking.status}">
                    ${booking.status}
                </div>
            </div>
            
            <div class="booking-details">
                <div class="booking-detail">
                    <strong>Room:</strong> ${booking.room_type}
                </div>
                <div class="booking-detail">
                    <strong>Check-in:</strong> ${formatDate(booking.check_in)}
                </div>
                <div class="booking-detail">
                    <strong>Check-out:</strong> ${formatDate(booking.check_out)}
                </div>
                <div class="booking-detail">
                    <strong>Guests:</strong> ${booking.guests}
                </div>
                <div class="booking-detail">
                    <strong>Total:</strong> ${formatCurrency(booking.total_price)}
                </div>
                <div class="booking-detail">
                    <strong>Booked:</strong> ${formatDate(booking.created_at)}
                </div>
            </div>
            
            <div class="booking-actions">
                ${isUpcoming && booking.status === 'confirmed' ? 
                    `<button class="cancel-btn" onclick="cancelBooking(${booking.id})">Cancel Booking</button>` : 
                    ''
                }
            </div>
        </div>
    `;
}

// Cancel booking
async function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/bookings/${bookingId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Booking cancelled successfully', 'success');
            loadMyBookings(); // Reload bookings
        } else {
            showNotification(result.error || 'Failed to cancel booking', 'error');
        }
    } catch (error) {
        console.error('Error cancelling booking:', error);
        showNotification('Failed to cancel booking. Please try again.', 'error');
    }
}

// Logout function
async function logout() {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        if (response.ok) {
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Error logging out:', error);
        showNotification('Error logging out. Please try again.', 'error');
    }
}

// Utility functions
function showNotification(message, type = 'success') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 2rem;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        transition: opacity 0.3s ease;
        ${type === 'success' ? 'background: #28a745;' : 'background: #dc3545;'}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-ET', {
        style: 'currency',
        currency: 'ETB',
        minimumFractionDigits: 0
    }).format(amount).replace('ETB', '') + ' ETB';
}

function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
}