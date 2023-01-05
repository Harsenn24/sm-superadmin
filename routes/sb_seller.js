const express = require("express");
const { SellerController } = require("../controllers/seller");
const { authentif } = require("../middleware/authentif");
const router = express.Router();


router.use(authentif)

router.get("/seller/all-seller", SellerController.all_seller)

router.get("/seller/all-seller/:store_id", SellerController.statusStoreCheck)

router.get("/seller/store/:id/statistic-summary", SellerController.seller_detail)

router.get("/seller/store/:id/analysis-product-seen", SellerController.prod_seen)

router.get("/seller/store/:id/analysis-store-visitor", SellerController.seller_visitor)

router.get("/seller/store/:id/top-product", SellerController.topProdSeller)

router.get("/seller/store/:id/data-detail", SellerController.dataStore)

router.get("/seller/finance/income-info/:store_id", SellerController.incomeInfo)
https://cdn.discordapp.com/attachments/973809910976483358/986155032552550430/unknown.png

router.get("/seller/finance/income-detail/money-hold/:store_id", SellerController.moneyHold)
https://cdn.discordapp.com/attachments/973809910976483358/986155724436545546/unknown.png

router.get("/seller/finance/income-detail/money-ready/:store_id", SellerController.moneyReady)
https://cdn.discordapp.com/attachments/973809910976483358/986155724436545546/unknown.png

router.get("/seller/finance/income-detail/my-invoice/:store_id", SellerController.myInvoice)
https://cdn.discordapp.com/attachments/973809910976483358/987242287341895751/unknown.png

router.get("/seller/finance/saldo/info/:store_id", SellerController.totalSaldo)
https://cdn.discordapp.com/attachments/973809910976483358/990835733164089364/unknown.png

router.get("/seller/finance/saldo/info/bank-list/:store_id", SellerController.storeBankList)
https://cdn.discordapp.com/attachments/973809910976483358/990835733164089364/unknown.png

router.get("/seller/finance/saldo/last-trx/all/:store_id", SellerController.lastTrxAll)
https://cdn.discordapp.com/attachments/1017261139920441346/1021281367155290213/unknown.png

router.get("/seller/finance/saldo/last-trx/payment/:store_id", SellerController.lastTrxPayment)
https://cdn.discordapp.com/attachments/1017261139920441346/1021308520542523392/unknown.png

router.get("/seller/finance/saldo/last-trx/payment/:store_id/:payment_id", SellerController.detailPayment)

router.get("/seller/finance/saldo/last-trx/voucher/:store_id/", SellerController.lastTrxVoucher)
https://cdn.discordapp.com/attachments/1017261139920441346/1021315777120456755/unknown.png

router.get("/seller/finance/saldo/last-trx/voucher/:store_id/:payment_id", SellerController.detailVoucher)

router.get("/seller/finance/saldo/last-trx/doctor/:store_id", SellerController.lastTrxDoctor)
https://cdn.discordapp.com/attachments/1017261139920441346/1021347187881426976/unknown.png

router.get("/seller/finance/saldo/last-trx/doctor/:store_id/:payment_id", SellerController.detailDoctor)

router.get("/seller/finance/saldo/last-trx/refund/:store_id", SellerController.refundOrder)
https://cdn.discordapp.com/attachments/1017261139920441346/1021350701139513414/unknown.png

router.get("/seller/finance/saldo/last-trx/withdrawal/:store_id", SellerController.trxWithdrawal)
https://cdn.discordapp.com/attachments/1017261139920441346/1021367321794715678/unknown.png

router.get("/seller/finance/saldo/last-trx/withdrawal/:store_id/:payment_id", SellerController.withdrawalDetail)

router.get("/seller/history-order/all/:store_id", SellerController.trxRecordAll)
https://cdn.discordapp.com/attachments/1017261139920441346/1021646416130605056/unknown.png

router.get("/seller/history-order/all/:store_id/:payment_id", SellerController.detailTrxRecord)
https://cdn.discordapp.com/attachments/1017261139920441346/1021679495113080842/unknown.png

router.get("/seller/review/list", SellerController.reviewSeller)

router.get("/seller/review/list/:id", SellerController.detailSellerReview)

router.delete("/seller/review/list/:id/reject", SellerController.rejectSeller)

router.post("/seller/review/list/:id/postpone", SellerController.postponeSeller)

router.put("/seller/review/list/:id/accept", SellerController.acceptSeller)

