const axios = require("axios")

const paypal = {
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_SECRET,
    baseUrl: process.env.PAYPAL_BASE_URL,
}

const getAccessToken = async () => {
    try {
        const response = await axios.post(`${paypal.baseUrl}/v1/oauth2/token`, "grant_type=client_credentials", {
            auth: {
                username: paypal.clientId,
                password: paypal.clientSecret
            },
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        })

        return response.data.access_token
    } catch (error) {
        console.log('error fetching access token paypal', error)
    }

}

module.exports = {
    paypal: paypal,
    getAccessToken: getAccessToken
}