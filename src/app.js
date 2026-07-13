const path = require("path")
const express = require("express")
const cookieParser = require("cookie-parser")

const app = express()

app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "..", "views"))
app.use(express.static(path.join(__dirname, "..", "public")))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

/**
 * - Routes required
 */
const authRouter = require("./routes/auth.routes")
const accountRouter = require("./routes/account.routes")
const transactionRoutes = require("./routes/transaction.routes")
const systemRouter = require("./routes/system.routes")
const { authPageMiddleware, authSystemPageMiddleware } = require("./middleware/auth.middleware")

/**
 * - View routes
 */
app.get("/", (req, res) => {
    res.render("index", { title: "Ledger App" })
})

app.get("/login", (req, res) => {
    res.render("login", { title: "Sign in" })
})

app.get("/register", (req, res) => {
    res.render("register", { title: "Create account" })
})

app.get("/dashboard", authPageMiddleware, (req, res) => {
    res.render("dashboard", { title: "Dashboard" })
})

app.get("/system/login", (req, res) => {
    res.render("system-login", { title: "System login" })
})

app.get("/system/dashboard", authSystemPageMiddleware, (req, res) => {
    res.render("system-dashboard", { title: "System dashboard" })
})

app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" })
})

app.use("/api/auth", authRouter)
app.use("/api/accounts", accountRouter)
app.use("/api/transactions", transactionRoutes)
app.use("/api/system", systemRouter)

app.use((err, req, res, next) => {
    console.error(err)
    if (res.headersSent) {
        return next(err)
    }
    res.status(err.status || 500).json({
        message: err.message || "Internal server error"
    })
})

module.exports = app