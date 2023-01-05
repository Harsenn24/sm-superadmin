const express = require("express");
const LoginController = require("../controllers/login");
const { authentif } = require("../middleware/authentif");
const router = express.Router();

router.post("/auth/login", LoginController.login)
router.use(authentif)
router.post("/auth/register", LoginController.register)


module.exports = router
