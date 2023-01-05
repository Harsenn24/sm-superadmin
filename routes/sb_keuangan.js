const express = require("express");
const KeuanganController = require("../controllers/finance");
const { authentif } = require("../middleware/authentif");
const router = express.Router();


router.use(authentif)

router.get("/finance/all/summary", KeuanganController.gross_income)
https://cdn.discordapp.com/attachments/1017261139920441346/1024602502047486012/unknown.png

router.get("/finance/all/summary-excel", KeuanganController.gross_income_excel)

router.get("/finance/all/finance/magic-mirror", KeuanganController.financeChartMagicMirror)
https://cdn.discordapp.com/attachments/1017261139920441346/1024608353655209984/unknown.png

router.get("/finance/all/finance/admin", KeuanganController.financeChartAdmin)
https://cdn.discordapp.com/attachments/1017261139920441346/1024612167615520848/unknown.png

router.get("/finance/all/finance/skin-mystery-commision", KeuanganController.financeChartSkinMysteryCom)
https://cdn.discordapp.com/attachments/1017261139920441346/1024617649772179486/unknown.png


// FINANCE --- KEUANGAN --- MAGIC MIRROR TAB

router.get("/finance/magic-mirror/income", KeuanganController.summaryMagicMirror)
https://cdn.discordapp.com/attachments/1017261139920441346/1044162589623590962/image.png

router.get("/finance/magic-mirror/income-excel", KeuanganController.magic_mirror_excel)

router.get("/finance/magic-mirror/ppn", KeuanganController.taxPPN)
https://cdn.discordapp.com/attachments/1017261139920441346/1044510195071594516/image.png

router.get("/finance/magic-mirror/bruto-detail", KeuanganController.bruto_detail)
https://cdn.discordapp.com/attachments/1017261139920441346/1044162701716369425/image.png

router.get("/finance/magic-mirror/netto-detail", KeuanganController.netto_detail)
https://cdn.discordapp.com/attachments/1017261139920441346/1045543431700750377/image.png

router.get("/finance/magic-mirror/commission-detail", KeuanganController.commission_detail)
https://cdn.discordapp.com/attachments/1017261139920441346/1045543031295709264/image.png

router.get("/finance/magic-mirror/statistic", KeuanganController.statistic)
https://cdn.discordapp.com/attachments/1017261139920441346/1044162786038652988/image.png


//==========================================================================

router.get("/finance/magic-mirror/table/public", KeuanganController.public_month_year)
https://cdn.discordapp.com/attachments/1017261139920441346/1044183695747194890/image.png

router.get("/finance/magic-mirror/table/public/summary/:time", KeuanganController.publicSummary)

router.get("/finance/magic-mirror/table/public/user-list/:time", KeuanganController.table_public_user)

router.get("/finance/magic-mirror/table/public/user-list/:time/:subs_id", KeuanganController.userDetailmagicMirror)

router.get("/finance/magic-mirror/table/online", KeuanganController.tableOnline)
https://cdn.discordapp.com/attachments/1017261139920441346/1044800688770797629/image.png

router.get("/finance/magic-mirror/table/online/summary/:store_id", KeuanganController.tableOnlineSummary)
https://cdn.discordapp.com/attachments/1017261139920441346/1044817654780801106/image.png

router.get("/finance/magic-mirror/table/online/month-year/:store_id", KeuanganController.online_month_year)
https://cdn.discordapp.com/attachments/1017261139920441346/1059383497892057108/image.png

router.get("/finance/magic-mirror/table/online/month-year/:store_id/summary/:time", KeuanganController.tableOnlineSummarybyMonth)

router.get("/finance/magic-mirror/table/online/month-year/:store_id/:time", KeuanganController.table_online_user)
https://cdn.discordapp.com/attachments/1017261139920441346/1044817789673812038/image.png

router.get("/finance/magic-mirror/table/online/month-year/:store_id/:time/:subs_id", KeuanganController.userDetailmagicMirror)
https://cdn.discordapp.com/attachments/1017261139920441346/1044835113466343476/image.png

