const express = require("express")
const authMiddleware = require("../middleware/auth.middleware")
const systemController = require("../controllers/system.controller")

const router = express.Router()

router.get("/users", authMiddleware.authSystemUserMiddleware, systemController.getAllUsersController)
router.get("/users/:userId/accounts", authMiddleware.authSystemUserMiddleware, systemController.getUserAccountsController)

module.exports = router
