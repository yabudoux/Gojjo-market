// Admin Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Load initial tab
    showTab('hotels');
    setupImageUpload();
});

// Tab management
function showTab(tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from all buttons
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab and activate button
    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');
    
    // Load content based on tab
    switch(tabName) {
        case 'hotels':
            loadHotels();
            break;
        case 'bookings':
            loadBookings();
            break;
        case 'users':
            loadUsers();
            break;
    }
}

// Hotels management
async function loadHotels() {
    const container = document.getElementById('hotelsContainer');
    
    try {
        container.innerHTML = '<div class="loading">Loading hotels...</div>';
        
        const response = await fetch('/api/hotels');
        const hotels = await response.json();
        
        container.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>City</th>
                        <th>Rating</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${hotels.map(hotel => `
                        <tr>
                            <td>${hotel.name}</td>
                            <td>${hotel.city}</td>
                            <td>${hotel.rating}/5.0</td>
                            <td>${formatDate(hotel.created_at)}</td>
                            <td>
                                <button class="action-btn" onclick="editHotel(${hotel.id})" title="Edit">✏️</button>
                                <button class="action-btn delete-btn" onclick="deleteHotel(${hotel.id})" title="Delete">🗑️</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
    } catch (error) {
        console.error('Error loading hotels:', error);
        container.innerHTML = '<div class="error">Error loading hotels. Please try again.</div>';
    }
}

// Show add hotel form
function showAddHotelForm() {
    const form = document.getElementById('addHotelForm');
    form.style.display = 'block';
    
    // Reset form
    document.getElementById('hotelForm').reset();
    
    // Setup form submission
    document.getElementById('hotelForm').onsubmit = async function(e) {
        e.preventDefault();
        await saveHotel();
    };
}

// Hide add hotel form
function hideAddHotelForm() {
    document.getElementById('addHotelForm').style.display = 'none';
    
    // Reset form title and submission handler
    const form = document.getElementById('addHotelForm');
    const formTitle = form.querySelector('h3');
    formTitle.textContent = 'Add New Hotel';
    
    // Reset image upload options
    document.getElementById('uploadFile').checked = true;
    document.getElementById('fileUploadSection').style.display = 'block';
    document.getElementById('urlUploadSection').style.display = 'none';
    document.getElementById('imagePreview').style.display = 'none';
    
    // Reset form submission to handle add
    document.getElementById('hotelForm').onsubmit = async function(e) {
        e.preventDefault();
        await saveHotel();
    };
}

// Save hotel
async function saveHotel() {
    const form = document.getElementById('hotelForm');
    const formData = new FormData(form);
    
    // Handle image upload
    let imageUrl = '';
    const imageOption = document.querySelector('input[name="imageOption"]:checked').value;
    
    if (imageOption === 'file') {
        const fileInput = document.getElementById('hotelImageFile');
        if (fileInput.files[0]) {
            // In a real application, you would upload the file to a server or cloud storage
            // For now, we'll use a placeholder or convert to base64 (not recommended for production)
            imageUrl = 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg'; // Placeholder
            showNotification('Note: File upload simulation - using placeholder image', 'info');
        }
    } else {
        imageUrl = document.getElementById('hotelImageUrl').value;
    }
    
    const hotelData = {
        name: formData.get('name'),
        city: formData.get('city'),
        description: formData.get('description'),
        amenities: formData.get('amenities'),
        image_url: imageUrl || 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg',
        rating: parseFloat(formData.get('rating'))
    };
    
    try {
        const response = await fetch('/api/admin/hotels', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin',
            body: JSON.stringify(hotelData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Hotel added successfully!', 'success');
            hideAddHotelForm();
            loadHotels();
        } else if (result.redirect) {
            showNotification('Session expired. Please login again.', 'error');
            setTimeout(() => {
                window.location.href = result.redirect;
            }, 1500);
        } else {
            showNotification(result.error || 'Failed to add hotel', 'error');
        }
    } catch (error) {
        console.error('Error saving hotel:', error);
        if (error.message.includes('401') || error.message.includes('403')) {
            showNotification('Session expired. Please login again.', 'error');
            setTimeout(() => {
                window.location.href = '/login';
            }, 1500);
        } else {
            showNotification('Failed to add hotel. Please try again.', 'error');
        }
    }
}

// Edit hotel (simplified - just shows alert for now)
async function editHotel(hotelId) {
    try {
        // Fetch hotel details
        const response = await fetch(`/api/hotels/${hotelId}`);
        const hotel = await response.json();
        
        if (hotel.error) {
            showNotification('Hotel not found', 'error');
            return;
        }
        
        // Show form and populate with existing data
        const form = document.getElementById('addHotelForm');
        const formTitle = form.querySelector('h3');
        
        form.style.display = 'block';
        formTitle.textContent = 'Edit Hotel';
        
        // Populate form fields
        document.getElementById('hotelName').value = hotel.name;
        document.getElementById('hotelCity').value = hotel.city;
        document.getElementById('hotelDescription').value = hotel.description || '';
        document.getElementById('hotelAmenities').value = hotel.amenities || '';
        
        // Set image URL option and populate URL field
        document.getElementById('uploadUrl').checked = true;
        document.getElementById('fileUploadSection').style.display = 'none';
        document.getElementById('urlUploadSection').style.display = 'block';
        document.getElementById('hotelImageUrl').value = hotel.image_url || '';
        
        document.getElementById('hotelRating').value = hotel.rating;
        
        // Update form submission to handle edit
        document.getElementById('hotelForm').onsubmit = async function(e) {
            e.preventDefault();
            await updateHotel(hotelId);
        };
        
    } catch (error) {
        console.error('Error loading hotel for edit:', error);
        showNotification('Error loading hotel details', 'error');
    }
}

// Update hotel
async function updateHotel(hotelId) {
    const form = document.getElementById('hotelForm');
    const formData = new FormData(form);
    
    // Handle image upload
    let imageUrl = '';
    const imageOption = document.querySelector('input[name="imageOption"]:checked').value;
    
    if (imageOption === 'file') {
        const fileInput = document.getElementById('hotelImageFile');
        if (fileInput.files[0]) {
            // In a real application, you would upload the file to a server or cloud storage
            imageUrl = 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg'; // Placeholder
            showNotification('Note: File upload simulation - using placeholder image', 'info');
        }
    } else {
        imageUrl = document.getElementById('hotelImageUrl').value;
    }
    
    const hotelData = {
        name: formData.get('name'),
        city: formData.get('city'),
        description: formData.get('description'),
        amenities: formData.get('amenities'),
        image_url: imageUrl || 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg',
        rating: parseFloat(formData.get('rating'))
    };
    
    try {
        const response = await fetch(`/api/admin/hotels/${hotelId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin',
            body: JSON.stringify(hotelData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Hotel updated successfully!', 'success');
            hideAddHotelForm();
            loadHotels();
        } else if (result.redirect) {
            showNotification('Session expired. Please login again.', 'error');
            setTimeout(() => {
                window.location.href = result.redirect;
            }, 1500);
        } else {
            showNotification(result.error || 'Failed to update hotel', 'error');
        }
    } catch (error) {
        console.error('Error updating hotel:', error);
        if (error.message.includes('401') || error.message.includes('403')) {
            showNotification('Session expired. Please login again.', 'error');
            setTimeout(() => {
                window.location.href = '/login';
            }, 1500);
        } else {
            showNotification('Failed to update hotel. Please try again.', 'error');
        }
    }
}

// Delete hotel
async function deleteHotel(hotelId) {
    if (!confirm('Are you sure you want to delete this hotel?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/hotels/${hotelId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Hotel deleted successfully!', 'success');
            loadHotels();
        } else {
            showNotification(result.error || 'Failed to delete hotel', 'error');
        }
    } catch (error) {
        console.error('Error deleting hotel:', error);
        showNotification('Failed to delete hotel. Please try again.', 'error');
    }
}

// Load bookings
async function loadBookings() {
    const container = document.getElementById('bookingsContainer');
    
    try {
        container.innerHTML = '<div class="loading">Loading bookings...</div>';
        
        const response = await fetch('/api/admin/bookings');
        const bookings = await response.json();
        
        container.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Customer</th>
                        <th>Hotel</th>
                        <th>Room</th>
                        <th>Check-in</th>
                        <th>Check-out</th>
                        <th>Guests</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Booked</th>
                    </tr>
                </thead>
                <tbody>
                    ${bookings.map(booking => `
                        <tr>
                            <td>${booking.username}</td>
                            <td>${booking.hotel_name}<br><small>${booking.city}</small></td>
                            <td>${booking.room_type}</td>
                            <td>${formatDate(booking.check_in)}</td>
                            <td>${formatDate(booking.check_out)}</td>
                            <td>${booking.guests}</td>
                            <td>${formatCurrency(booking.total_price)}</td>
                            <td>
                                <span class="booking-status ${booking.status}">${booking.status}</span>
                            </td>
                            <td>${formatDate(booking.created_at)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
    } catch (error) {
        console.error('Error loading bookings:', error);
        container.innerHTML = '<div class="error">Error loading bookings. Please try again.</div>';
    }
}

// Load users
async function loadUsers() {
    const container = document.getElementById('usersContainer');
    
    try {
        container.innerHTML = '<div class="loading">Loading users...</div>';
        
        const response = await fetch('/api/admin/users');
        const users = await response.json();
        
        container.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Joined</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>${user.username}</td>
                            <td>${user.email}</td>
                            <td>
                                <span class="user-role ${user.role}">${user.role}</span>
                            </td>
                            <td>${formatDate(user.created_at)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
    } catch (error) {
        console.error('Error loading users:', error);
        container.innerHTML = '<div class="error">Error loading users. Please try again.</div>';
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
        ${
            type === 'success' ? 'background: #28a745;' : 
            type === 'error' ? 'background: #dc3545;' : 
            'background: #007bff;'
        }
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
        month: 'short', 
        day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Image upload functionality
function setupImageUpload() {
    const fileOption = document.getElementById('uploadFile');
    const urlOption = document.getElementById('uploadUrl');
    const fileSection = document.getElementById('fileUploadSection');
    const urlSection = document.getElementById('urlUploadSection');
    const fileInput = document.getElementById('hotelImageFile');
    const urlInput = document.getElementById('hotelImageUrl');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const imageSize = document.getElementById('imageSize');
    const imageDimensions = document.getElementById('imageDimensions');

    // Toggle between file upload and URL input
    fileOption.addEventListener('change', function() {
        if (this.checked) {
            fileSection.style.display = 'block';
            urlSection.style.display = 'none';
            urlInput.value = '';
        }
    });

    urlOption.addEventListener('change', function() {
        if (this.checked) {
            fileSection.style.display = 'none';
            urlSection.style.display = 'block';
            fileInput.value = '';
            imagePreview.style.display = 'none';
        }
    });

    // Handle file upload
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) {
            imagePreview.style.display = 'none';
            return;
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            showUploadError('Please select a valid image file (JPG, PNG, or WebP)');
            this.value = '';
            return;
        }

        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            showUploadError('File size must be less than 5MB');
            this.value = '';
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            imagePreview.style.display = 'block';
            
            // Show file size
            const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
            imageSize.textContent = `${sizeInMB} MB`;
            
            // Get image dimensions
            previewImg.onload = function() {
                imageDimensions.textContent = `${this.naturalWidth} × ${this.naturalHeight}px`;
            };
            
            showUploadSuccess('Image loaded successfully');
        };
        reader.readAsDataURL(file);
    });

    // Handle URL input
    urlInput.addEventListener('blur', function() {
        const url = this.value.trim();
        if (url) {
            validateImageUrl(url);
        }
    });
}

function showUploadError(message) {
    const container = document.querySelector('.image-upload-container');
    container.classList.add('upload-error');
    container.classList.remove('upload-success');
    
    // Remove existing messages
    const existingMessage = container.querySelector('.error-message, .success-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Add error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    container.appendChild(errorDiv);
    
    setTimeout(() => {
        container.classList.remove('upload-error');
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

function showUploadSuccess(message) {
    const container = document.querySelector('.image-upload-container');
    container.classList.add('upload-success');
    container.classList.remove('upload-error');
    
    // Remove existing messages
    const existingMessage = container.querySelector('.error-message, .success-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Add success message
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    container.appendChild(successDiv);
    
    setTimeout(() => {
        container.classList.remove('upload-success');
        if (successDiv.parentNode) {
            successDiv.remove();
        }
    }, 3000);
}

function validateImageUrl(url) {
    const img = new Image();
    img.onload = function() {
        showUploadSuccess('Image URL is valid');
    };
    img.onerror = function() {
        showUploadError('Invalid image URL or image cannot be loaded');
    };
    img.src = url;
}