router.get("/finance/magic-mirror/table/onsite", KeuanganController.tableOnsite)

router.get("/finance/magic-mirror/table/onsite/summary/:store_id", KeuanganController.tableOnsiteSummary)

router.get("/finance/magic-mirror/table/onsite/month-year/:store_id", KeuanganController.onsite_month_year)

router.get("/finance/magic-mirror/table/onsite/month-year/:store_id/summary/:time", KeuanganController.tableOnsiteSummarybyMonth)

router.get("/finance/magic-mirror/table/onsite/month-year/:store_id/:time", KeuanganController.table_onsite_user)

router.get("/finance/magic-mirror/table/onsite/month-year/:store_id/:time/:subs_id", KeuanganController.userDetailmagicMirror)

//==========================================================================

// FINANCE --- KEUANGAN --- MAGIC MIRROR TAB

router.get("/finance/admin/summary", KeuanganController.incomeAdmin)
https://cdn.discordapp.com/attachments/1017261139920441346/1024874456990105640/unknown.png

router.get("/finance/admin/summary-excel", KeuanganController.admin_excel)

router.get("/finance/admin/statistic", KeuanganController.chart_admin_detail)
https://cdn.discordapp.com/attachments/1017261139920441346/1024888435649024000/unknown.png

router.get("/finance/admin/table", KeuanganController.adminTable)
https://cdn.discordapp.com/attachments/1017261139920441346/1024902765689978890/unknown.png

router.get("/finance/admin/count", KeuanganController.countProdVoucher)
https://cdn.discordapp.com/attachments/1017261139920441346/1024903039305383967/unknown.png

router.get("/finance/admin/table/:id", KeuanganController.admin_finance_time)

router.get("/finance/admin/table/:id/:time", KeuanganController.storeDetail)
https://cdn.discordapp.com/attachments/1017261139920441346/1024933058425667734/unknown.png





router.get("/finance/doctor/summary", KeuanganController.incomeDocs)
https://cdn.discordapp.com/attachments/1017261139920441346/1024938808673837076/unknown.png

router.get("/finance/doctor/summary-excel", KeuanganController.doctor_excel)

router.get("/finance/doctor/statistic", KeuanganController.chartFinanceDoctor)
https://cdn.discordapp.com/attachments/1017261139920441346/1024947595921068132/unknown.png

router.get("/finance/doctor/table", KeuanganController.tableBasedOnStore)
https://cdn.discordapp.com/attachments/1017261139920441346/1024958800802893896/unknown.png

router.get("/finance/doctor/table/:store_id", KeuanganController.table_docs_time)

router.get("/finance/doctor/table/:store_id/:time", KeuanganController.tableBasedOnDocs)
https://cdn.discordapp.com/attachments/1017261139920441346/1024969121621868545/unknown.png

router.get("/finance/doctor/table/:store_id/:time/:doctor_id/list", KeuanganController.tableBasedOnUser)
https://cdn.discordapp.com/attachments/1017261139920441346/1024977671299538985/unknown.png

router.get("/finance/doctor/table/:store_id/:time/:doctor_id/detail", KeuanganController.detailDoctor)
https://cdn.discordapp.com/attachments/1017261139920441346/1024978377897152532/unknown.png



router.get("/finance/paid/tax/summary", KeuanganController.summaryTax)
https://cdn.discordapp.com/attachments/1017261139920441346/1025237428186923088/unknown.png

router.get("/finance/paid/tax/magic-mirror/public/month-year", KeuanganController.public_month_year)

router.get("/finance/paid/tax/magic-mirror/public/month-year/:time/summary", KeuanganController.taxPublicSummary)

router.get("/finance/paid/tax/magic-mirror/public/month-year/:time/table", KeuanganController.tax_magic_mirror_public)
https://cdn.discordapp.com/attachments/1017261139920441346/1044864563193073715/image.png

