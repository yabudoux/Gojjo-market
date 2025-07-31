// Booking page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const bookingData = JSON.parse(sessionStorage.getItem('bookingData'));
    
    if (!bookingData) {
        window.location.href = '/hotels';
        return;
    }
    
    loadBookingSummary(bookingData);
    setupBookingForm(bookingData);
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('checkIn').setAttribute('min', today);
    document.getElementById('checkOut').setAttribute('min', today);
    
    // Handle date changes
    const checkInInput = document.getElementById('checkIn');
    const checkOutInput = document.getElementById('checkOut');
    
    checkInInput.addEventListener('change', function() {
        const checkInDate = new Date(this.value);
        const nextDay = new Date(checkInDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        checkOutInput.setAttribute('min', nextDay.toISOString().split('T')[0]);
        if (checkOutInput.value && new Date(checkOutInput.value) <= checkInDate) {
            checkOutInput.value = nextDay.toISOString().split('T')[0];
        }
        calculateTotal();
    });
    
    checkOutInput.addEventListener('change', calculateTotal);
});

// Load booking summary
async function loadBookingSummary(bookingData) {
    try {
        const response = await fetch(`/api/hotels/${bookingData.hotelId}`);
        const hotel = await response.json();
        
        const bookingSummary = document.getElementById('bookingSummary');
        bookingSummary.innerHTML = `
            <div class="summary-item">
                <img src="${hotel.image_url}" alt="${hotel.name}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem;" 
                     onerror="this.src='https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg'">
                <h4>${hotel.name}</h4>
                <p>📍 ${hotel.city}</p>
                <div class="room-info">
                    <h5>${bookingData.roomType}</h5>
                    <p>👥 Up to ${bookingData.capacity} guests</p>
                    <p><strong>${formatCurrency(bookingData.price)}/night</strong></p>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading hotel details:', error);
        showNotification('Error loading booking details', 'error');
    }
}

// Setup booking form
function setupBookingForm(bookingData) {
    const form = document.getElementById('bookingForm');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const checkIn = formData.get('checkIn');
        const checkOut = formData.get('checkOut');
        const guests = parseInt(formData.get('guests'));
        
        // Validate dates
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        
        if (checkInDate >= checkOutDate) {
            showNotification('Check-out date must be after check-in date', 'error');
            return;
        }
        
        // Validate guests
        if (guests > bookingData.capacity) {
            showNotification(`This room can accommodate maximum ${bookingData.capacity} guests`, 'error');
            return;
        }
        
        // Calculate total
        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        const totalPrice = nights * bookingData.price;
        
        // Create booking
        const booking = {
            hotel_id: bookingData.hotelId,
            room_id: bookingData.roomId,
            check_in: checkIn,
            check_out: checkOut,
            guests: guests,
            total_price: totalPrice
        };
        
        try {
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify(booking)
            });
            
            const result = await response.json();
            
            if (result.success) {
                sessionStorage.removeItem('bookingData');
                showNotification('Booking confirmed successfully!', 'success');
                setTimeout(() => {
                    window.location.href = '/my-bookings';
                }, 2000);
            } else if (result.redirect) {
                showNotification('Session expired. Please login again.', 'error');
                setTimeout(() => {
                    window.location.href = result.redirect;
                }, 1500);
            } else {
                showNotification(result.error || 'Booking failed', 'error');
            }
        } catch (error) {
            console.error('Booking error:', error);
            if (error.message.includes('401')) {
                showNotification('Session expired. Please login again.', 'error');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1500);
            } else {
                showNotification('Booking failed. Please try again.', 'error');
            }
        }
    });
}

// Calculate total price
function calculateTotal() {
    const checkIn = document.getElementById('checkIn').value;
    const checkOut = document.getElementById('checkOut').value;
    const totalPriceElement = document.getElementById('totalPrice');
    
    if (checkIn && checkOut) {
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        
        if (checkInDate < checkOutDate) {
            const bookingData = JSON.parse(sessionStorage.getItem('bookingData'));
            const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
            const total = nights * bookingData.price;
            
            totalPriceElement.textContent = formatCurrency(total);
            totalPriceElement.parentElement.querySelector('h3').innerHTML = 
                `Total (${nights} night${nights > 1 ? 's' : ''}): <span id="totalPrice">${formatCurrency(total)}</span>`;
        } else {
            totalPriceElement.textContent = '0 ETB';
        }
    } else {
        totalPriceElement.textContent = '0 ETB';
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
            sessionStorage.clear();
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