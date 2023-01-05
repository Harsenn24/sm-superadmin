const express = require("express");
const { DashboardController } = require("../controllers/dashboard");
const { authentif } = require("../middleware/authentif");
const router = express.Router();

router.use(authentif)

router.get("/dashboard/net-income", DashboardController.net_income)
router.get("/dashboard/statistic/net-income", DashboardController.netIncomeChart)
router.get("/dashboard/total-user", DashboardController.total_pengguna)
router.get("/dashboard/total-seller", DashboardController.total_seller)

router.get("/dashboard/magic-mirror-percentage", DashboardController.magic_mirror_percentage)
router.get("/dashboard/statistic-seller", DashboardController.statistic_seller)

router.get("/dashboard/category-income", DashboardController.categoryIncome)

router.get("/dashboard/statistic/user-mm", DashboardController.user_mm)
router.get("/dashboard/statistic/product-seen", DashboardController.product_seen)
router.get("/dashboard/statistic/doctor-consul", DashboardController.total_consul)

router.get("/dashboard/rangking/product", DashboardController.peringkatProduk)
router.get("/dashboard/rangking/seller", DashboardController.peringkatSeller)
router.get("/dashboard/rangking/user", DashboardController.peringkatUser)

module.exports = router
