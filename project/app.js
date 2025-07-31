const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Database setup
const db = new sqlite3.Database('./hotel_booking.db');

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: 'ethiopia-hotel-secret-key-' + Date.now(),
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false, 
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        sameSite: 'lax'
    },
    rolling: true // Reset expiration on activity
}));

// Set view engine
app.set('view engine', 'html');
app.engine('html', require('fs').readFileSync);

// Initialize database
function initDatabase() {
    db.serialize(() => {
        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Hotels table
        db.run(`CREATE TABLE IF NOT EXISTS hotels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            city TEXT NOT NULL,
            description TEXT,
            amenities TEXT,
            image_url TEXT,
            rating REAL DEFAULT 4.0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Rooms table
        db.run(`CREATE TABLE IF NOT EXISTS rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hotel_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            price INTEGER NOT NULL,
            capacity INTEGER NOT NULL,
            description TEXT,
            available INTEGER DEFAULT 1,
            FOREIGN KEY (hotel_id) REFERENCES hotels (id)
        )`);

        // Bookings table
        db.run(`CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            hotel_id INTEGER NOT NULL,
            room_id INTEGER NOT NULL,
            check_in DATE NOT NULL,
            check_out DATE NOT NULL,
            guests INTEGER NOT NULL,
            total_price INTEGER NOT NULL,
            status TEXT DEFAULT 'confirmed',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (hotel_id) REFERENCES hotels (id),
            FOREIGN KEY (room_id) REFERENCES rooms (id)
        )`);

        // Insert sample data
        insertSampleData();
    });
}

function insertSampleData() {
    // Create admin user
    const adminPassword = bcrypt.hashSync('admin123', 10);
    db.run(`INSERT OR IGNORE INTO users (username, email, password, role) 
            VALUES ('admin', 'admin@ethiopiahotels.com', ?, 'admin')`, [adminPassword]);

    // Sample hotels
    const sampleHotels = [
        {
            name: 'Addis Grand Hotel',
            city: 'Addis Ababa',
            description: 'Luxury hotel in the heart of Addis Ababa with stunning city views.',
            amenities: 'Free WiFi, Swimming Pool, Restaurant, Bar, Gym, Spa',
            image_url: 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg',
            rating: 4.5
        },
        {
            name: 'Blue Nile Resort',
            city: 'Bahir Dar',
            description: 'Beautiful lakeside resort overlooking Lake Tana.',
            amenities: 'Lake View, Restaurant, Bar, Boat Tours, WiFi',
            image_url: 'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg',
            rating: 4.3
        },
        {
            name: 'Hawassa Lake Hotel',
            city: 'Hawassa',
            description: 'Comfortable accommodation with panoramic lake views.',
            amenities: 'Lake View, Restaurant, Conference Room, WiFi, Parking',
            image_url: 'https://images.pexels.com/photos/210265/pexels-photo-210265.jpeg',
            rating: 4.1
        }
    ];

    sampleHotels.forEach(hotel => {
        db.run(`INSERT OR IGNORE INTO hotels (name, city, description, amenities, image_url, rating) 
                VALUES (?, ?, ?, ?, ?, ?)`, 
                [hotel.name, hotel.city, hotel.description, hotel.amenities, hotel.image_url, hotel.rating]);
    });

    // Sample rooms
    const sampleRooms = [
        { hotel_id: 1, type: 'Standard Room', price: 2500, capacity: 2, description: 'Comfortable room with city view' },
        { hotel_id: 1, type: 'Deluxe Suite', price: 4500, capacity: 4, description: 'Spacious suite with premium amenities' },
        { hotel_id: 2, type: 'Lake View Room', price: 3000, capacity: 2, description: 'Room with beautiful lake view' },
        { hotel_id: 2, type: 'Family Room', price: 4000, capacity: 6, description: 'Large room perfect for families' },
        { hotel_id: 3, type: 'Standard Room', price: 2000, capacity: 2, description: 'Cozy room with lake view' },
        { hotel_id: 3, type: 'Executive Suite', price: 3500, capacity: 4, description: 'Premium suite with business amenities' }
    ];

    sampleRooms.forEach(room => {
        db.run(`INSERT OR IGNORE INTO rooms (hotel_id, type, price, capacity, description) 
                VALUES (?, ?, ?, ?, ?)`, 
                [room.hotel_id, room.type, room.price, room.capacity, room.description]);
    });
}

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            res.status(401).json({ error: 'Authentication required', redirect: '/login' });
        } else {
            res.redirect('/login');
        }
    }
}

function requireAdmin(req, res, next) {
    if (req.session.userId && req.session.userRole === 'admin') {
        next();
    } else {
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            res.status(403).json({ error: 'Admin access required', redirect: '/login' });
        } else {
            res.redirect('/login');
        }
    }
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

app.get('/hotels', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'hotels.html'));
});

app.get('/booking', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'booking.html'));
});

app.get('/my-bookings', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'my-bookings.html'));
});

app.get('/admin', requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'contact.html'));
});

// API Routes
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`,
            [username, email, hashedPassword], function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ error: 'Username or email already exists' });
                    }
                    return res.status(500).json({ error: 'Registration failed' });
                }
                res.json({ success: true, message: 'Registration successful' });
            });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err || !user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.userRole = user.role;

        res.json({ 
            success: true, 
            user: { 
                id: user.id, 
                username: user.username, 
                role: user.role 
            } 
        });
    });
});

