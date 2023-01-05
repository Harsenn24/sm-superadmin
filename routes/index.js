let express = require("express");
let sb_login = require("./sb_login")
let sb_setting = require("./sb_setting")
let sb_dashboard = require("./sb_dashboard")
let sb_pengguna = require("./sb_pengguna")
let sb_vouchers = require("./sb_voucher")
let sb_keuangan = require("./sb_keuangan")
let sb_seller = require("./sb_seller")
let sb_skinBeauty = require("./sb_s&b_expert")
let sb_magic_mirror = require("./sb_magicMirror")
let sb_statistik = require("./sb_statistik")
let sb_doctor = require("./sb_doctors")
let sb_sclinics = require("./sb_sclinics")
let sb_pengembalian = require("./sb_pengembalian")
let sb_pict = require("./sb_pict")


let router = express.Router();

router.use(sb_login)
router.use(sb_setting)
router.use(sb_dashboard)
router.use(sb_pengguna)
router.use(sb_vouchers)
router.use(sb_keuangan) 
router.use(sb_seller) 
router.use(sb_skinBeauty) 
router.use(sb_magic_mirror)
router.use(sb_statistik) 
router.use(sb_doctor) 
router.use(sb_sclinics) 
router.use(sb_pengembalian)
router.use(sb_pict) 


module.exports = router

























module.exports = router