const express = require("express");
const PengembalianController = require("../controllers/return");
const { authentif } = require("../middleware/authentif");
const router = express.Router();

router.use(authentif)
router.get("/return/list", PengembalianController.returnItem)
router.get("/return/list/:id", PengembalianController.returnItemDetail)
router.get("/return/list/:id/token-photo", PengembalianController.tokenPhoto)
router.get("/return/list/:id/user-photo", PengembalianController.photoUser)
router.get("/return/list/:id/user-video", PengembalianController.videoUser)
router.get("/return/list/:id/store-photo", PengembalianController.photoStore)
router.put("/return/list/:id/unprocess", PengembalianController.unprocessProduct)   
router.put("/return/list/:id/unprocess/decision", PengembalianController.returnDecision)

module.exports = router
