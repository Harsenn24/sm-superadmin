const express = require("express");
const MagicMirrorController = require("../controllers/magic_mirror");
const { authentif } = require("../middleware/authentif");
const router = express.Router();

router.use(authentif)
router.get("/magic-mirror/income", MagicMirrorController.total_Income)
router.get("/magic-mirror/total-customer", MagicMirrorController.total_customer)
router.get("/magic-mirror/monthly-customer", MagicMirrorController.monthly_customer)
router.get("/magic-mirror/yearly-customer", MagicMirrorController.yearly_customer)
router.get("/magic-mirror/free-customer", MagicMirrorController.free_Customer)
router.get("/magic-mirror/list-table", MagicMirrorController.list_magicMirror)






module.exports = router
