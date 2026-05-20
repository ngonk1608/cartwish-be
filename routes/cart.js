const express = require("express")
const router = express.Router()
/** @type {import('mongoose').Model<any>} */
const Cart = require("../model/cart")
/** @type {import('mongoose').Model<any>} */
const Product = require("../model/product")
const authMiddleWare = require("../middleware/auth")

router.post("/:productId", authMiddleWare, async (req, res) => {
    const { quantity } = req.body
    const productId = req.params.productId
    const userId = req.user?._id

    //validate input
    if (!quantity || !productId) {
        return res.status(400).json({ message: "Missing require field" })
    }

    // check if product exist

    const product = await Product.findById(productId)
    if (!product) {
        return res.status(404).json({ message: "Product not found" })
    }

    if (product.stock <= quantity) {
        res.status(400).json({ message: "stock is not enought" })
    }

    let cart = await Cart.findOne({ user: userId })

    if (!cart) {
        cart = new Cart({
            user: userId,
            products: [],
            totalProducts: 0,
            totalCartPrice: 0
        })
    }

    // check if product is already in cart
    const existingProductIndex = cart.products.findIndex((productItem) => productItem.productId.toString() === productId.toString())
    if (existingProductIndex !== -1) {
        if (cart.products[existingProductIndex].quantity + quantity >= product.stock) {
            return res.status(400).json({ message: "stock is not enought" })
        }
        cart.products[existingProductIndex].quantity += quantity
    } else {
        cart.products.push({
            productId: productId,
            quantity: quantity,
            title: product?.title,
            price: product.price,
            image: product.images[0],
        })
    }

    cart.totalProducts = cart.products.reduce((total, product) => {
        return total + product.quantity
    }, 0)

    cart.totalCartPrice = cart.products.reduce((total, product) => {
        return total + product.price * product.quantity
    }, 0)

    await cart.save()
    return res.status(201).json({ message: "Product added to cart successfully", cart })
})

router.get("/", authMiddleWare, async (req, res) => {
    const cart = await Cart.findOne({ user: req.user._id })
    if (!cart) {
        return res.status(404).json({ message: "Cart not found" })
    }
    res.json(cart)
})

// increase product quantity
router.patch("/increase/:productId", authMiddleWare, async (req, res) => {
    const productId = req.params.productId

    //find the current user cart

    const cart = await Cart.findOne({ user: req.user._id })


    if (!cart) {
        return res.status(404).json({ message: "Cart not found" })
    }

    // check if the product exist
    const product = await Product.findById(productId)
    if (!product) {
        return res.status(404).json({ message: "Product not found" })
    }


    // find the product in the product array
    const productIndex = cart.products.findIndex((productItem) => productItem.productId.toString() === productId.toString())

    if (productIndex === -1) {
        return res.status(404).json({ message: "Product is not in the cart" })
    }

    // increase the product quantity
    if (cart.products[productIndex].quantity === product.stock) {
        return res.status(400).json({ message: "Product is run out of stock" })
    }
    cart.products[productIndex].quantity += 1

    // update the totalProudcts and totalPrice

    cart.totalProducts += 1
    cart.totalCartPrice += product.price

    // save the cart
    await cart.save()
    res.json({ message: "Product quantity increased successfully", cart })
})

// decrease product quantity

router.patch("/decrease/:productId", authMiddleWare, async (req, res) => {
    const productId = req.params.productId

    //find the current user cart

    const cart = await Cart.findOne({ user: req.user._id })


    if (!cart) {
        return res.status(404).json({ message: "Cart not found" })
    }

    // check if the product exist
    const product = await Product.findById(productId)
    if (!product) {
        return res.status(404).json({ message: "Product not found" })
    }


    // find the product in the product array
    const productIndex = cart.products.findIndex((productItem) => productItem.productId.toString() === productId.toString())

    if (productIndex === -1) {
        return res.status(404).json({ message: "Product is not in the cart" })
    }

    // check condition for quantity one
    if (cart.products[productIndex].quantity > 1) {
        // increase the product quantity
        cart.products[productIndex].quantity -= 1
    } else {
        // remove product from products
        cart.products.splice(productIndex, 1)
    }

    // update the totalProudcts and totalPrice

    cart.totalProducts -= 1
    cart.totalCartPrice -= product.price

    // save the cart
    await cart.save()
    res.json({ message: "Product quantity decreased successfully", cart })
})

router.patch("/remove/:productId", authMiddleWare, async (req, res) => {
    const productId = req.params.productId

    //find the current user cart

    const cart = await Cart.findOne({ user: req.user._id })


    if (!cart) {
        return res.status(404).json({ message: "Cart not found" })
    }

    // check if the product exist
    const product = await Product.findById(productId)
    if (!product) {
        return res.status(404).json({ message: "Product not found" })
    }


    // find the product in the product array
    const productIndex = cart.products.findIndex((productItem) => productItem.productId.toString() === productId.toString())

    if (productIndex === -1) {
        return res.status(404).json({ message: "Product is not in the cart" })
    }

    if (cart.products.length === 1 && cart.products[productIndex].productId.toString() === productId.toString()) {
        await Cart.findByIdAndDelete(cart._id)
        return res.status(201).json({message: "Cart removed successfully"})
    }

    cart.totalProducts -= cart.products[productIndex].quantity
    cart.totalCartPrice -= cart.products[productIndex].quantity * cart.products[productIndex].price

    cart.products.splice(productIndex, 1)

    await cart.save()

    res.json({message: "Product remove successfully", cart})
})

module.exports = router