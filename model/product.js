const mongoose = require("mongoose")

const productSchema = mongoose.Schema({
    title: { type: String, required: true, maxLength: 200 },
    description: { type: String, required: true, minLength: 10 },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    images: { type: [String], required: true },
    review: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
            rating: { type: Number, required: true, min: 0 },
            comment: { type: String }
        }
    ]
})

const Product = mongoose.model("Product", productSchema)

module.exports = Product