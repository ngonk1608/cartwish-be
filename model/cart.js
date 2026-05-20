const mongoose = require("mongoose")

const cartSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", require: true },
    products: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", require: true },
            quantity: { type: Number, required: true, min: 1, default: 1 },
            title: { type: String, required: true },
            price: { type: Number, required: true, min: 0 },
            image: { type: String, required: true },
        }
    ],
    totalProducts: { type: Number, required: true },
    totalCartPrice: { type: Number, required: true }
})

const Cart = mongoose.model("Cart", cartSchema)

module.exports = Cart