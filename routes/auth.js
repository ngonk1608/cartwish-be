const express = require("express")
const router = express.Router()
const passport = require("passport")
const User = require("../model/user")
const jwt = require("jsonwebtoken")
const bcrypt = require('bcrypt');

router.get('/google',
  passport.authenticate('google', {
    scope:
      ['email', 'profile']
  }
  ));

router.get('/google/callback',
  passport.authenticate("google",
    {
      session: false,
      failureRedirect: "http://localhost:5173/login"
    }),
  async (req, res) => {
    // check user is available or not using facebookId or email
    const profile = req.user

    const { accessToken, refreshToken } = await handleOAuthCallback(profile, "googleId")

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false, // change this secure to true for production
      sameSite: 'none',
      // domain: 'api.backend.com',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    res.redirect(`http://localhost:5173/dashboard?token=${accessToken}`)
  })

router.get('/facebook',
  passport.authenticate('facebook', { scope: ["public_profile", "email"] }));

router.get('/facebook/callback',
  passport.authenticate("facebook",
    {
      session: false,
      failureRedirect: "http://localhost:5173/login"
    }),
  async (req, res) => {
    // check user is available or not using facebookId or email
    const profile = req.user
    console.log('profile :>> ', profile);
    const { accessToken, refreshToken } = await handleOAuthCallback(profile, "facebookId")

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false, // change this secure to true for production
      sameSite: 'none',
      // domain: 'api.backend.com',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    res.redirect(`http://localhost:5173/dashboard?token=${accessToken}`)
  })

const handleOAuthCallback = async (profile, providerId) => {
  let user = await User.findOne({ $or: [{ [providerId]: profile.id }, { email: profile.emails[0].value }] })

  // user available - update google id and generate token and send it to response
  if (user) {
    if (!user[providerId]) {
      user[providerId] = profile.id
      await user.save()
    }
  } else {
    //user not availble - create new user & generate token & send it to response
    user = new User({ name: profile.name, email: profile.emails[0].value, [providerId]: profile.id })

    await user.save()
  }
  const token = jwt.sign({ _id: user._id, name: user.name }, process.env.ACCESS_TOKEN_KEY,
    { expiresIn: '2h' }
  )

  const { accessToken, refreshToken } = generateTokens({ _id: user._id, name: user.name, role: user?.role });

  const newHashedRefreshToken = await bcrypt.hash(refreshToken, 10)
  user.refreshToken = newHashedRefreshToken
  await user.save()


  return { accessToken, refreshToken }
}

router.post('/refresh', async (req, res) => {
  const userRefreshToken = req.cookies.refreshToken

  if (!userRefreshToken) {
    res.status(401).json({ message: "No refresh token provided" })
  } else {
    let decodedUser
    try {
      decodedUser = jwt.verify(userRefreshToken, process.env.REFRESH_TOKEN_KEY)

    } catch (error) {
      res.status(403).json({ message: "invalid refresh token" })
    }

    console.log('decodedUser :>> ', decodedUser);

    const user = await User.findById(decodedUser._id)
    if (!user) return res.json({ message: "user not found" })

    const isValid = await bcrypt.compare(userRefreshToken, user.refreshToken)

    if (!isValid) return res.status(403).json({ message: "Refresh token is not valid" })

    const { accessToken, refreshToken } = generateTokens({ _id: user._id, name: user.name, role: user?.role });

    const newHashedRefreshToken = await bcrypt.hash(refreshToken, 10)
    user.refreshToken = newHashedRefreshToken
    await user.save()

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false, // change this secure to true for production
      sameSite: 'none',
      // domain: 'api.backend.com',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })
    res.status(201).json(accessToken);
  }
})

router.post("/logout", async (req, res) => {

  const userRefreshToken = req.cookies.refreshToken

  if (!userRefreshToken) {
    res.status(401).json({ message: "No refresh token provided" })
  } else {
    let decodedUser
    try {
      decodedUser = jwt.verify(userRefreshToken, process.env.REFRESH_TOKEN_KEY)

    } catch (error) {
      res.status(403).json({ message: "invalid refresh token" })
    }

    console.log('decodedUser :>> ', decodedUser);

    const user = await User.findById(decodedUser._id)
    if (!user) return res.json({ message: "user not found" })

    user.refreshToken = null
    await user.save()
  }

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: false, // change this secure to true for production
    sameSite: 'none',
    // domain: 'api.backend.com',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  })

  res.json({ message: "logged out successfully" })

})

const generateTokens = (data) => {
  const accessToken = jwt.sign(data, process.env.ACCESS_TOKEN_KEY,
    { expiresIn: '1d' }
  )
  const refreshToken = jwt.sign({ _id: data._id }, process.env.REFRESH_TOKEN_KEY,
    { expiresIn: '7d' }
  )
  return { accessToken, refreshToken }
}

module.exports = router