const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")
const tokenBlackListModel = require("../models/blackList.model")

const JWT_SECRET = process.env.JWT_SECRET || "ledger-dev-secret"
if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production")
}
if (!process.env.JWT_SECRET) {
    console.warn("JWT_SECRET is not set; using insecure default for development")
}



async function authMiddleware(req, res, next) {

    const token = req.cookies.token || req.headers.authorization?.split(" ")[ 1 ]

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, token is missing"
        })
    }

    const isBlacklisted = await tokenBlackListModel.findOne({ token })

    if (isBlacklisted) {
        return res.status(401).json({
            message: "Unauthorized access, token is invalid"
        })
    }

    try {

        const decoded = jwt.verify(token, JWT_SECRET)

        const user = await userModel.findById(decoded.userId)

        if (!user) {
            return res.status(401).json({
                message: "Unauthorized access, user not found"
            })
        }

        req.user = user

        return next()

    } catch (err) {
        return res.status(401).json({
            message: "Unauthorized access, token is invalid"
        })
    }
}
async function authSystemUserMiddleware(req, res, next) {

    const token = req.cookies.token || req.headers.authorization?.split(" ")[ 1 ]

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, token is missing"
        })
    }

    const isBlacklisted = await tokenBlackListModel.findOne({ token })

    if (isBlacklisted) {
        return res.status(401).json({
            message: "Unauthorized access, token is invalid"
        })
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET)

        const user = await userModel.findById(decoded.userId).select("+systemUser")

        if (!user) {
            return res.status(401).json({
                message: "Unauthorized access, user not found"
            })
        }

        if (!user.systemUser) {
            return res.status(403).json({
                message: "Forbidden access, not a system user"
            })
        }

        req.user = user

        return next()
    }
    catch (err) {
        return res.status(401).json({
            message: "Unauthorized access, token is invalid"
        })
    }

}

function setNoCacheHeaders(res) {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    res.set("Pragma", "no-cache")
    res.set("Expires", "0")
}

async function authPageMiddleware(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    if (!token) {
        return res.redirect("/login")
    }

    const isBlacklisted = await tokenBlackListModel.findOne({ token })

    if (isBlacklisted) {
        res.clearCookie("token", {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production"
        })
        return res.redirect("/login")
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET)
        const user = await userModel.findById(decoded.userId)

        if (!user) {
            res.clearCookie("token", {
                httpOnly: true,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production"
            })
            return res.redirect("/login")
        }

        req.user = user
        setNoCacheHeaders(res)
        return next()
    } catch (err) {
        res.clearCookie("token", {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production"
        })
        return res.redirect("/login")
    }
}

async function authSystemPageMiddleware(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    if (!token) {
        return res.redirect("/system/login")
    }

    const isBlacklisted = await tokenBlackListModel.findOne({ token })

    if (isBlacklisted) {
        res.clearCookie("token", {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production"
        })
        return res.redirect("/system/login")
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET)
        const user = await userModel.findById(decoded.userId).select("+systemUser")

        if (!user || !user.systemUser) {
            res.clearCookie("token", {
                httpOnly: true,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production"
            })
            return res.redirect("/system/login")
        }

        req.user = user
        setNoCacheHeaders(res)
        return next()
    } catch (err) {
        res.clearCookie("token", {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production"
        })
        return res.redirect("/system/login")
    }
}

module.exports = {
    authMiddleware,
    authSystemUserMiddleware,
    authPageMiddleware,
    authSystemPageMiddleware
}