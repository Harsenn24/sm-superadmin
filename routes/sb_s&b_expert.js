const express = require("express");
const { SkinBeautyController } = require("../controllers/s&b_expert");
const { authentif } = require("../middleware/authentif");
const router = express.Router();


router.use(authentif)

router.get("/skin-beauty/list", SkinBeautyController.table_skinBeauty)
router.get("/skin-beauty/list/:id", SkinBeautyController.detailDocs)
router.get("/skin-beauty/chart-consult/:id", SkinBeautyController.chartConsult)
router.get("/skin-beauty/list-consult/:id", SkinBeautyController.listConsult)
router.get("/skin-beauty/list-review/:id", SkinBeautyController.reviewDoctor)






module.exports = router