app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Session destruction error:', err);
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true });
    });
});

app.get('/api/hotels', (req, res) => {
    const { city } = req.query;
    let query = `SELECT * FROM hotels`;
    let params = [];
    
    if (city && city !== 'all') {
        query += ` WHERE city = ?`;
        params.push(city);
    }
    
    db.all(query, params, (err, hotels) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch hotels' });
        }
        res.json(hotels);
    });
});

app.get('/api/hotels/:id', (req, res) => {
    const hotelId = req.params.id;
    
    db.get(`SELECT * FROM hotels WHERE id = ?`, [hotelId], (err, hotel) => {
        if (err || !hotel) {
            return res.status(404).json({ error: 'Hotel not found' });
        }
        
        db.all(`SELECT * FROM rooms WHERE hotel_id = ?`, [hotelId], (err, rooms) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch rooms' });
            }
            
            res.json({ ...hotel, rooms });
        });
    });
});

app.post('/api/bookings', requireAuth, (req, res) => {
    const { hotel_id, room_id, check_in, check_out, guests, total_price } = req.body;
    const user_id = req.session.userId;
    
    db.run(`INSERT INTO bookings (user_id, hotel_id, room_id, check_in, check_out, guests, total_price) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user_id, hotel_id, room_id, check_in, check_out, guests, total_price], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Booking failed' });
            }
            res.json({ success: true, booking_id: this.lastID });
        });
});

app.get('/api/my-bookings', requireAuth, (req, res) => {
    const userId = req.session.userId;
    
    db.all(`SELECT b.*, h.name as hotel_name, h.city, r.type as room_type 
            FROM bookings b 
            JOIN hotels h ON b.hotel_id = h.id 
            JOIN rooms r ON b.room_id = r.id 
            WHERE b.user_id = ? 
            ORDER BY b.created_at DESC`, [userId], (err, bookings) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch bookings' });
        }
        res.json(bookings);
    });
});

app.delete('/api/bookings/:id', requireAuth, (req, res) => {
    const bookingId = req.params.id;
    const userId = req.session.userId;
    
    db.run(`DELETE FROM bookings WHERE id = ? AND user_id = ?`, [bookingId, userId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to cancel booking' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        res.json({ success: true });
    });
});

// Admin API Routes
app.get('/api/admin/bookings', requireAdmin, (req, res) => {
    db.all(`SELECT b.*, h.name as hotel_name, h.city, r.type as room_type, u.username 
            FROM bookings b 
            JOIN hotels h ON b.hotel_id = h.id 
            JOIN rooms r ON b.room_id = r.id 
            JOIN users u ON b.user_id = u.id 
            ORDER BY b.created_at DESC`, (err, bookings) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch bookings' });
        }
        res.json(bookings);
    });
});

app.get('/api/admin/users', requireAdmin, (req, res) => {
    db.all(`SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC`, (err, users) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch users' });
        }
        res.json(users);
    });
});

app.post('/api/admin/hotels', requireAdmin, (req, res) => {
    const { name, city, description, amenities, image_url, rating } = req.body;
    
    db.run(`INSERT INTO hotels (name, city, description, amenities, image_url, rating) 
            VALUES (?, ?, ?, ?, ?, ?)`,
        [name, city, description, amenities, image_url, rating || 4.0], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to add hotel' });
            }
            res.json({ success: true, hotel_id: this.lastID });
        });
});

app.put('/api/admin/hotels/:id', requireAdmin, (req, res) => {
    const hotelId = req.params.id;
    const { name, city, description, amenities, image_url, rating } = req.body;
    
    db.run(`UPDATE hotels SET name = ?, city = ?, description = ?, amenities = ?, image_url = ?, rating = ? 
            WHERE id = ?`,
        [name, city, description, amenities, image_url, rating, hotelId], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to update hotel' });
            }
            res.json({ success: true });
        });
});

app.delete('/api/admin/hotels/:id', requireAdmin, (req, res) => {
    const hotelId = req.params.id;
    
    db.run(`DELETE FROM hotels WHERE id = ?`, [hotelId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to delete hotel' });
        }
        res.json({ success: true });
    });
});

app.get('/api/session', (req, res) => {
    // Refresh session on each check
    if (req.session.userId) {
        req.session.touch();
    }
    
    if (req.session.userId) {
        res.json({
            authenticated: true,
            user: {
                id: req.session.userId,
                username: req.session.username,
                role: req.session.userRole
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Initialize database and start server
initDatabase();

app.listen(PORT, () => {
    console.log(`Ethiopia Hotel Booking System running on http://localhost:${PORT}`);
});