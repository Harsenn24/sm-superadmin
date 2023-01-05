const express = require("express");
const StatistikController = require("../controllers/statistik");
const { authentif } = require("../middleware/authentif");
const router = express.Router();

router.use(authentif)

router.get("/statistik/skin-mystery/total-net-income", StatistikController.total_net_income)
https://cdn.discordapp.com/attachments/1017261139920441346/1027409691275448370/unknown.png

router.get("/statistik/skin-mystery/total-user", StatistikController.total_user)
https://cdn.discordapp.com/attachments/1017261139920441346/1027410418953621565/unknown.png

router.get("/statistik/skin-mystery/total-seller", StatistikController.total_seller)
https://cdn.discordapp.com/attachments/1017261139920441346/1027410605428178985/unknown.png

router.get("/statistik/skin-mystery/top-product", StatistikController.top_product)
https://cdn.discordapp.com/attachments/1017261139920441346/1027410945334595604/unknown.png

router.get("/statistik/skin-mystery/top-seller", StatistikController.top_seller)
https://cdn.discordapp.com/attachments/1017261139920441346/1027410786353688626/unknown.png

router.get("/statistik/skin-mystery/chart-net-income", StatistikController.allNetIncome)
https://cdn.discordapp.com/attachments/1017261139920441346/1027443266834145340/unknown.png

router.get("/statistik/skin-mystery/review", StatistikController.review)
https://cdn.discordapp.com/attachments/1017261139920441346/1027465860299886642/unknown.png

router.get("/statistik/skin-mystery/user-gender", StatistikController.genderBuyer)
https://cdn.discordapp.com/attachments/1017261139920441346/1027471943810687057/unknown.png

router.get("/statistik/skin-mystery/chart-user-age", StatistikController.buyerAgeChart)
https://cdn.discordapp.com/attachments/1017261139920441346/1029597554255605760/unknown.png

router.get("/statistik/magic-mirror/summary/income", StatistikController.income_mm)
https://cdn.discordapp.com/attachments/1017261139920441346/1027513163442290788/unknown.png

router.get("/statistik/magic-mirror/summary/total-user", StatistikController.totalUserMm)
https://cdn.discordapp.com/attachments/1017261139920441346/1027796111865413642/unknown.png

router.get("/statistik/magic-mirror/summary/monthly-user", StatistikController.monthlyUserMm)
https://cdn.discordapp.com/attachments/1017261139920441346/1028868725987868792/unknown.png

router.get("/statistik/magic-mirror/summary/yearly-user", StatistikController.yearlyUserMm)
https://cdn.discordapp.com/attachments/1017261139920441346/1028868572681863228/unknown.png

router.get("/statistik/magic-mirror/summary/free-user", StatistikController.userFreeMm)
https://cdn.discordapp.com/attachments/1017261139920441346/1028883522196348939/unknown.png

router.get("/statistik/magic-mirror/income/daily-user", StatistikController.incomeMmDaily)
https://cdn.discordapp.com/attachments/1017261139920441346/1028920871877873704/unknown.png

router.get("/statistik/magic-mirror/income/monthly-user", StatistikController.incomeMmMonthly)
https://cdn.discordapp.com/attachments/1017261139920441346/1028921077453307924/unknown.png

router.get("/statistik/magic-mirror/income/yearly-user", StatistikController.incomeMmYearly)
https://cdn.discordapp.com/attachments/1017261139920441346/1028921013058154516/unknown.png

router.get("/statistik/magic-mirror/user-gender", StatistikController.userGender)
https://cdn.discordapp.com/attachments/1017261139920441346/1028934733670924368/unknown.png

router.get("/statistik/magic-mirror/user-average", StatistikController.userAverage)
https://cdn.discordapp.com/attachments/1017261139920441346/1029586012885745664/unknown.png

router.get("/statistik/magic-mirror/user-average/free", StatistikController.userAverageFree)
https://cdn.discordapp.com/attachments/1017261139920441346/1029586012885745664/unknown.png

router.get("/statistik/magic-mirror/chart-user-age", StatistikController.mmAgeChart)
https://cdn.discordapp.com/attachments/1017261139920441346/1029597853292695573/unknown.png

router.get("/statistik/magic-mirror/user-new", StatistikController.userNew)
https://cdn.discordapp.com/attachments/1017261139920441346/1029673029451657237/unknown.png

module.exports = router
