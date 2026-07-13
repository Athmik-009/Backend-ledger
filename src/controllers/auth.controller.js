const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")
const emailService = require("../services/email.service")
const tokenBlackListModel = require("../models/blackList.model")

const JWT_SECRET = process.env.JWT_SECRET || "ledger-dev-secret"
if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production")
}
if (!process.env.JWT_SECRET) {
    console.warn("JWT_SECRET is not set; using insecure default for development")
}

/**
* - user register controller
* - POST /api/auth/register
*/
async function userRegisterController(req, res) {
    const { email, password, name } = req.body

    const isExists = await userModel.findOne({
        email: email
    })

    if (isExists) {
        return res.status(422).json({
            message: "User already exists with email.",
            status: "failed"
        })
    }

    const user = await userModel.create({
        email, password, name
    })

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "3d" })

    res.cookie("token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production"
    })

    res.status(201).json({
        user: {
            _id: user._id,
            email: user.email,
            name: user.name
        },
        token
    })

    // Send registration email only when explicitly enabled
    if (process.env.SEND_EMAILS === "true") {
        await emailService.sendRegistrationEmail(user.email, user.name)
    } else {
        console.log("SEND_EMAILS not enabled — skipping registration email for:", user.email)
    }
}

/**
 * - User Login Controller
 * - POST /api/auth/login
  */

async function userLoginController(req, res) {
    const { email, password } = req.body

    const user = await userModel.findOne({ email }).select("+password")

    if (!user) {
        return res.status(401).json({
            message: "Email or password is INVALID"
        })
    }

    const isValidPassword = await user.comparePassword(password)

    if (!isValidPassword) {
        return res.status(401).json({
            message: "Email or password is INVALID"
        })
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "3d" })

    res.cookie("token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production"
    })

    res.status(200).json({
        user: {
            _id: user._id,
            email: user.email,
            name: user.name
        },
        token
    })

}

async function systemUserLoginController(req, res) {
    const { email, password } = req.body

    const user = await userModel.findOne({ email }).select("+password +systemUser")

    if (!user) {
        return res.status(401).json({
            message: "Email or password is INVALID"
        })
    }

    if (!user.systemUser) {
        return res.status(403).json({
            message: "Access denied. This account is not a system user."
        })
    }

    const isValidPassword = await user.comparePassword(password)

    if (!isValidPassword) {
        return res.status(401).json({
            message: "Email or password is INVALID"
        })
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "3d" })

    res.cookie("token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production"
    })

    res.status(200).json({
        user: {
            _id: user._id,
            email: user.email,
            name: user.name,
            systemUser: true
        },
        token
    })
}

/**
 * - User Logout Controller
 * - POST /api/auth/logout
  */
async function userLogoutController(req, res) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[ 1 ]

    if (!token) {
        return res.status(200).json({
            message: "User logged out successfully"
        })
    }



    await tokenBlackListModel.create({
        token: token
    })

    res.clearCookie("token", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production"
    })

    res.status(200).json({
        message: "User logged out successfully"
    })

}


module.exports = {
    userRegisterController,
    userLoginController,
    systemUserLoginController,
    userLogoutController
}