router.get("/seller/review/product/:store_id", SellerController.reviewProduct)
https://cdn.discordapp.com/attachments/1017261139920441346/1021716307231658035/unknown.png

router.get("/seller/review/product/score/:store_id", SellerController.totalScoreProduct)
https://cdn.discordapp.com/attachments/1017261139920441346/1021716492544397372/unknown.png

router.get("/seller/review/voucher/:store_id", SellerController.reviewVoucher)
https://cdn.discordapp.com/attachments/1017261139920441346/1021981607197949952/unknown.png

router.get("/seller/review/voucher/score/:store_id", SellerController.totalScoreVoucher)
https://cdn.discordapp.com/attachments/1017261139920441346/1021981783903965244/unknown.png

router.get("/seller/review/follower/chart/:store_id", SellerController.chartFollowerStore)
https://cdn.discordapp.com/attachments/973809910976483358/984306366766284860/unknown.png

router.get("/seller/review/follower/list/:store_id", SellerController.listFollowerStore)
https://cdn.discordapp.com/attachments/973809910976483358/984306550141235220/unknown.png

router.get("/seller/statistic/summary/store/:store_id", SellerController.statStoreSales)
https://cdn.discordapp.com/attachments/1017261139920441346/1022344168254754816/unknown.png

router.get("/seller/statistic/summary/visitor/:store_id", SellerController.statStoreVisitor)
https://cdn.discordapp.com/attachments/1017261139920441346/1022347107983691786/unknown.png

router.get("/seller/statistic/summary/view/:store_id", SellerController.statStoreProductSeen)
https://cdn.discordapp.com/attachments/1017261139920441346/1022730245914243164/unknown.png

router.get("/seller/statistic/summary/order/:store_id", SellerController.statStoreOrder)
https://cdn.discordapp.com/attachments/1017261139920441346/1022359991312728074/unknown.png

router.get("/seller/statistic/summary/conversion/:store_id", SellerController.statStoreConversion)
https://cdn.discordapp.com/attachments/1017261139920441346/1022363305014210580/unknown.png

router.get("/seller/statistic/summary/cancellation/:store_id", SellerController.statStoreCancellation)
https://cdn.discordapp.com/attachments/1017261139920441346/1022395875475062824/unknown.png

router.get("/seller/statistic/summary/return/:store_id", SellerController.statStoreReturn)
https://media.discordapp.net/attachments/1017261139920441346/1022402789248356392/unknown.png?width=2160&height=1104

router.get("/seller/statistic/summary/sale-order/:store_id", SellerController.statStoreSaleByOrder)
https://cdn.discordapp.com/attachments/1017261139920441346/1022420905453965363/unknown.png

router.get("/seller/statistic/summary/buyer/type/:store_id", SellerController.buyerType)
https://cdn.discordapp.com/attachments/1017261139920441346/1022694416412053504/unknown.png

router.get("/seller/statistic/summary/buyer/gender/:store_id", SellerController.buyerGender)
https://cdn.discordapp.com/attachments/1017261139920441346/1022694731433648179/unknown.png

router.get("/seller/statistic/summary/buyer/age/:store_id", SellerController.buyerAge)
https://cdn.discordapp.com/attachments/1017261139920441346/1022694896739557386/unknown.png

router.get("/seller/statistic/product-rank/:store_id", SellerController.productRank)
https://cdn.discordapp.com/attachments/1017261139920441346/1022720121690652722/unknown.png

router.get("/seller/statistic/product/chart/sold/:store_id", SellerController.productSold)
https://cdn.discordapp.com/attachments/1017261139920441346/1022725291971452959/unknown.png

router.get("/seller/statistic/product/chart/view/:store_id", SellerController.productSeen)
https://cdn.discordapp.com/attachments/1017261139920441346/1022761753374883941/unknown.png

router.get("/seller/statistic/product/chart/cart/:store_id", SellerController.productCart)
https://cdn.discordapp.com/attachments/1017261139920441346/1022770377149124618/unknown.png

router.get("/seller/statistic/voucher/chart/sold/:store_id", SellerController.voucherSold)
https://cdn.discordapp.com/attachments/1017261139920441346/1022777872760442960/unknown.png

router.get("/seller/statistic/voucher/chart/used/:store_id", SellerController.voucherUsed)
https://cdn.discordapp.com/attachments/1017261139920441346/1022783207680258089/unknown.png

