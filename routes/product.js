const express = require("express")
const router = express.Router()
const authMiddleWare = require('../middleware/auth');
const checkRole = require("../middleware/checkRole");
const fs = require("fs/promises")
const path = require("path")
/** @type {import('mongoose').Model<any>} */
const Product = require("../model/product")
const multer = require("multer");
const Category = require("../model/category");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'upload/products')
    },
    filename: (req, file, cb) => {
        const timeStamp = Date.now()
        const originalName = file.originalname.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.-]/g, "")
        cb(null, `${timeStamp}-${originalName}`)
    }
})

const fileFilter = (req, file, cb) => {
    const allowTypes = ['image/jpg', 'image/png', 'image/gif', 'image/jpeg']

    if (allowTypes.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error("Invalid file type, only jpg, png and gif are allowed"), false)
    }
}

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024
    }
})


router.post('/', authMiddleWare, checkRole("seller"), upload.array("images", 8), async (req, res) => {
    const { title, description, category, price, stock } = req.body
    const images = req.files.map(image => image.filename)

    if (images.length === 0) {
        return res.status(400).json({ message: "At least 1 image is required!" })
    }
    const newProduct = new Product({
        title,
        description,
        category,
        price,
        stock,
        images,
        seller: req.user?._id
    })
    await newProduct.save()
    res.status(201).json({ message: "create product successfully", product: newProduct })
})

router.get('/', async (req, res) => {
    const page = parseInt(req.query.page) || 1
    const perPage = parseInt(req.query.perPage) || 8

    const queryCategory = req.query.category || null
    const querySearch = req.query.search || null
    let query = {}
    if (queryCategory) {
        const category = await Category.findOne({ name: queryCategory })
        if (!category) {
            return res.status(404).json({ message: "Category not found" })
        }
        query.category = category._id
    }

    if (querySearch) {
        query.title = { $regex: querySearch, $options: "i" }
    }

    const products = await Product.find(query).select("-description -seller -category -__v")
        .skip((page - 1) * perPage).limit(perPage).lean()
    const updatedProducts = products.map((product) => {
        const numberOfReviews = product.review.length
        const sumOfRating = product.review.reduce((sum, review) => sum + review.rating, 0)
        const averageRating = sumOfRating / (numberOfReviews || 1)
        return {
            ...product,
            images: product.images[0],
            review: {
                numberOfReviews,
                averageRating
            }
        }
    })
    const totalProducts = await Product.countDocuments(querySearch)
    const totalPages = Math.ceil(totalProducts / perPage)
    res.json({
        products: updatedProducts, total: totalProducts, totalPages: totalPages,
        currentPage: page, perPage
    })
})

router.get("/suggestion", async (req, res, next) => {
    const search = req.query.search
    const products = await Product.find({ title: { $regex: search, $options: "i" } }).select("_id title").limit(10)

    res.json(products)
})

router.get('/:id', async (req, res) => {
    const product =
        await Product.findById(req.params.id)
            .populate("seller", "_id name email")
            .populate("review.user", "_id name email")
            .select("-category -__v")

    if (!product) {
        return res.status(404).json({ message: "Product not found" })
    }
    res.json(product)
})

router.delete('/:id', authMiddleWare, async (req, res) => {
    const productId = req.params.id
    const product = await Product.findById(productId).select("seller images")
    if (!product) {
        return res.status(404).json({ message: "Product not found" })
    }
    if (req.user.role === 'admin' || req.user._id.toString() === product.seller.toString()) {

        if (product.images && product.images.length > 0) {
            product.images.forEach(async (imageName) => {
                const fullPath = path.join(__dirname, "../upload/products", imageName)
                try {
                    await fs.unlink(fullPath)
                } catch (error) {
                    console.log(`error deleting file ${fullPath}`, error)
                }
            })
        }
        await product.deleteOne()

        res.json({ message: "Delete product successfully" })
    }
    return res.status(403).json({ message: "Access denied! only admin and seller can delete this product" })
})

module.exports = router