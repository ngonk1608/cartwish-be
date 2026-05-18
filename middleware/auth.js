const jwt = require('jsonwebtoken');

const authMiddleWare = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(" ")[1];
    try {
        const decodedUser = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
        req.user = decodedUser;
        next();
    } catch (error) {
        console.log('error :>> ', error);
        return res.status(401).json({ message: 'Invalid token' });
    }

}

module.exports = authMiddleWare;