// Hotels page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    loadHotels();
    
    // Handle city filter
    const cityFilter = document.getElementById('cityFilter');
    if (cityFilter) {
        // Set initial filter from URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const cityParam = urlParams.get('city');
        if (cityParam) {
            cityFilter.value = cityParam;
        }
        
        cityFilter.addEventListener('change', function() {
            loadHotels(this.value);
        });
    }
    
    // Handle modal
    const modal = document.getElementById('hotelModal');
    const closeBtn = document.querySelector('.close');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }
    
    if (modal) {
        window.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
});

// Load hotels from API
async function loadHotels(city = 'all') {
    const container = document.getElementById('hotelsContainer');
    
    try {
        container.innerHTML = '<div class="loading">Loading hotels...</div>';
        
        const url = city && city !== 'all' ? `/api/hotels?city=${encodeURIComponent(city)}` : '/api/hotels';
        const response = await fetch(url);
        const hotels = await response.json();
        
        if (hotels.length === 0) {
            container.innerHTML = '<div class="loading">No hotels found for the selected city.</div>';
            return;
        }
        
        container.innerHTML = hotels.map(hotel => createHotelCard(hotel)).join('');
        
    } catch (error) {
        console.error('Error loading hotels:', error);
        container.innerHTML = '<div class="error">Error loading hotels. Please try again.</div>';
    }
}

// Create hotel card HTML
function createHotelCard(hotel) {
    const amenities = hotel.amenities ? hotel.amenities.split(',').slice(0, 4) : [];
    
    return `
        <div class="hotel-card fade-in">
            <img src="${hotel.image_url}" alt="${hotel.name}" onerror="this.src='https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg'">
            <div class="hotel-info">
                <h3>${hotel.name}</h3>
                <div class="hotel-city">📍 ${hotel.city}</div>
                <div class="hotel-rating">
                    <span class="stars">${generateStarRating(hotel.rating)}</span>
                    <span>${hotel.rating}/5.0</span>
                </div>
                <div class="hotel-description">
                    ${hotel.description || 'Beautiful hotel with excellent amenities'}
                </div>
                <div class="hotel-amenities">
                    <div class="amenities-list">
                        ${amenities.map(amenity => `<span class="amenity-tag">${amenity.trim()}</span>`).join('')}
                    </div>
                </div>
                <button class="view-details-btn" onclick="viewHotelDetails(${hotel.id})">
                    View Details & Book
                </button>
            </div>
        </div>
    `;
}

// View hotel details
async function viewHotelDetails(hotelId) {
    try {
        const response = await fetch(`/api/hotels/${hotelId}`);
        const hotel = await response.json();
        
        if (hotel.error) {
            showNotification('Hotel not found', 'error');
            return;
        }
        
        const modal = document.getElementById('hotelModal');
        const hotelDetails = document.getElementById('hotelDetails');
        
        hotelDetails.innerHTML = createHotelDetailsHTML(hotel);
        modal.style.display = 'block';
        
    } catch (error) {
        console.error('Error loading hotel details:', error);
        showNotification('Error loading hotel details', 'error');
    }
}

// Create hotel details HTML
function createHotelDetailsHTML(hotel) {
    const amenities = hotel.amenities ? hotel.amenities.split(',') : [];
    
    return `
        <div class="hotel-details">
            <img src="${hotel.image_url}" alt="${hotel.name}" class="hotel-detail-image" 
                 onerror="this.src='https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg'">
            <h2>${hotel.name}</h2>
            <div class="hotel-city">📍 ${hotel.city}</div>
            <div class="hotel-rating">
                <span class="stars">${generateStarRating(hotel.rating)}</span>
                <span>${hotel.rating}/5.0</span>
            </div>
            <p>${hotel.description}</p>
            
            <div class="hotel-amenities">
                <h4>Amenities:</h4>
                <div class="amenities-list">
                    ${amenities.map(amenity => `<span class="amenity-tag">${amenity.trim()}</span>`).join('')}
                </div>
            </div>
            
            <div class="rooms-section">
                <h3>Available Rooms</h3>
                <div class="rooms-grid">
                    ${hotel.rooms.map(room => createRoomCard(room, hotel.id)).join('')}
                </div>
            </div>
        </div>
    `;
}

// Create room card HTML
function createRoomCard(room, hotelId) {
    return `
        <div class="room-card">
            <div class="room-header">
                <span class="room-type">${room.type}</span>
                <span class="room-price">${formatCurrency(room.price)}/night</span>
            </div>
            <div class="room-capacity">👥 Up to ${room.capacity} guests</div>
            <div class="room-description">${room.description}</div>
            <button class="book-room-btn" onclick="bookRoom(${hotelId}, ${room.id}, '${room.type}', ${room.price}, ${room.capacity})">
                Book This Room
            </button>
        </div>
    `;
}

// Book room function
async function bookRoom(hotelId, roomId, roomType, price, capacity) {
    // Check if user is authenticated
    try {
        const sessionResponse = await fetch('/api/session', {
            credentials: 'same-origin'
        });
        const sessionData = await sessionResponse.json();
        
        if (!sessionData.authenticated) {
            showNotification('Please login to book a room', 'error');
            setTimeout(() => {
                window.location.href = '/login';
            }, 1500);
            return;
        }
        
        // Store booking data in sessionStorage and redirect to booking page
        const bookingData = {
            hotelId,
            roomId,
            roomType,
            price,
            capacity
        };
        
        sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
        window.location.href = '/booking';
        
    } catch (error) {
        console.error('Error checking authentication:', error);
        showNotification('Please login to book a room', 'error');
    }
}

// Check authentication status and update navigation
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/session');
        const data = await response.json();
        
        const authLinks = document.getElementById('authLinks');
        if (authLinks) {
            if (data.authenticated) {
                authLinks.innerHTML = `
                    <a href="/my-bookings">My Bookings</a>
                    ${data.user.role === 'admin' ? '<a href="/admin">Admin</a>' : ''}
                    <a href="#" onclick="logout()">Logout (${data.user.username})</a>
                `;
            } else {
                authLinks.innerHTML = `
                    <a href="/login">Login</a>
                    <a href="/register">Register</a>
                `;
            }
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
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

function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let starsHtml = '';
    
    for (let i = 0; i < fullStars; i++) {
        starsHtml += '⭐';
    }
    
    if (hasHalfStar) {
        starsHtml += '⭐';
    }
    
    return starsHtml;
}