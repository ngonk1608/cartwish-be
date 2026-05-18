const express = require('express');
require('dotenv').config();
require('./config/passport')
const cookieParser = require("cookie-parser")
const app = express();

const PORT = process.env.PORT || 3001;

const userRoutes = require('./routes/user');
const authRoutes = require('./routes/auth')
const categoryRoutes = require('./routes/category')
const productRoutes = require('./routes/product')

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/cart-shop').then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.error('Error connecting to MongoDB:', error);
});

app.use(express.json());
app.use("/upload/category", express.static("upload/category"))
app.use("/upload/products", express.static("upload/products"))
app.use(cookieParser())

app.use("/api/users", userRoutes);
app.use('/api/auth', authRoutes)
app.use('/api/category', categoryRoutes)
app.use('/api/product', productRoutes)

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});