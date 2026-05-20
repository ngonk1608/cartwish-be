const express = require('express');
require('dotenv').config();
require('./config/passport')
const cookieParser = require("cookie-parser")
const app = express();

const PORT = process.env.PORT || 3001;
require("winston-mongodb")
const userRoutes = require('./routes/user');
const authRoutes = require('./routes/auth')
const categoryRoutes = require('./routes/category')
const productRoutes = require('./routes/product')
const cartRoutes = require('./routes/cart')

const winston = require('winston')
const mongoose = require('mongoose');

const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports: [
        new winston.transports.Console({ level: "debug" }),
        new winston.transports.File({
            filename: 'logs/errors.log',
            level: "error"
        }),
        new winston.transports.MongoDB({
            db: 'mongodb://localhost:27017/cart-shop',
            level: 'error'
        })
    ]
})

process.on("uncaughtException", (err) => {
    logger.error("Uncaught exception", err)
    logger.on("finish", () => {
        process.exit(1)
    })
    logger.end()
})

process.on("unhandledRejection", (err) => {
    logger.error("Unhandle promise rejection", err)
    logger.on("finish", () => {
        process.exit(1)
    })
    logger.end()
})

// const rejectedPromise = new Promise((resolve, reject) => {
//     reject(new Error("Error in the promise!"))
// })

// rejectedPromise.then(() => {
//     console.log('Promise is working')
// })
mongoose.connect('mongodb://localhost:27017/cart-shop').then(() => {
    logger.info('Connected to MongoDB');
}).catch((error) => {
    logger.error('Error connecting to MongoDB:', error);
    logger.error("Uncaught exception", err)
    logger.on("finish", () => {
        process.exit(1)
    })
    logger.end()
});

app.use(express.json());
app.use("/upload/category", express.static("upload/category"))
app.use("/upload/products", express.static("upload/products"))
app.use(cookieParser())

app.use("/api/users", userRoutes);
app.use('/api/auth', authRoutes)
app.use('/api/category', categoryRoutes)
app.use('/api/product', productRoutes)
app.use('/api/cart', cartRoutes)

app.use((error, req, res, next) => {
    console.log("error middleware is running")

    logger.error(error.message, {
        stack: error.stack,
        method: req.method,
        path: req.originalUrl
    })
    res.status(500).json({ message: "Internal server error" })
})

app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});