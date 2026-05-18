const checkSeller = (req, res, next) => {
    if (!req.user || req.user.role !== "seller") {
        return res.status(403).json({ message: "Access denied! Seller ony!" })
    }
    next()
}

module.exports = checkSeller