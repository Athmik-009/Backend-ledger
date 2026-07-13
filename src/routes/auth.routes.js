const express = require("express")
const authController = require("../controllers/auth.controller")

const router = express.Router()


/* POST /api/auth/register */
router.post("/register", authController.userRegisterController)


/* POST /api/auth/login */
router.post("/login",authController.userLoginController)

/* POST /api/auth/system/login */
router.post("/system/login", authController.systemUserLoginController)

/**
 * - POST /api/auth/logout
 */
router.post("/logout", authController.userLogoutController)



module.exports = router