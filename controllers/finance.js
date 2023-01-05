const { date2number } = require("../helper/date2number")
const { encrypt, decryptId, encryptId } = require("../helper/enkrip_id")
const { queryPagination } = require("../helper/pagination")
const { jsonData } = require("../middleware/sucess")
const { Sys_payment, Sys_subscribe, Config, Sys_voucher, Store, Sys_doctor, RecordPenalty, Stores_coupon } = require("../model")
const { rt_link } = process.env
const { ObjectID } = require("bson")
const { status_coupon_v2 } = require("../helper/sts_coupon")
const { filter_map } = require("../helper/filter_map")
const { percent_aggregate } = require("../helper/percent")
const { range_day_aggregate } = require("../helper/range_day")
const { detail_money_magic_mirror } = require("../query/finances/finance/detail_magic_mirror")
const { changeToMonth } = require("../helper/month_list_name")
const { search_something } = require("../helper/search_regex")
const { gross_income_finance } = require("../query/finances/finance/gross_income_finance")
const { detail_payment } = require("../query/finances/paid/tx-adm-voucher-detail")
const { mm_summary } = require("../query/mm_summary")
const { admin_income } = require("../query/admin_income")
const excel = require('exceljs')
const { excel_download } = require("../helper/excel_1")
const { finance_doctor } = require("../query/finance_docs")
const { admin_tax_finance, get_month_year, store_full_name } = require("../query/finances/finance/adm-tax-finance")
const { magic_mirror_finance_excel, admin_finance_excel, doctor_finance_excel } = require("../query/finance_excel")
const table_list = require("../query/finances/finance/mm-table-list")
const public_list = require("../query/finances/finance/mm-public-list")
const summary_source = require("../query/finances/finance/mm-summary")
const class_by_month = require("../query/finances/finance/mm-monthyear")
const user_list_mm = require("../query/finances/finance/mm-userlist")
const mm_payment = require("../query/finances/finance/mm-paymentdetail")
const public_summary = require("../query/finances/finance/mm-public-summary")
const chart_magic_mirror = require("../query/finances/finance/mm-chart")
const admin_chart = require("../query/finances/finance/adm-chart")
const doctor_consult_chart = require("../query/finances/finance/dc-chart")
const { public_income_query, onsite_income_query, online_income_query, all_income_query } = require("../query/finances/finance/statistic")
const { admin_product_query, admin_voucher_query } = require("../query/finances/finance/adm-table")
const { count_admin_product } = require("../query/finances/finance/adm-count")
const { admin_chart_detail } = require("../query/finances/finance/adm-chart-detail")
const { get_time_body } = require("../helper/time_stamp")
const doctor_chart_detail = require("../query/finances/finance/dc-chart-detail")
const { doctor_list_by_store } = require("../query/finances/finance/dc-list-by-store")
const { doctor_list_month } = require("../query/finances/finance/dc-docs-month")
const { doctor_list } = require("../query/finances/finance/dc-list")
const { doctor_detail } = require("../query/finances/finance/dc-detail")
const { list_doctor_by_user } = require("../query/finances/finance/dc-by-user")
const { summary_tax } = require("../query/finances/paid/tx-summary")
const { tax_magicmirror_online_offline } = require("../query/finances/paid/tx-mm-online_offline")
const { tax_magicmirror_online_id } = require("../query/finances/paid/tx-mm-online-id")
const { tax_magicmirror_monthyear_list } = require("../query/finances/paid/tx-mm-online-monthlyyear-list")
const { tax_magicmirror_monthyear_summary } = require("../query/finances/paid/tx-mm-online-monthlyyear-summary")
const { tax_magicmirror_monthyear } = require("../query/finances/paid/tx-mm-online-monthlyyear")
const { tax_magicmirror_summary } = require("../query/finances/paid/tx-mm-summary")
const { tax_magicmirror_public } = require("../query/finances/paid/tx-mm-public")
const { tax_magicmirror_public_detail } = require("../query/finances/paid/tx-mm-public-detail")
const { tax_admin_list } = require("../query/finances/paid/tx-adm")
const { tax_admin_voucher, tax_admin_product } = require("../query/finances/paid/tx-adm-detail")
const { tax_admin_product_detail } = require("../query/finances/paid/tx-adm-product-detail")
const { tax_admin_card } = require("../query/finances/paid/tx-adm-card")
const { tax_com_list } = require("../query/finances/paid/tx-com-list")
const { tax_com_summmary } = require("../query/finances/paid/tx-com-summary")
const { tax_com_summmary_detail } = require("../query/finances/paid/tx-com-summary-detail")
const { tax_com_by_docs } = require("../query/finances/paid/tx-com-total-bydoc")
const { shipping_summary } = require("../query/finances/charge/shipping_summary")
const { summary_source_time } = require("../query/finances/finance/mm-summary-time")
const { buyer_table_detail } = require("../query/finances/charge/buyer-table-detail")
const { buyer_table } = require("../query/finances/charge/buyer-table")
const { payment_detail } = require("../query/finances/charge/payment_detail")
const { user_uses_coupon } = require("../query/finances/charge/user_uses_coupon")
const { seller_coupon } = require("../query/finances/charge/seller_coupon")
const { seller_table } = require("../query/finances/charge/seller_table")
const { skin_mystery_table } = require("../query/finances/charge/sm_table")
const { user_sm_coupon } = require("../query/finances/charge/user_sm_coupon")
const { payment_detail_skin_mystery } = require("../query/finances/charge/payment_detail_sm")
const { penalty_summary } = require("../query/finances/charge/penalty_summary")
const { penalty_list } = require("../query/finances/charge/penalty_list")
const { penalty_list_detail } = require("../query/finances/charge/penalty_list_detail")
const { penalty_trx_detail } = require("../query/finances/charge/penalty_trx_detail")
const { return_fee_summary } = require("../query/finances/charge/returnfee_summary")
const { return_list } = require("../query/finances/charge/return_list")
const { return_list_detail } = require("../query/finances/charge/return_list_detail")
const { seller_income_mm } = require("../query/finances/charge/seller_income_mm")
const { seller_list_by_store } = require("../query/finances/charge/seller_income_by_store")
const { seller_income_mm_time_list } = require("../query/finances/charge/seller_income_mm_time_list")
const { seller_income_card } = require("../query/finances/charge/seller_income_card")
const { seller_income_payment } = require("../query/finances/charge/seller_income_payment")
const { tax_public_summary } = require("../query/finances/finance/tx-public-summary")




