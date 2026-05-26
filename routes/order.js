const express = require("express")
const authMiddleWare = require("../middleware/auth")
/** @type {import('mongoose').Model<any>} */
const Order = require('../model/order')
/** @type {import('mongoose').Model<any>} */
const Cart = require('../model/cart')
const axios = require("axios")
const { paypal, getAccessToken } = require("../config/paypal")
const router = express.Router()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.post('/stripe/create-payment-intent', authMiddleWare, async (req, res) => {
    try {
        const { cartId, amount } = req.body
        if (!amount) {
            return res.status(400).json({ message: "Amount is required" })
        }
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'usd',
            automatic_payment_methods: { enabled: true },

        })

        res.status(200).json({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.log('error', error)
    }
})

router.post('/paypal/create-order', authMiddleWare, async (req, res) => {
    const token = await getAccessToken()
    const response = await axios.post(`${paypal.baseUrl}/v2/checkout/orders`, {
        intent: "CAPTURE",
        purchase_units: [
            {
                description: "Shopping Cart Order",
                amonut: {
                    currency_code: "USD",
                    value: 10
                }
            }
        ],
        application_context: {
            return_url: "",
            cancel_url: ""
        }
    }, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        }
    })

    res.json({
        approvalUrl: response.data.links.find((link) => link.rel === "approve").href
    })
})

router.post("paypal/capture-order", authMiddleWare, async (req, res) => {
    const orderId = req.body
    if (!orderId) {
        res.status(400).json({ message: "Please provide order id" })
    }
    const token = await getAccessToken()
    const response = await axios.post(`${paypal.baseUrl}/v2/checkout/orders/${orderId}/capture`, {}, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        }
    })

    res.json({
        status: response.data.status
    })
})

module.exports = router