router.get("/seller/statistic/voucher/chart/sale/:store_id", SellerController.voucherSale)
https://cdn.discordapp.com/attachments/1017261139920441346/1022786051414179840/unknown.png

router.get("/seller/statistic/voucher/chart/table/:store_id", SellerController.voucherTable)
https://cdn.discordapp.com/attachments/1017261139920441346/1022792212402155520/unknown.png

router.get("/seller/statistic/bex/summary/:store_id", SellerController.summaryBex)
https://cdn.discordapp.com/attachments/1017261139920441346/1023840073483034696/unknown.png

router.get("/seller/statistic/bex/table/:store_id", SellerController.tableBex)
https://cdn.discordapp.com/attachments/1017261139920441346/1023840385421807628/unknown.png

router.get("/seller/statistic/doctor/summary/:store_id", SellerController.summaryDoctor)
https://cdn.discordapp.com/attachments/1017261139920441346/1024143097984188466/unknown.png

router.get("/seller/statistic/doctor/summary-income/:store_id", SellerController.summaryIncomeDocs)

router.get("/seller/statistic/doctor/summary-income-chart/:store_id", SellerController.summaryIncomeDocsChart)

router.get("/seller/statistic/doctor/summary-consult/:store_id", SellerController.summaryConsult)

router.get("/seller/statistic/doctor/summary-consult-chart/:store_id", SellerController.summaryConsultChart)

router.get("/seller/statistic/doctor/summary-rating/:store_id", SellerController.summaryRating)

router.get("/seller/statistic/doctor/summary-top_doctor/:store_id", SellerController.summaryTopDoctor)

router.get("/seller/statistic/doctor/table/:store_id", SellerController.tableDoctor)
https://cdn.discordapp.com/attachments/1017261139920441346/1024150273561743440/unknown.png

router.get("/seller/product/table/:store_id", SellerController.listProduct)
https://cdn.discordapp.com/attachments/1017261139920441346/1024274696943960114/unknown.png

router.get("/seller/product/table/:store_id/:product_id", SellerController.productDetail)
https://cdn.discordapp.com/attachments/1017261139920441346/1041901377506525204/image.png

router.get("/seller/product/count/:store_id", SellerController.countProduct)
https://cdn.discordapp.com/attachments/1017261139920441346/1024274868658774106/unknown.png

router.get("/seller/doc-bex/table/:store_id", SellerController.listDocBex)
https://cdn.discordapp.com/attachments/1017261139920441346/1024275150675390544/unknown.png

router.get("/seller/doc-bex/count/:store_id", SellerController.countDocBex)
https://cdn.discordapp.com/attachments/1017261139920441346/1024520938257121340/unknown.png

router.get("/seller/clinic/table/:store_id", SellerController.listClinic)
https://cdn.discordapp.com/attachments/1017261139920441346/1024538335458377778/unknown.png

router.get("/seller/voucher/table/:store_id", SellerController.listVoucher)
https://cdn.discordapp.com/attachments/1017261139920441346/1024538639197286400/unknown.png

router.get("/seller/clinic-voucher/count/:store_id", SellerController.countClinicVoucher)
https://cdn.discordapp.com/attachments/1017261139920441346/1024541311828762644/unknown.png

router.get("/seller/info/:store_id", SellerController.infoSeller)
https://cdn.discordapp.com/attachments/1017261139920441346/1024588924829564980/unknown.png

router.get("/seller/voucher-sold/:store_id/list", SellerController.voucher_sold)
https://cdn.discordapp.com/attachments/1017261139920441346/1053200072084553758/image.png

router.get("/seller/store-coupon/:store_id/list", SellerController.store_coupon)
https://cdn.discordapp.com/attachments/1017261139920441346/1054284602165973002/image.png

router.get("/seller/store-coupon/:store_id/list/:coupon_id/info", SellerController.coupon_info)
https://cdn.discordapp.com/attachments/1017261139920441346/1054290960659521616/image.png

router.get("/seller/store-coupon/:store_id/list/:coupon_id/claim", SellerController.coupon_claim)
https://cdn.discordapp.com/attachments/1017261139920441346/1054649470140289095/image.png

router.get("/seller/store-coupon/:store_id/list/:coupon_id/use", SellerController.coupon_use)
https://cdn.discordapp.com/attachments/1017261139920441346/1054965951742873620/image.png



router.get("/seller/admin-list/:store_id", SellerController.listAdminStore)

router.get("/seller/store-logs/:store_id", SellerController.store_logs)










































//batas api postman


























module.exports = router
