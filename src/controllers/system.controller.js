const userModel = require("../models/user.model")
const accountModel = require("../models/account.model")

async function getAllUsersController(req, res) {
    try {
        const users = await userModel.find({}).select("-password").lean()

        res.status(200).json({ users })
    } catch (error) {
        res.status(500).json({ message: "Unable to load users", error: error.message })
    }
}

async function getUserAccountsController(req, res) {
    try {
        const { userId } = req.params
        const accounts = await accountModel.find({ user: userId }).lean()

        res.status(200).json({ accounts })
    } catch (error) {
        res.status(500).json({ message: "Unable to load user accounts", error: error.message })
    }
}

module.exports = {
    getAllUsersController,
    getUserAccountsController
}
