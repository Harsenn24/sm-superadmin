const express = require("express");
const StoreClinicController = require("../controllers/clinics");
const router = express.Router();

router.get("/clinic/:id/list", StoreClinicController.clinicList)
router.get("/clinic/:id/voucher/all", StoreClinicController.voucher_all)
router.get("/clinic/:id/voucher/sold", StoreClinicController.voucherSold)



module.exports = router
