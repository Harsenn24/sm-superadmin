const express = require("express");
const VoucherController = require("../controllers/voucherClinic");
const { authentif } = require("../middleware/authentif");
const router = express.Router();

router.use(authentif)

router.get("/vouchers/total-clinic", VoucherController.total_clinic)
router.get("/vouchers/total-active", VoucherController.voucher_active)
router.get("/vouchers/total-sale", VoucherController.voucher_sale)



module.exports = router
