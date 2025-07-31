// Contact page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    setupContactForm();
});

// Setup contact form
function setupContactForm() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(contactForm);
            const contactData = {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                subject: formData.get('subject'),
                message: formData.get('message')
            };
            
            // Validate form
            if (!contactData.firstName || !contactData.lastName || !contactData.email || !contactData.subject || !contactData.message) {
                showNotification('Please fill in all required fields', 'error');
                return;
            }
            
            // Simulate form submission (in a real app, this would send to server)
            showNotification('Thank you for your message! We will get back to you soon.', 'success');
            contactForm.reset();
            
            // In a real application, you would send this data to your server:
            // submitContactForm(contactData);
        });
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

// Show notifications
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