router.get("/finance/paid/tax/magic-mirror/public/month-year/:time/table/:payment_id", KeuanganController.tax_magic_mirror_public_detail)
https://cdn.discordapp.com/attachments/1017261139920441346/1044865022880391168/image.png

router.get("/finance/paid/tax/magic-mirror/table/online", KeuanganController.tax_magic_mirror_online)
https://cdn.discordapp.com/attachments/1017261139920441346/1044894240762757130/image.png

router.get("/finance/paid/tax/magic-mirror/table/online/summary/:store_id", KeuanganController.tax_magic_mirror_online_summary)
https://cdn.discordapp.com/attachments/1017261139920441346/1044906559651708928/image.png

router.get("/finance/paid/tax/magic-mirror/table/online/monthly-list/:store_id", KeuanganController.tax_magic_mirror_online_monthlyList)
https://cdn.discordapp.com/attachments/1017261139920441346/1044906726698266645/image.png

router.get("/finance/paid/tax/magic-mirror/table/online/monthly-list/:store_id/:time/summary", KeuanganController.tax_magic_mirror_online_monthlyList_summary)

router.get("/finance/paid/tax/magic-mirror/table/online/monthly-list/:store_id/:time/list", KeuanganController.tax_magic_mirror_online_monthlyList_list)

router.get("/finance/paid/tax/magic-mirror/table/online/monthly-list/:store_id/:time/list/:subs_id", KeuanganController.tax_magic_mirror_detail_id)

router.get("/finance/paid/tax/magic-mirror/table/onsite", KeuanganController.tax_magic_mirror_onsite)

router.get("/finance/paid/tax/magic-mirror/table/onsite/summary/:store_id", KeuanganController.tax_magic_mirror_onsite_summary)

router.get("/finance/paid/tax/magic-mirror/table/onsite/monthly-list/:store_id", KeuanganController.tax_magic_mirror_onsite_monthlyList)

router.get("/finance/paid/tax/magic-mirror/table/onsite/monthly-list/:store_id/:time/summary", KeuanganController.tax_magic_mirror_onsite_monthlyList_summary)

router.get("/finance/paid/tax/magic-mirror/table/onsite/monthly-list/:store_id/:time/list", KeuanganController.tax_magic_mirror_onsite_monthlyList_list)

router.get("/finance/paid/tax/magic-mirror/table/onsite/monthly-list/:store_id/:time/list/:subs_id", KeuanganController.tax_magic_mirror_detail_id)




router.get("/finance/paid/tax/admin/table", KeuanganController.taxAdminList)
https://cdn.discordapp.com/attachments/1017261139920441346/1025252060951748679/unknown.png

router.get("/finance/paid/tax/admin/table/card/:store_id", KeuanganController.cardDetailAdmin)
https://cdn.discordapp.com/attachments/1017261139920441346/1025304007482294354/unknown.png

router.get("/finance/paid/tax/admin/table/list/:store_id", KeuanganController.listDetailAdmin)
https://cdn.discordapp.com/attachments/1017261139920441346/1025304158129115226/unknown.png

router.get("/finance/paid/tax/admin/table/list/:store_id/:payment_id/product", KeuanganController.list_product_detail)

router.get("/finance/paid/tax/admin/table/list/:store_id/:voucher_id/voucher", KeuanganController.list_voucher_detail)

router.get("/finance/paid/tax/commission/summary", KeuanganController.tableCommission)
https://cdn.discordapp.com/attachments/1017261139920441346/1025304451436777472/unknown.png

router.get("/finance/paid/tax/commission/summary/:store_id", KeuanganController.summaryConsultDocs)
https://cdn.discordapp.com/attachments/1017261139920441346/1026710437334630500/unknown.png

router.get("/finance/paid/tax/commission/summary/:store_id/:doctor_id/total", KeuanganController.totalCommissionBydocs)
https://cdn.discordapp.com/attachments/1017261139920441346/1026766605830602752/unknown.png

