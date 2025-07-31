// Main JavaScript for homepage functionality
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    
    // Search functionality
    const searchBtn = document.getElementById('searchBtn');
    const citySelect = document.getElementById('citySelect');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            const selectedCity = citySelect.value;
            if (selectedCity) {
                window.location.href = `/hotels?city=${encodeURIComponent(selectedCity)}`;
            } else {
                window.location.href = '/hotels';
            }
        });
    }
    
    // Handle Enter key in city select
    if (citySelect) {
        citySelect.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchBtn.click();
            }
        });
    }
});

// Search by city function for destination cards
function searchByCity(city) {
    window.location.href = `/hotels?city=${encodeURIComponent(city)}`;
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
            credentials: 'same-origin'
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Clear all client-side storage
            sessionStorage.clear();
            localStorage.clear();
            showNotification('Logged out successfully', 'success');
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        } else {
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Error logging out:', error);
        // Force logout on client side even if server request fails
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = '/';
    }
}

// Show notifications
function showNotification(message, type = 'success') {
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
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-ET', {
        style: 'currency',
        currency: 'ETB',
        minimumFractionDigits: 0
    }).format(amount).replace('ETB', '') + ' ETB';
}

// Format date
function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Generate star rating HTML
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