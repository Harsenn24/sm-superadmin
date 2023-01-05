const express = require("express");
const PenggunaController = require("../controllers/users");
const { authentif } = require("../middleware/authentif");
const router = express.Router();


router.use(authentif)
router.get("/user/summary", PenggunaController.userStatus)
router.get("/user/list", PenggunaController.list_user)
router.get("/user/list/:_id", PenggunaController.detailUser)
router.get("/user/cart/:_id", PenggunaController.userCart)
router.get("/user/cart/:_id/all", PenggunaController.allcart)
router.get("/user/bought/:_id", PenggunaController.bought)
router.get("/user/bought/:_id/all", PenggunaController.allBought)
router.get("/user/bought/:_id/count", PenggunaController.countBought)
router.get("/user/chat-docs/:_id", PenggunaController.historyChatDoc)
router.get("/user/history/magic-mirror/:_id", PenggunaController.history_magic_mirror)
router.get("/user/history/magic-mirror/:_id/gallery", PenggunaController.getHistoryScanMm)
router.get("/user/history/magic-mirror/:_id/list", PenggunaController.getListHistory)



module.exports = router












module.exports = router
