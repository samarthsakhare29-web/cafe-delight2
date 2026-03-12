const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/images', express.static('images')); // Serve images statically

// Non-blocking MongoDB connection
// Replace with actual MongoDB URI if available
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cafepro';

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB connected successfully');
}).catch((error) => {
    console.error('MongoDB connection error. Starting server anyway...', error.message);
});

// Test API Route
app.get('/api/menu', (req, res) => {
    const baseUrl = req.protocol + '://' + req.get('host');
    res.json([
        {
            "id": "hot-coffee",
            "name": "Hot Coffee",
            "price": 35,
            "image": baseUrl + "/images/hot-coffee.jpg",
            "category": "Coffee"
        },
        {
            "id": "cold-coffee",
            "name": "Cold Coffee",
            "price": 70,
            "image": baseUrl + "/images/cold-coffee.jpg",
            "category": "Coffee"
        },
        {
            "id": "pizza",
            "name": "Pizza",
            "price": 199,
            "image": baseUrl + "/images/pizza.jpg",
            "category": "Food"
        },
        {
            "id": "burger",
            "name": "Burger",
            "price": 35,
            "image": baseUrl + "/images/burger.jpg",
            "category": "Food"
        },
        {
            "id": "sandwich",
            "name": "Sandwich",
            "price": 25,
            "image": baseUrl + "/images/sandwich.jpg",
            "category": "Food"
        }
    ]);
});

// Order Submission Route
app.post('/api/orders', (req, res) => {
    const order = req.body;

    // Basic validation
    if (!order || !order.items || order.items.length === 0) {
        return res.status(400).json({ message: "Invalid order data" });
    }

    // Simulate saving order (no DB required)
    console.log("New Order Received:", order);

    res.status(201).json({
        message: "Order placed successfully",
        orderId: Date.now()
    });
});

// Default route
app.get('/', (req, res) => {
    res.send('CafePro Backend is running');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