router.get("/finance/paid/tax/commission/summary/:store_id/:doctor_id/table", KeuanganController.detailSummaryConsultDocs)
https://cdn.discordapp.com/attachments/1017261139920441346/1026710437334630500/unknown.png

router.get("/finance/paid/tax/commission/summary/:store_id/:doctor_id/table/:payment_id", KeuanganController.detail_payment_doctor)





router.get("/finance/charge/penalty/summary", KeuanganController.penaltySummary)
https://cdn.discordapp.com/attachments/1017261139920441346/1045176690990645269/image.png

router.get("/finance/charge/penalty/list", KeuanganController.penaltyList)
https://cdn.discordapp.com/attachments/1017261139920441346/1045177056012554270/image.png

router.get("/finance/charge/penalty/list/:store_id", KeuanganController.penaltyListDetail)
https://cdn.discordapp.com/attachments/1017261139920441346/1045177330974347314/image.png

router.get("/finance/charge/penalty/list/:store_id/:payment_id", KeuanganController.detailPenalty)

router.get("/finance/charge/return-fee/summary", KeuanganController.returnFeeSummary)
https://cdn.discordapp.com/attachments/1017261139920441346/1045178264467017748/image.png

router.get("/finance/charge/return-fee/list", KeuanganController.returnFeeList)
https://cdn.discordapp.com/attachments/1017261139920441346/1045178470491230328/image.png

router.get("/finance/charge/return-fee/list/:store_id", KeuanganController.returnFeeListDetail)

router.get("/finance/shipping/summary", KeuanganController.shippingSummary)
https://cdn.discordapp.com/attachments/1017261139920441346/1026791638477049886/unknown.png

router.get("/finance/shipping/buyer-table", KeuanganController.buyerTable)
https://cdn.discordapp.com/attachments/1017261139920441346/1027046373989814352/unknown.

router.get("/finance/shipping/buyer-table/:payment_id", KeuanganController.buyerTable_detail)

router.get("/finance/shipping/seller-table", KeuanganController.sellerTable)
https://cdn.discordapp.com/attachments/1017261139920441346/1027048697957187614/unknown.png

router.get("/finance/shipping/seller-table/:store_id", KeuanganController.seller_coupon)

router.get("/finance/shipping/seller-table/:store_id/:coupon_id", KeuanganController.user_use_coupon)

router.get("/finance/shipping/seller-table/:store_id/:coupon_id/:payment_id", KeuanganController.payment_detail)

router.get("/finance/shipping/sm-table", KeuanganController.smTable)
https://cdn.discordapp.com/attachments/1017261139920441346/1044106359194534009/image.png

router.get("/finance/shipping/sm-table/:coupon_id", KeuanganController.user_use_sm_coupon)
https://cdn.discordapp.com/attachments/1017261139920441346/1044192765497585684/image.png

router.get("/finance/shipping/sm-table/:coupon_id/:payment_id", KeuanganController.payment_detail_sm)

router.get("/finance/paid/magic-mirror", KeuanganController.seller_income_magic_mirror)
https://cdn.discordapp.com/attachments/1017261139920441346/1046670617715413073/image.png

router.get("/finance/paid/magic-mirror/:store_id/card", KeuanganController.seller_income_magic_mirror_bystorecard)

router.get("/finance/paid/magic-mirror/:store_id/time", KeuanganController.seller_income_magic_mirror_bystoretime)

router.get("/finance/paid/magic-mirror/:store_id/time/:month_year/list", KeuanganController.seller_income_magic_mirror_bystoretime_list)

router.get("/finance/paid/magic-mirror/:store_id/time/:month_year/card", KeuanganController.seller_income_magic_mirror_bystoretime_card)

router.get("/finance/paid/magic-mirror/:store_id/time/:month_year/list/:payment_id", KeuanganController.seller_income_magic_mirror_bystoretime_list_payment)

module.exports = router
