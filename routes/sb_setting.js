const express = require("express");
const SettingController = require("../controllers/settings");
const { authentif } = require("../middleware/authentif");
const router = express.Router();


router.use(authentif)

router.put("/setting/user", SettingController.edit_pass)

router.get("/setting/admin/all", SettingController.showAllAdmin)

router.get("/setting/admin-default", SettingController.getDataTax)
router.put("/setting/admin-default/product", SettingController.edit_admin_fee)
router.get("/setting/admin-default/product", SettingController.showAdminFee)

router.put("/setting/admin-default/voucher", SettingController.editAdminVoucher)
router.put("/setting/admin-default/doctor", SettingController.editAdminDoctor)

router.get("/setting/membership", SettingController.getMembershipData)
router.put("/setting/membership/first", SettingController.editFirstMember)
router.put("/setting/membership/silver", SettingController.editSilverMember)
router.put("/setting/membership/gold", SettingController.editGoldMember)
router.put("/setting/membership/diamond", SettingController.editDiamondMember)

router.get("/setting/skin-bex/list", SettingController.storeBex)
router.post("/setting/skin-bex/new_store", SettingController.newStoreDefault)
router.delete("/setting/skin-bex/delete_store", SettingController.deleteDefaultStore)


router.delete("/setting/delete-admin/:admin_id", SettingController.deleteSuperAdmin)
router.post("/setting/new-admin", SettingController.regisAdmin)

router.put("/setting/magic-mirror", SettingController.editMagicMirror)
router.get("/setting/magic-mirror/daily", SettingController.magicMirrorDaily)
router.get("/setting/magic-mirror/monthly", SettingController.magicMirrorMonthly)
router.get("/setting/magic-mirror/yearly", SettingController.magicMirrorYearly)


router.get("/setting/log-superadmin", SettingController.getLogSuperAdmin)

















module.exports = router
