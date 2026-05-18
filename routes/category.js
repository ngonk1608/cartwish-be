const express = require("express")
const router = express.Router()
/** @type {import('mongoose').Model<any>} */
const Category = require("../model/category")
const multer = require("multer")
const checkRole = require("../middleware/checkRole")
const authMiddleWare = require("../middleware/auth")

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'upload/category')
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

router.post('/', authMiddleWare ,checkRole("admin") ,upload.single("icon"), async (req, res) => {
    if (!req.body.name || !req.file) {
        return res.status(400).json({ message: "Name and icon are required" });
    }

    const newCategory = new Category({
        name: req.body.name,
        image: req.file.filename
    })

    await newCategory.save()

    res.status(201).json({ message: "Category added successfully", category: newCategory })
})

router.get('/', async (req, res) => {
    const categories = await Category.find().sort("name")
    res.status(200).json(categories)
})

module.exports = router