class KeuanganController {
    static async gross_income(req, res, next) {
        try {
            const { time_start, time_end, time_start_double, time_end_double } = get_time_body(req)

            const [gross_income] = await Config.aggregate(gross_income_finance(time_start, time_end, time_end_double, time_start_double))

            res.status(200).json(jsonData(gross_income))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async financeChartMagicMirror(req, res, next) {
        try {
            const { time_start, time_end } = get_time_body(req)

            const [data_magic_mirror] = await Sys_subscribe.aggregate(chart_magic_mirror(time_start, time_end))

            res.status(200).json(jsonData(data_magic_mirror))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async financeChartAdmin(req, res, next) {
        try {
            const { time_start, time_end } = get_time_body(req)

            const [financeChartAdmin] = await Config.aggregate(admin_chart(time_start, time_end))

            res.status(200).json(jsonData(financeChartAdmin))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async financeChartSkinMysteryCom(req, res, next) {
        try {
            const { time_start, time_end } = get_time_body(req)

            const [financeChartSkinMysteryCom] = await Config.aggregate(doctor_consult_chart(time_start, time_end))

            res.status(200).json(jsonData(financeChartSkinMysteryCom))

        } catch (error) {
            next(error)
            console.log(error);
        }
    }


    static async tablePublic(req, res, next) {
        try {
            let { search_name, page, item_limit, } = req.query

            const [tablePublic] = await Sys_subscribe.aggregate(public_list(search_name, rt_link, page, item_limit))

            res.status(200).json(jsonData(tablePublic))

        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async tableOnline(req, res, next) {
        try {
            let { search_store, page, item_limit, } = req.query

            let type = ['member-online']

            const [tableOnline] = await Store.aggregate(table_list(search_store, type, rt_link, page, item_limit))

            res.status(200).json(jsonData(tableOnline))

        } catch (error) {
            console.log(error)
            next(error)
        }
    }


    static async tableOnsite(req, res, next) {
        try {
            let { search_store, page, item_limit } = req.query

            let type = ['member-onsite', 'member-offline']

            const [tableOnsite] = await Store.aggregate(table_list(search_store, type, rt_link, page, item_limit))

            res.status(200).json(jsonData(tableOnsite))

        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async tableOnsiteSummary(req, res, next) {
        try {
            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)

            let type = ['member-onsite', 'member-offline']

            let [tableOnsiteSummary] = await Sys_subscribe.aggregate(summary_source(idDecrypt, type))

            res.status(200).json(jsonData(tableOnsiteSummary))
        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async onsite_month_year(req, res, next) {
        try {
            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)

            const { page, item_limit, search_year } = req.query

            let type = ['member-onsite', 'member-offline']

            let [onsite_month_year] = await Sys_subscribe.aggregate(class_by_month(type, idDecrypt, search_year, page, item_limit))


            res.status(200).json(jsonData(onsite_month_year))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async table_onsite_user(req, res, next) {
        try {
            let { search_user, page, item_limit } = req.query

            const { store_id, time } = req.params
            const idDecrypt = decryptId(store_id, 12)

            let type = ['member-onsite', 'member-offline']

            let [table_onsite_user] = await Sys_subscribe.aggregate(user_list_mm(type, idDecrypt, search_user, page, item_limit, time, rt_link))

            res.status(200).json(jsonData(table_onsite_user))

        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async table_online_user(req, res, next) {
        try {
            let { search_user, page, item_limit } = req.query

            const { store_id, time } = req.params
            const idDecrypt = decryptId(store_id, 12)

            let type = ['member-online']

            let [table_online_user] = await Sys_subscribe.aggregate(user_list_mm(type, idDecrypt, search_user, page, item_limit, time, rt_link))

            res.status(200).json(jsonData(table_online_user))

        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async tableOnlineSummarybyMonth(req, res, next) {
        try {

            const { store_id, time } = req.params
            const idDecrypt = decryptId(store_id, 12)

            let type = ['member-online']

            let [tableOnlineSummary] = await Sys_subscribe.aggregate(summary_source_time(idDecrypt, type, time))

            tableOnlineSummary.month_year = changeToMonth(time)

            res.status(200).json(jsonData(tableOnlineSummary))

        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async tableOnsiteSummarybyMonth(req, res, next) {
        try {

            const { store_id, time } = req.params

            const idDecrypt = decryptId(store_id, 12)

            let type = ['member-onsite', 'member-offline']

            let [tableOnsiteSummary] = await Sys_subscribe.aggregate(summary_source_time(idDecrypt, type, time))

            tableOnsiteSummary.month_year = changeToMonth(time)

            res.status(200).json(jsonData(tableOnsiteSummary))

        } catch (error) {
            console.log(error)
            next(error)
        }
    }



    static async tableOnlineSummary(req, res, next) {
        try {

            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)

            let type = ['member-online']

            let [tableOnlineSummary] = await Sys_subscribe.aggregate(summary_source(idDecrypt, type))

            res.status(200).json(jsonData(tableOnlineSummary))

        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async online_month_year(req, res, next) {
        try {
            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)

            const { page, item_limit, search_year } = req.query

            let type = ['member-online']

            let [tableOnlineMonth] = await Sys_subscribe.aggregate(class_by_month(type, idDecrypt, search_year, page, item_limit))


            res.status(200).json(jsonData(tableOnlineMonth))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async userDetailmagicMirror(req, res, next) {
        try {
            const { subs_id, time } = req.params
            const subs_decrypt = decryptId(subs_id, 12)

            const [userDetailmagicMirror] = await Sys_subscribe.aggregate(mm_payment(subs_decrypt, subs_id))

            userDetailmagicMirror.month_year = changeToMonth(time)

            res.status(200).json(jsonData(userDetailmagicMirror))


        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async public_month_year(req, res, next) {
        try {
            const { page, item_limit, search_year } = req.query

            let type = ['apps']

            let idDecrypt = null

            let [public_month_year] = await Sys_subscribe.aggregate(class_by_month(type, idDecrypt, search_year, page, item_limit))

            res.status(200).json(jsonData(public_month_year))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async publicSummary(req, res, next) {
        try {

            let { time } = req.params

            let [publicSummary] = await Sys_subscribe.aggregate(public_summary(time))

            let convert_time = changeToMonth(time)

            publicSummary.month_year = convert_time

            res.status(200).json(jsonData(publicSummary))

        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async taxPublicSummary(req, res, next) {
        try {

            let { time } = req.params

            let [taxPublicSummary] = await Sys_subscribe.aggregate(tax_public_summary(time))

            let convert_time = changeToMonth(time)

            taxPublicSummary.month_year = convert_time

            res.status(200).json(jsonData(taxPublicSummary))

        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async table_public_user(req, res, next) {
        try {
            let { search_user, page, item_limit } = req.query

            const { time } = req.params

            let type = ['apps']

            let idDecrypt = null

            let [table_public_user] = await Sys_subscribe.aggregate(user_list_mm(type, idDecrypt, search_user, page, item_limit, time, rt_link))

            res.status(200).json(jsonData(table_public_user))

        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async statistic(req, res, next) {
        try {
            let { tab } = req.query

            if (!tab) { throw { message: 'Tab is required' } }

            const { time_start, time_end, time_start_double, time_end_double } = get_time_body(req)

            const public_income = await Sys_subscribe.aggregate(public_income_query(time_start, time_end, time_start_double, time_end_double))

            const oniste_income = await Sys_subscribe.aggregate(onsite_income_query(time_start, time_end, time_start_double, time_end_double))

            const online_income = await Sys_subscribe.aggregate(online_income_query(time_start, time_end, time_start_double, time_end_double))

            const all_income = await Sys_subscribe.aggregate(all_income_query(time_start, time_end, time_start_double, time_end_double))

            if (tab === 'onsite') { res.status(200).json(jsonData(oniste_income[0])) }
            if (tab === 'online') { res.status(200).json(jsonData(online_income[0])) }
            if (tab === 'public') { res.status(200).json(jsonData(public_income[0])) }
            if (tab === 'all') { res.status(200).json(jsonData(all_income[0])) }

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async bruto_detail(req, res, next) {
        try {
            const { time_start, time_end, time_start_double, time_end_double } = get_time_body(req)

            const [bruto_detail] = await Sys_subscribe.aggregate(detail_money_magic_mirror(time_start, time_end, time_start_double, time_end_double, '$prb', 'Bruto'))

            res.status(200).json(jsonData(bruto_detail))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async netto_detail(req, res, next) {
        try {
            const { time_start, time_end, time_start_double, time_end_double } = get_time_body(req)

            const [netto_detail] = await Sys_subscribe.aggregate(detail_money_magic_mirror(time_start, time_end, time_start_double, time_end_double, '$prn', 'Netto'))

            res.status(200).json(jsonData(netto_detail))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async commission_detail(req, res, next) {
        try {
            const { time_start, time_end, time_start_double, time_end_double } = get_time_body(req)

            const [commission_detail] = await Sys_subscribe.aggregate(detail_money_magic_mirror(time_start, time_end, time_start_double, time_end_double, '$mon.clm', 'Komisi'))

            res.status(200).json(jsonData(commission_detail))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async taxPPN(req, res, next) {
        try {
            const { time_start, time_end } = get_time_body(req)

            const taxPPN = await Sys_subscribe.aggregate(detail_money_magic_mirror(time_start, time_end, null, null, '$mon.ppn', 'Pajak'))

            res.status(200).json(jsonData(taxPPN[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async summaryMagicMirror(req, res, next) {
        try {
            const { time_start, time_end, time_start_double, time_end_double } = get_time_body(req)

            const [summaryMagicMirror] = await Sys_subscribe.aggregate(mm_summary(time_start, time_end, time_start_double, time_end_double))

            res.status(200).json(jsonData(summaryMagicMirror))


        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async incomeAdmin(req, res, next) {
        try {
            const { time_start, time_end, time_start_double, time_end_double } = get_time_body(req)

            const [incomeAdmin] = await Config.aggregate(admin_income(time_start, time_end, time_start_double, time_end_double))

            res.status(200).json(jsonData(incomeAdmin))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async adminTable(req, res, next) {
        try {
            const { time_start, time_end } = get_time_body(req)

            let { tab, page, item_limit } = req.query

            if (!tab) { throw { message: 'Tab is required' } }

            const [adminProduct] = await Sys_payment.aggregate(admin_product_query(time_start, time_end, page, item_limit))

            const [adminVoucher] = await Sys_voucher.aggregate(admin_voucher_query(time_start, time_end, page, item_limit))

            if (tab === 'voucher') {
                res.status(200).json(jsonData(adminVoucher))
            } else if (tab === 'product') {
                res.status(200).json(jsonData(adminProduct))
            }

        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async countProdVoucher(req, res, next) {
        try {
            const { time_start, time_end } = get_time_body(req)

            const adminProduct = await Sys_payment.aggregate(count_admin_product(time_start, time_end))
            const adminVoucher = await Sys_voucher.aggregate(count_admin_product(time_start, time_end))


            const result = {
                voucher: adminVoucher.length,
                product: adminProduct.length
            }

            res.status(200).json(jsonData(result))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async admin_finance_time(req, res, next) {

        try {
            const { id } = req.params
            const idDecrypt = decryptId(id, 12)

            if (!req.query.type) {
                throw { message: 'Type is required' }
            }

            let [store_name] = await Store.aggregate(store_full_name(idDecrypt))

            if (req.query.type === 'product') {
                let [admin_finance_time] = await Sys_payment.aggregate(get_month_year(req.query, idDecrypt))

                admin_finance_time.store_name = store_name.store
                res.status(200).json(jsonData(admin_finance_time))
            }


            if (req.query.type === 'voucher') {
                let [admin_finance_time] = await Sys_voucher.aggregate(get_month_year(req.query, idDecrypt))


                admin_finance_time.store_name = store_name.store
                res.status(200).json(jsonData(admin_finance_time))
            }

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async storeDetail(req, res, next) {
        try {
            const { id, time } = req.params
            const idDecrypt = decryptId(id, 12)

            const { type } = req.query

            if (!type) { throw { message: 'Type is required' } }

            let [store_name] = await Store.aggregate(store_full_name(idDecrypt))

            if (type === 'product') {

                let [storeDetail] = await Sys_payment.aggregate(admin_tax_finance(time, idDecrypt, req.query))
                storeDetail.store_name = store_name.store

                res.status(200).json(jsonData(storeDetail))
            }


            if (type === 'voucher') {

                let [storeDetail] = await Sys_voucher.aggregate(admin_tax_finance(time, idDecrypt, req.query))
                storeDetail.store_name = store_name.store

                res.status(200).json(jsonData(storeDetail))
            }

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async chart_admin_detail(req, res, next) {
        try {
            const { time_start, time_end, time_start_double, time_end_double } = get_time_body(req)

            const [chartAdmin] = await Config.aggregate(admin_chart_detail(time_start, time_end, time_start_double, time_end_double))

            res.status(200).json(jsonData(chartAdmin))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async incomeDocs(req, res, next) {
        try {
            const { time_start, time_end, time_start_double, time_end_double } = get_time_body(req)

            const [incomeDocs] = await Config.aggregate(finance_doctor(time_start, time_end, time_start_double, time_end_double))

            res.status(200).json(jsonData(incomeDocs))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async chartFinanceDoctor(req, res, next) {
        try {
            const { time_start, time_end } = get_time_body(req)

            const chartFinanceDoctor = await Sys_doctor.aggregate(doctor_chart_detail(time_start, time_end))

            res.status(200).json(jsonData(chartFinanceDoctor))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async tableBasedOnStore(req, res, next) {
        try {
            const { time_start, time_end } = get_time_body(req)

            const { page, item_limit } = req.query

            const [tableBasedOnStore] = await Sys_doctor.aggregate(doctor_list_by_store(time_start, time_end, page, item_limit, rt_link))

            res.status(200).json(jsonData(tableBasedOnStore))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async table_docs_time(req, res, next) {
        try {
            const { store_id } = req.params

            const idDecrypt = decryptId(store_id, 12)

            const { page, item_limit } = req.query

            let [store_name] = await Store.aggregate(store_full_name(idDecrypt))

            const [table_docs_time] = await Sys_doctor.aggregate(doctor_list_month(idDecrypt, page, item_limit))

            table_docs_time.store_name = store_name.store

            res.status(200).json(jsonData(table_docs_time))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async tableBasedOnDocs(req, res, next) {
        try {

            const { page, item_limit, search_doctor } = req.query

            const { store_id, time } = req.params
            const idDecrypt = decryptId(store_id, 12)

            const [tableBasedOnDocs] = await Sys_doctor.aggregate(doctor_list(idDecrypt, page, item_limit, search_doctor, time, rt_link))

            let [store_name] = await Store.aggregate(store_full_name(idDecrypt))

            tableBasedOnDocs.store_name = store_name.store

            tableBasedOnDocs.month_year = time

            res.status(200).json(jsonData(tableBasedOnDocs))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async detailDoctor(req, res, next) {
        try {
            const { store_id, doctor_id, time } = req.params

            const idDecryptStore = decryptId(store_id, 12)

            const idDecryptDoctor = decryptId(doctor_id, 12)

            const [detailDoctor] = await Sys_doctor.aggregate(doctor_detail(idDecryptStore, idDecryptDoctor, time, rt_link))

            let [store_name] = await Store.aggregate(store_full_name(idDecryptStore))

            detailDoctor.store_name = store_name.store

            detailDoctor.month_year = time

            res.status(200).json(jsonData(detailDoctor))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async tableBasedOnUser(req, res, next) {
        try {

            const { page, item_limit, search_user } = req.query

            const { store_id, doctor_id, time } = req.params

            const idDecryptStore = decryptId(store_id, 12)

            const idDecryptDoctor = decryptId(doctor_id, 12)

            const [tableBasedOnUser] = await Sys_doctor.aggregate(list_doctor_by_user(idDecryptStore, idDecryptDoctor, page, item_limit, time, search_user, rt_link))

            res.status(200).json(jsonData(tableBasedOnUser))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }



    static async summaryTax(req, res, next) {
        try {

            let { time_start, time_end } = get_time_body(req)

            const [summaryTax] = await Config.aggregate(summary_tax(time_start, time_end))

            res.status(200).json(jsonData(summaryTax))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async tax_magic_mirror_online(req, res, next) {
        try {

            let { page, item_limit, search_store } = req.query

            let source = ['member-online']

            const [tax_magic_mirror_online] = await Store.aggregate(tax_magicmirror_online_offline(page, item_limit, search_store, rt_link, source))

            res.status(200).json(jsonData(tax_magic_mirror_online))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async tax_magic_mirror_onsite(req, res, next) {
        try {

            let { page, item_limit, search_store } = req.query

            let source = ['member-onsite', 'member-offline']

            const [tax_magic_mirror_onsite] = await Store.aggregate(tax_magicmirror_online_offline(page, item_limit, search_store, rt_link, source))

            res.status(200).json(jsonData(tax_magic_mirror_onsite))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async tax_magic_mirror_detail_id(req, res, next) {
        try {

            const { subs_id } = req.params

            const subs_decrypt = decryptId(subs_id, 12)

            const [tax_magic_mirror_detail_id] = await Sys_subscribe.aggregate(tax_magicmirror_online_id(subs_decrypt, rt_link))

            // tax_magic_mirror_detail_id.store_name = store_full_name

            res.status(200).json(jsonData(tax_magic_mirror_detail_id))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async tax_magic_mirror_online_monthlyList_list(req, res, next) {
        try {
            const { page, item_limit, type, search_id } = req.query

            if (!type) { throw { message: 'Type is required' } }

            const { store_id, time } = req.params

            const idDecrypt = decryptId(store_id, 12)

            const source = ['member-online']

            const [tax_magic_mirror_online_monthlyList_list] = await Sys_subscribe.aggregate(tax_magicmirror_monthyear_list(idDecrypt, type, time, search_id, page, item_limit, source))

            res.status(200).json(jsonData(tax_magic_mirror_online_monthlyList_list))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async tax_magic_mirror_onsite_monthlyList_list(req, res, next) {
        try {
            const { page, item_limit, type, search_id } = req.query

            if (!type) { throw { message: 'Type is required' } }

            const { store_id, time } = req.params

            const idDecrypt = decryptId(store_id, 12)

            const source = ['member-offline', 'member-onsite']

            const [tax_magic_mirror_online_monthlyList_list] = await Sys_subscribe.aggregate(tax_magicmirror_monthyear_list(idDecrypt, type, time, search_id, page, item_limit, source))

            res.status(200).json(jsonData(tax_magic_mirror_online_monthlyList_list))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }



    static async tax_magic_mirror_online_monthlyList_summary(req, res, next) {
        try {

            const { store_id, time } = req.params

            const idDecrypt = decryptId(store_id, 12)

            const source = ['member-online']

            let [tax_magic_mirror_online_monthlyList_summary] = await Sys_subscribe.aggregate(tax_magicmirror_monthyear_summary(idDecrypt, time, source))

            tax_magic_mirror_online_monthlyList_summary.month_year = changeToMonth(time)

            res.status(200).json(jsonData(tax_magic_mirror_online_monthlyList_summary))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async tax_magic_mirror_onsite_monthlyList_summary(req, res, next) {
        try {

            const { store_id, time } = req.params

            const idDecrypt = decryptId(store_id, 12)

            const source = ['member-onsite', 'member-offline']

            let [tax_magic_mirror_onsite_monthlyList_summary] = await Sys_subscribe.aggregate(tax_magicmirror_monthyear_summary(idDecrypt, time, source))

            tax_magic_mirror_onsite_monthlyList_summary.month_year = changeToMonth(time)

            res.status(200).json(jsonData(tax_magic_mirror_onsite_monthlyList_summary))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async tax_magic_mirror_online_monthlyList(req, res, next) {
        try {
            let { page, item_limit } = req.query

            const { store_id } = req.params

            const idDecrypt = decryptId(store_id, 12)

            const source = ['member-online']

            const [tax_magic_mirror_online_monthlyList] = await Sys_subscribe.aggregate(tax_magicmirror_monthyear(idDecrypt, page, item_limit, source))

            res.status(200).json(jsonData(tax_magic_mirror_online_monthlyList))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async tax_magic_mirror_onsite_monthlyList(req, res, next) {
        try {
            let { page, item_limit } = req.query

            const { store_id } = req.params

            const idDecrypt = decryptId(store_id, 12)

            const source = ['member-offline', 'member-onsite']

            const [tax_magic_mirror_onsite_monthlyList] = await Sys_subscribe.aggregate(tax_magicmirror_monthyear(idDecrypt, page, item_limit, source))

            res.status(200).json(jsonData(tax_magic_mirror_onsite_monthlyList))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async tax_magic_mirror_onsite_summary(req, res, next) {
        try {

            const { store_id } = req.params

            const idDecrypt = decryptId(store_id, 12)

            let source = ['member-onsite', 'member-offline']

            const [tax_magic_mirror_onsite_summary] = await Sys_subscribe.aggregate(tax_magicmirror_summary(idDecrypt, source))

            res.status(200).json(jsonData(tax_magic_mirror_onsite_summary))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async tax_magic_mirror_online_summary(req, res, next) {
        try {

            const { store_id } = req.params

            const idDecrypt = decryptId(store_id, 12)

            let source = ['member-online']

            const [tax_magic_mirror_online_summary] = await Sys_subscribe.aggregate(tax_magicmirror_summary(idDecrypt, source))

            res.status(200).json(jsonData(tax_magic_mirror_online_summary))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async tax_magic_mirror_public(req, res, next) {
        try {
            let { page, item_limit, search_user, type } = req.query

            let { time } = req.params

            const [tax_magic_mirror_public] = await Sys_subscribe.aggregate(tax_magicmirror_public(rt_link, search_user, page, item_limit, type, time))

            res.status(200).json(jsonData(tax_magic_mirror_public))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async tax_magic_mirror_public_detail(req, res, next) {
        try {

            const { payment_id, time } = req.params

            const idDecrypt = decryptId(payment_id, 12)

            const [tax_magic_mirror_public] = await Sys_subscribe.aggregate(tax_magicmirror_public_detail(idDecrypt, rt_link))

            res.status(200).json(jsonData(tax_magic_mirror_public))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async taxAdminList(req, res, next) {
        try {

            let { page, item_limit, search_store } = req.query

            let { time_start, time_end } = get_time_body(req)

            const [taxAdminList] = await Store.aggregate(tax_admin_list(time_start, time_end, rt_link, search_store, page, item_limit))

            res.status(200).json(jsonData(taxAdminList))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async listDetailAdmin(req, res, next) {
        try {

            const { store_id } = req.params

            const idDecrypt = decryptId(store_id, 12)

            const { tab, page, item_limit } = req.query

            const [tableAdminVoucher] = await Sys_voucher.aggregate(tax_admin_voucher(idDecrypt, page, item_limit))

            const [tableAdminProduct] = await Sys_payment.aggregate(tax_admin_product(idDecrypt, page, item_limit))

            if (tab === 'voucher') { res.status(200).json(jsonData(tableAdminVoucher)) }

            if (tab === 'product') { res.status(200).json(jsonData(tableAdminProduct)) }

            res.status(200).json(jsonData(tableAdminVoucher))


        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async list_product_detail(req, res, next) {
        try {
            let { store_id, payment_id } = req.params
            store_id = decryptId(store_id, 12)
            payment_id = decryptId(payment_id, 12)

            const [list_product_detail] = await Sys_payment.aggregate(tax_admin_product_detail(store_id, payment_id, rt_link))

            res.status(200).json(jsonData(list_product_detail))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async list_voucher_detail(req, res, next) {
        try {
            const { store_id, voucher_id } = req.params
            const store_decrypt = decryptId(store_id, 12)
            const voucher_decrypt = decryptId(voucher_id, 12)

            let [list_voucher_detail] = await Sys_voucher.aggregate(detail_payment(store_decrypt, voucher_decrypt, voucher_id, null, 'Voucher', '$prc'))

            list_voucher_detail.id_user = encryptId(list_voucher_detail.id_user, 12)

            res.status(200).json(jsonData(list_voucher_detail))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async cardDetailAdmin(req, res, next) {
        try {
            const { store_id } = req.params

            const idDecrypt = decryptId(store_id, 12)

            const [cardDetailAdmin] = await Store.aggregate(tax_admin_card(idDecrypt))

            res.status(200).json(jsonData(cardDetailAdmin))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async tableCommission(req, res, next) {
        try {
            let { page, item_limit, search_store } = req.query

            let { time_start, time_end } = get_time_body(req)

            const [tableCommission] = await Sys_doctor.aggregate(tax_com_list(time_start, time_end, page, item_limit, search_store, rt_link))

            res.status(200).json(jsonData(tableCommission))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async summaryConsultDocs(req, res, next) {
        try {
            const { store_id } = req.params

            const idDecrypt = decryptId(store_id, 12)

            const { page, item_limit, search_doctor } = req.query

            const [summaryConsultDocs] = await Sys_doctor.aggregate(tax_com_summmary(idDecrypt, page, item_limit, search_doctor, rt_link))

            res.status(200).json(jsonData(summaryConsultDocs))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async detailSummaryConsultDocs(req, res, next) {
        try {
            const { store_id, doctor_id } = req.params

            const storeDecrypt = decryptId(store_id, 12)

            const doctorDecrypt = decryptId(doctor_id, 12)

            const { page, item_limit, search_invoice } = req.query

            const [detailSummaryConsultDocs] = await Sys_doctor.aggregate(tax_com_summmary_detail(storeDecrypt, doctorDecrypt, page, item_limit, search_invoice))

            res.status(200).json(jsonData(detailSummaryConsultDocs))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }



    static async detail_payment_doctor(req, res, next) {
        try {
            const { store_id, doctor_id, payment_id } = req.params
            const storeDecrypt = decryptId(store_id, 12)
            const doctorDecrypt = decryptId(doctor_id, 12)
            const idPayment = decryptId(payment_id, 12)

            let [detail_payment_doctor] = await Sys_doctor.aggregate(detail_payment(storeDecrypt, idPayment, payment_id, doctorDecrypt, 'Konsultasi Dokter', '$mon.amm'))

            detail_payment_doctor.id_user = encryptId(detail_payment_doctor.id_user, 12)

            res.status(200).json(jsonData(detail_payment_doctor))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async totalCommissionBydocs(req, res, next) {
        try {
            const { store_id, doctor_id } = req.params

            const storeDecrypt = decryptId(store_id, 12)

            const doctorDecrypt = decryptId(doctor_id, 12)

            const [totalCommissionBydocs] = await Sys_doctor.aggregate(tax_com_by_docs(storeDecrypt, doctorDecrypt, rt_link))

            res.status(200).json(jsonData(totalCommissionBydocs))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async shippingSummary(req, res, next) {
        try {

            let { time_start, time_end, time_start_double, time_end_double } = get_time_body(req)

            const [shippingCost] = await Sys_payment.aggregate(shipping_summary(time_start, time_end, time_start_double, time_end_double))

            res.status(200).json(jsonData(shippingCost))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async buyerTable_detail(req, res, next) {
        try {

            let { payment_id } = req.params

            const idDecrypt = decryptId(payment_id, 12)

            const [buyerTable_detail] = await Sys_payment.aggregate(buyer_table_detail(idDecrypt, rt_link))

            res.status(200).json(jsonData(buyerTable_detail))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async buyerTable(req, res, next) {
        try {
            let { page, item_limit, search_id } = req.query

            let { time_start, time_end } = get_time_body(req)

            const [buyerTable] = await Sys_payment.aggregate(buyer_table(time_start, time_end, page, item_limit, search_id, rt_link))

            res.status(200).json(jsonData(buyerTable))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async payment_detail(req, res, next) {
        try {

            const { store_id, coupon_id, payment_id } = req.params

            const store_decrypt = decryptId(store_id, 12)

            const coupon_decrypt = decryptId(coupon_id, 12)

            const payment_decrypt = decryptId(payment_id, 12)

            const [payment_detail] = await Sys_payment.aggregate(payment_detail(store_decrypt, coupon_decrypt, payment_decrypt, rt_link))

            res.status(200).json(jsonData(payment_detail))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async user_use_coupon(req, res, next) {
        try {

            const { store_id, coupon_id } = req.params

            const store_decrypt = decryptId(store_id, 12)

            const coupon_decrypt = decryptId(coupon_id, 12)

            const { page, item_limit, search_name } = req.query

            const [user_use_coupon] = await Sys_payment.aggregate(user_uses_coupon(store_decrypt, coupon_decrypt, page, item_limit, search_name, rt_link))

            res.status(200).json(jsonData(user_use_coupon))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async seller_coupon(req, res, next) {
        try {

            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)

            const { page, item_limit, search_name } = req.query

            const [seller_coupon] = await Stores_coupon.aggregate(seller_coupon(idDecrypt, page, item_limit, search_name))

            res.status(200).json(jsonData(seller_coupon))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async sellerTable(req, res, next) {
        try {
            let { page, item_limit, search_store } = req.query

            let { time_start, time_end } = get_time_body(req)

            const [sellerTable] = await Store.aggregate(seller_table(time_start, time_end, page, item_limit, search_store, rt_link))

            res.status(200).json(jsonData(sellerTable))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async smTable(req, res, next) {
        try {

            let { page, item_limit, search_coupon } = req.query

            let { time_start, time_end } = get_time_body(req)

            const [smTable] = await Stores_coupon.aggregate(skin_mystery_table(time_start, time_end, page, item_limit, search_coupon))

            res.status(200).json(jsonData(smTable))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }



    static async user_use_sm_coupon(req, res, next) {
        try {
            const { coupon_id } = req.params

            const idDecrypt = decryptId(coupon_id, 12)

            let { search_name, page, item_limit } = req.query

            const [user_use_sm_coupon] = await Sys_payment.aggregate(user_sm_coupon(idDecrypt, search_name, page, item_limit, rt_link))

            res.status(200).json(jsonData((user_use_sm_coupon)))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async payment_detail_sm(req, res, next) {
        try {

            const { coupon_id, payment_id } = req.params

            const coupon_decrypt = decryptId(coupon_id, 12)

            const payment_decrypt = decryptId(payment_id, 12)

            const [payment_detail_sm] = await Sys_payment.aggregate(payment_detail_skin_mystery(coupon_decrypt, payment_decrypt, rt_link))

            res.status(200).json(jsonData(payment_detail_sm))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async penaltySummary(req, res, next) {
        try {

            let { time_start, time_end, time_start_double, time_end_double } = get_time_body(req)

            const [penaltySummary] = await RecordPenalty.aggregate(penalty_summary(time_start, time_end, time_start_double, time_end_double))

            res.status(200).json(jsonData(penaltySummary))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async penaltyList(req, res, next) {
        try {

            const { search_store, page, item_limit } = req.query

            const penaltyList = await Store.aggregate(penalty_list(search_store, page, item_limit, rt_link))

            res.status(200).json(jsonData(penaltyList[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async penaltyListDetail(req, res, next) {
        try {
            const { search_id, page, item_limit } = req.query

            const { store_id } = req.params

            const idDecrypt = decryptId(store_id, 12)

            const [penaltyListDetail] = await RecordPenalty.aggregate(penalty_list_detail(idDecrypt, search_id, page, item_limit))

            res.status(200).json(jsonData(penaltyListDetail))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async detailPenalty(req, res, next) {
        try {

            const { store_id, payment_id } = req.params

            const id_store = decryptId(store_id, 12)

            const id_payment = decryptId(payment_id, 12)

            const [detailPenalty] = await Sys_payment.aggregate(penalty_trx_detail(id_store, id_payment, rt_link))

            res.status(200).json(jsonData(detailPenalty))


        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async returnFeeSummary(req, res, next) {
        try {
            let { time_start, time_end, time_start_double, time_end_double } = get_time_body(req)

            const [returnFeeSummary] = await Sys_payment.aggregate(return_fee_summary(time_start, time_end, time_start_double, time_end_double))

            res.status(200).json(jsonData(returnFeeSummary))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async returnFeeList(req, res, next) {
        try {

            const { search_store, page, item_limit } = req.query

            const [returnFeeList] = await Store.aggregate(return_list(search_store, page, item_limit, rt_link))

            res.status(200).json(jsonData(returnFeeList))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async returnFeeListDetail(req, res, next) {
        try {
            const { search_id, page, item_limit } = req.query

            const { store_id } = req.params

            const idDecrypt = decryptId(store_id, 12)

            const [returnFeeListDetail] = await Sys_payment.aggregate(return_list_detail(search_id, page, item_limit, idDecrypt))

            res.status(200).json(jsonData(returnFeeListDetail))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async seller_income_magic_mirror(req, res, next) {
        try {

            let { search_store, page, item_limit } = req.query

            let { time_start, time_end } = get_time_body(req)

            const [seller_income_magic_mirror] = await Store.aggregate(seller_income_mm(time_start, time_end, search_store, page, item_limit))

            res.status(200).json(jsonData(seller_income_magic_mirror))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async seller_income_magic_mirror_bystorecard(req, res, next) {
        try {
            const { store_id } = req.params

            const idDecrypt = decryptId(store_id, 12)

            const [seller_income_magic_mirror_bystorecard] = await Sys_subscribe.aggregate(seller_list_by_store(idDecrypt))

            res.status(200).json(jsonData(seller_income_magic_mirror_bystorecard))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async seller_income_magic_mirror_bystoretime(req, res, next) {
        try {
            const { store_id } = req.params
            const { page, item_limit, search_time } = req.query

            const idDecrypt = decryptId(store_id, 12)

            const [seller_income_magic_mirror_bystoretime] = await Sys_subscribe.aggregate()

            res.status(200).json(jsonData(seller_income_magic_mirror_bystoretime))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async seller_income_magic_mirror_bystoretime_list(req, res, next) {
        try {
            const { store_id, month_year } = req.params
            const { page, item_limit, search_user } = req.query

            const idDecrypt = decryptId(store_id, 12)

            let [seller_income_magic_mirror_bystoretime_list] = await Sys_subscribe.aggregate(seller_income_mm_time_list(idDecrypt, page, item_limit, search_user, month_year, rt_link))

            res.status(200).json(jsonData(seller_income_magic_mirror_bystoretime_list))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async seller_income_magic_mirror_bystoretime_card(req, res, next) {
        try {
            const { store_id, month_year } = req.params

            const idDecrypt = decryptId(store_id, 12)

            let [seller_income_magic_mirror_bystoretime_card] = await Sys_subscribe.aggregate(seller_income_card(idDecrypt, month_year))

            seller_income_magic_mirror_bystoretime_card.time = changeToMonth(month_year)

            res.status(200).json(jsonData(seller_income_magic_mirror_bystoretime_card))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }



    static async seller_income_magic_mirror_bystoretime_list_payment(req, res, next) {
        try {
            const { store_id, month_year, payment_id } = req.params

            const store_decrypt = decryptId(store_id, 12)

            const payment_decrypt = decryptId(payment_id, 12)

            const [seller_income_magic_mirror_bystoretime_list_payment] = await Sys_subscribe.aggregate(seller_income_payment(store_decrypt, payment_decrypt, month_year, rt_link, payment_id))

            res.status(200).json(jsonData(seller_income_magic_mirror_bystoretime_list_payment))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async gross_income_excel(req, res, next) {
        try {

            let { time_start, time_end } = get_time_body(req)

            let magic_mirror_excel = await Sys_subscribe.aggregate(magic_mirror_finance_excel(time_start, time_end))

            let [incomeAdmin] = await Config.aggregate(admin_finance_excel(time_start, time_end))

            incomeAdmin = incomeAdmin.join_data

            let incomeDocs = await Sys_doctor.aggregate(doctor_finance_excel(time_start, time_end))

            if (incomeDocs.length === 0 || incomeAdmin.length === 0 || magic_mirror_excel === 0) { throw { message: 'This excel has empty data' } }

            magic_mirror_excel.forEach((el, i) => {
                el.No = i + 1
            })

            incomeAdmin.forEach((el, i) => {
                el.No = i + 1
            })

            incomeDocs.forEach((el, i) => {
                el.No = i + 1
            })


            let final_work_book = new excel.Workbook()


            let sheet_1 = final_work_book.addWorksheet('Finance_magic_mirror')

            let sheet_2 = final_work_book.addWorksheet('Finance_Admin')

            let sheet_3 = final_work_book.addWorksheet('Finance_doctor_consult')



            sheet_1 = excel_download(sheet_1, magic_mirror_excel[0], magic_mirror_excel)

            sheet_2 = excel_download(sheet_2, incomeAdmin[0], incomeAdmin)

            sheet_3 = excel_download(sheet_3, incomeDocs[0], incomeDocs)


            let file_name = 'All_Finance_Excel'

            await final_work_book.xlsx.writeFile(`./download/${file_name}.xlsx`)

            res.download(`download/${file_name}.xlsx`)


        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async magic_mirror_excel(req, res, next) {
        try {

            let { time_start, time_end } = get_time_body(req)

            let magic_mirror_excel = await Sys_subscribe.aggregate(magic_mirror_finance_excel(time_start, time_end))

            if (magic_mirror_excel.length === 0) { throw { message: 'This excel has empty data' } }

            magic_mirror_excel.forEach((el, i) => {
                el.No = i + 1
            })

            let final_work_book = new excel.Workbook()

            let sheet_1 = final_work_book.addWorksheet('Finance_magic_mirror')

            sheet_1 = excel_download(sheet_1, magic_mirror_excel[0], magic_mirror_excel)

            let file_name = 'Finance_magic_mirror'

            await final_work_book.xlsx.writeFile(`./download/${file_name}.xlsx`)

            res.download(`download/${file_name}.xlsx`)


        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async admin_excel(req, res, next) {
        try {

            let { time_start, time_end } = get_time_body(req)

            let [incomeAdmin] = await Config.aggregate(admin_finance_excel(time_start, time_end))

            let result = incomeAdmin.join_data

            if (result.length === 0) { throw { message: 'This excel has empty data' } }

            result.forEach((el, i) => {
                el.No = i + 1
            })

            let final_work_book = new excel.Workbook()

            let sheet_1 = final_work_book.addWorksheet('Finance_admin')

            sheet_1 = excel_download(sheet_1, result[0], result)

            let file_name = 'Finance_admin'

            await final_work_book.xlsx.writeFile(`./download/${file_name}.xlsx`)

            res.download(`download/${file_name}.xlsx`)


        } catch (error) {
            console.log(error);
            next(error)
        }
    }



    static async doctor_excel(req, res, next) {
        try {

            let { time_start, time_end } = get_time_body(req)

            let incomeDocs = await Sys_doctor.aggregate(doctor_finance_excel(time_start, time_end))

            if (incomeDocs.length === 0) { throw { message: 'This excel has empty data' } }

            incomeDocs.forEach((el, i) => {
                el.No = i + 1
            })

            let final_work_book = new excel.Workbook()

            let sheet_1 = final_work_book.addWorksheet('Finance_doctor_consult')

            sheet_1 = excel_download(sheet_1, incomeDocs[0], incomeDocs)

            let file_name = 'Finance_doctor_consult'

            await final_work_book.xlsx.writeFile(`./download/${file_name}.xlsx`)

            res.download(`download/${file_name}.xlsx`)

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

}

module.exports = KeuanganController