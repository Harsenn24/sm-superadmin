const { ObjectID } = require("bson")
const { date2number } = require("../helper/date2number")
const { decrypt, encrypt, decryptId, encryptId } = require("../helper/enkrip_id")
const { queryPagination } = require("../helper/pagination")
const switch_deadline = require("../helper/sts_deadline")
const switch_status_order = require("../helper/sts_order")
const { jsonData } = require("../middleware/sucess")
const { Store, User_coupon, Store_log, Sys_payment, Sys_products_seen, Config, Store_bank, Sys_voucher, Sys_doctor, Stores_coupon, ProductReview, VoucherReview, StoreFollower, StoreSeen, Stores_product, UserCart, Doctor, Stores_clinic, StoreVoucher, Sa_activity_log, RecordWithdraw, RecordPenalty, Sa_stores, Doctor_chat } = require("../model")
const switchbranch = require("../query/status_branch")
const { rt_link, twitter_link, facebook_link, domain, instagram_link, app_store_link, google_play_link, unsub_link, address, email_sm } = process.env
const { configMongo } = require("../config/index")
const nodemailer = require('nodemailer');
const status_store = require("../helper/sts_store")
const status_cek = require("../helper/cek_store_stat")
const { cancelation } = require("../helper/cancelation")
const { chartProductSeen } = require("../query/chart_product_seen")
const status_product = require("../helper/sts_product")
const { statusVch } = require("../helper/sts_voucher")
const md5 = require("md5")
const { template_accept_seller, template_reject_seller } = require("../template_email/index")
const { encodeBase64 } = require('../helper/base64')
const { percent_aggregate } = require("../helper/percent")
const { range_day_aggregate } = require("../helper/range_day")
const { count_gender } = require("../helper/count_gender")
const { search_something } = require("../helper/search_regex")
const statusVchSold = require("../helper/sts_voucher_sold")
const { rupiah_format_mongo } = require("../helper/rupiah")
const { statusKupon } = require("../helper/sts_coupon")

class SellerController {
    static async all_seller(req, res, next) {
        try {
            let { page, item_limit, tab, search_store, time_start, time_end } = req.query

            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }

            time_start = date2number(time_start)
            time_end = date2number(time_end)

            let filterMatch = 0

            if (tab) {
                filterMatch = { 'status': tab }
            } else {
                filterMatch = {}
            }

            let filterStore = 0

            if (search_store) {
                filterStore = {
                    'store_name': {
                        '$regex': search_store,
                        '$options': 'i'
                    }
                }
            } else {
                filterStore = {}
            }

            const all_seller = await Store.aggregate(queryPagination(
                [

                    {
                        '$addFields': {
                            'online': { '$toDouble': { '$ifNull': ['$det.on', { '$toDouble': '0.00' }] } }
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'stores_products',
                            'localField': '_id',
                            'foreignField': '_s',
                            'as': 'sp',
                            'pipeline': [
                                {
                                    '$lookup': {
                                        'from': 'sys_payment',
                                        'localField': '_id',
                                        'foreignField': 'dat._p',
                                        'as': 'payment',
                                        'pipeline': [
                                            {
                                                '$match': {
                                                    '$and': [
                                                        { 'ep': { '$lte': time_start } },
                                                        { 'ep': { '$gte': time_end } }
                                                    ]
                                                }
                                            },
                                            {
                                                '$count': 'total_produksi'
                                            }
                                        ]
                                    }
                                },
                                {
                                    '$unwind': { 'path': '$payment' }
                                },
                                {
                                    '$project': {
                                        'total': '$payment.total_produksi'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'sys_payment',
                            'localField': '_id',
                            'foreignField': '_s',
                            'as': 's_pym',
                            'pipeline': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start } },
                                            { 'ep': { '$gte': time_end } }
                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'total_trx': { '$sum': '$mon.amm' }
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'users',
                            'as': 'user',
                            'localField': '_u',
                            'foreignField': '_id',
                            'pipeline': [
                                {
                                    '$addFields': {
                                        'phone': { '$ifNull': [{ '$toString': '$dat.phn.val' }, 's0ttssssssssssss'] }
                                    }
                                },
                                {
                                    '$project': {
                                        'email': {
                                            '$function': {
                                                'body': decrypt,
                                                'args': [{ '$toString': '$dat.eml.val' }, 8],
                                                'lang': 'js'
                                            }
                                        },
                                        'phone_number': {
                                            '$function': {
                                                'body': decrypt,
                                                'args': ['$phone', 8],
                                                'lang': 'js'
                                            }
                                        }
                                    }
                                },
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'store_id': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            },
                            'total_prod': { '$ifNull': [{ '$first': '$sp.total' }, { '$toInt': '0' }] },
                            // 'email': { '$ifNull': [{ '$first': '$user.email' }, '-'] },
                            'email': {
                                '$function': {
                                    'body': decrypt,
                                    'args': [{ '$toString': '$ctc.eml' }, 8],
                                    'lang': 'js'
                                }
                            },

                            // 'phone_number': { '$ifNull': [{ '$first': '$user.phone_number' }, '-'] },
                            'phone_number': '$ctc.phn',

                            'total_trx': { '$ifNull': [{ '$sum': { '$first': '$s_pym.total_trx' } }, { '$toInt': '0' }] },
                            'status': {
                                '$cond': {
                                    'if': { '$lte': ['$netDouble', 0] },
                                    'then': 1,
                                    'else': '$netDouble'
                                }
                            },
                            'registrasi': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },

                        }
                    },
                    {
                        '$addFields': {
                            'minuteOn': {
                                '$dateDiff': {
                                    'startDate': {
                                        '$toDate': {
                                            '$multiply': ['$online', 1000.00]
                                        }
                                    },
                                    'endDate': { '$toDate': { '$multiply': [date2number(''), 1000.00] } },
                                    'unit': 'minute'
                                }
                            },
                            'dayRegist': {
                                '$dateDiff': {
                                    'startDate': {
                                        '$toDate': {
                                            '$multiply': ['$ep', 1000.00]
                                        }
                                    },
                                    'endDate': { '$toDate': { '$multiply': [date2number(''), 1000.00] } },
                                    'unit': 'day'
                                }
                            }
                        }
                    },
                    {
                        '$addFields': {
                            'status': status_store,
                            'store_name': {
                                '$trim': {
                                    'input': {
                                        '$reduce': {
                                            'input': '$det.nme',
                                            'initialValue': '',
                                            'in': {
                                                '$concat': [
                                                    '$$value',
                                                    ' ',
                                                    '$$this'
                                                ]
                                            }
                                        }
                                    },
                                    'chars': ' '
                                }
                            },
                            'total_trx': { '$sum': '$total_trx' },
                        }
                    },
                    {
                        '$match': { '$and': [filterMatch, filterStore] }
                    },
                    {
                        '$sort': { 'total_trx': -1 }
                    },
                ],
                [
                    {
                        '$project': {
                            '_id': '$store_id',
                            'store_image': { '$concat': [`${rt_link}store/i/`, { '$toString': '$store_id' }] },
                            'store_name': '$store_name',
                            'email': '$email',
                            'phone_number': '$phone_number',
                            'regist': '$registrasi',
                            'online_time': {
                                '$cond': {
                                    'if': { '$gt': ['$online', 0] },
                                    'then': {
                                        '$dateToString': {
                                            'date': { '$toDate': { '$multiply': ['$online', 1000.00] } },
                                            'format': '%Y-%m-%d',
                                            'onNull': '2020-01-01'
                                        }
                                    },
                                    'else': '-'
                                }
                            },
                            'total_product': '$total_prod',
                            'total_trx': '$total_trx',
                            'status': '$status',
                        }
                    },
                ], page, 3, item_limit
            ))

            res.status(201).json(jsonData(all_seller[0]))
        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async seller_visitor(req, res, next) {
        try {
            let { time_start, time_end } = req.query
            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }

            time_start = date2number(time_start)
            time_end = date2number(time_end)

            let time_start_double = time_end
            let time_end_double = time_end - (time_start - time_end)

            const { id } = req.params
            const idDecrypt = decryptId(id, 12)


            const seller_visitor = await StoreSeen.aggregate(
                [
                    {
                        '$match': {
                            '$and': [
                                { '_s': ObjectID(idDecrypt) },
                            ]
                        }
                    },
                    {
                        '$facet': {
                            'data_now': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start } },
                                            { 'ep': { '$gte': time_end } }
                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'date': {
                                            '$dateToString': {
                                                'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                                'format': '%Y-%m-%d',
                                                'onNull': '2020-01-01'
                                            }
                                        }
                                    }
                                },
                                {
                                    '$group': {
                                        '_id': '$date',
                                        'total': { '$sum': 1 }
                                    }
                                },
                                { '$sort': { '_id': 1 } },
                                {
                                    '$project': {
                                        'label': 'total_visitors',
                                        'x': '$_id',
                                        'y': '$total',
                                        '_id': 0
                                    }
                                }
                            ],
                            'data_double': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start_double } },
                                            { 'ep': { '$gte': time_end_double } }
                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'date': {
                                            '$dateToString': {
                                                'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                                'format': '%Y-%m-%d',
                                                'onNull': '2020-01-01'
                                            }
                                        }
                                    }
                                },
                                {
                                    '$group': {
                                        '_id': '$date',
                                        'total': { '$sum': 1 }
                                    }
                                },
                                { '$sort': { '_id': 1 } },
                                {
                                    '$project': {
                                        'label': 'total_visitors',
                                        'x': '$_id',
                                        'y': '$total',
                                        '_id': 0
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'visitor_now': { '$sum': '$data_now.y' },
                            'visitor_double': { '$sum': '$data_double.y' },
                            'days_compare': {
                                '$concat': [
                                    {
                                        '$toString': {
                                            '$dateDiff': {
                                                'startDate': {
                                                    '$toDate': {
                                                        '$multiply': [time_start, 1000]
                                                    }
                                                },
                                                'endDate': {
                                                    '$toDate': {
                                                        '$multiply': [time_end, 1000]
                                                    }
                                                },
                                                'unit': 'day'
                                            }
                                        }
                                    },
                                    ' days'
                                ]
                            }
                        }
                    },
                    {
                        '$addFields': {
                            'diff_percent_total_visitors': {
                                '$round': [
                                    {
                                        '$multiply': [
                                            {
                                                '$divide': [
                                                    { '$subtract': ['$visitor_now', '$visitor_double'] },
                                                    {
                                                        '$cond': {
                                                            'if': { '$lte': ['$visitor_double', 0] },
                                                            'then': 1,
                                                            'else': '$visitor_double'
                                                        }
                                                    }
                                                ]
                                            }, 100
                                        ]
                                    }, 2
                                ]
                            },
                        }
                    },
                    {
                        '$project': {
                            'visitor': '$visitor_now',
                            'diff_percent': '$diff_percent_total_visitors',
                            'diff_days': '$days_compare',
                            'statistic': '$data_now',
                            '_id': 0
                        }
                    }
                ]
            )

            res.status(200).json(jsonData(seller_visitor[0]))
        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async seller_detail(req, res, next) {
        try {
            let { time_start, time_end } = req.query
            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }

            time_start = date2number(time_start)
            time_end = date2number(time_end)

            const { id } = req.params
            const idDecrypt = decryptId(id, 12)

            const seller_prod = await Store.aggregate([

                {
                    '$match': {
                        '_id': ObjectID(idDecrypt),
                    }
                },
                {
                    '$lookup': {
                        'from': 'sys_payment',
                        'localField': '_id',
                        'foreignField': '_s',
                        'as': 's_pym',
                        'pipeline': [

                            {
                                '$match': {
                                    '$and': [
                                        { 'ep': { '$lte': time_start } },
                                        { 'ep': { '$gte': time_end } },
                                    ]
                                }
                            },
                            {
                                '$addFields': {
                                    'status': switchbranch
                                }
                            },
                            {
                                '$facet': {
                                    'new_order': [
                                        {
                                            '$match': {
                                                'status': 'new_order'
                                            }
                                        },
                                        {
                                            '$count': 'total'
                                        }
                                    ],
                                    'packed': [
                                        {
                                            '$match': {
                                                'status': { '$in': ['packed'] }
                                            }
                                        },
                                        {
                                            '$count': 'total'
                                        }
                                    ],
                                    'canceled': [
                                        {
                                            '$match': {
                                                'status': { '$in': ['cancel_process', 'canceled'] }
                                            }
                                        },
                                        {
                                            '$count': 'total'
                                        }
                                    ],
                                    'returned': [
                                        {
                                            '$match': {
                                                'status': { '$in': ['return_process', 'returned'] }
                                            }
                                        },
                                        {
                                            '$count': 'total'
                                        }
                                    ],

                                }
                            },
                            {
                                '$addFields': {
                                    'new_order': { '$ifNull': [{ '$first': '$new_order.total' }, 0] },
                                    'packed': { '$ifNull': [{ '$first': '$packed.total' }, 0] },
                                    'canceled': { '$ifNull': [{ '$first': '$canceled.total' }, 0] },
                                    'returned': { '$ifNull': [{ '$first': '$returned.total' }, 0] },
                                }
                            }

                        ]
                    }
                },
                {
                    '$lookup': {
                        'from': 'users',
                        'localField': '_u',
                        'foreignField': '_id',
                        'as': 'usr',
                        'pipeline': [
                            {
                                '$sort': { '_id': -1 }
                            },
                            {
                                '$project': {
                                    'owner': {
                                        '$reduce': {
                                            'input': '$dat.fln',
                                            'initialValue': '',
                                            'in': {
                                                '$concat': [
                                                    '$$value',
                                                    { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                                    '$$this'
                                                ]
                                            }
                                        }
                                    },
                                }
                            }
                        ]
                    }
                },
                {
                    '$addFields': {
                        'store_id': {
                            '$function': {
                                'body': encrypt,
                                'args': [{ '$toString': '$_id' }, 12],
                                'lang': 'js'
                            }
                        },
                    }
                },
                {
                    '$project': {
                        '_id': 0,
                        'new_order': { '$first': '$s_pym.new_order' },
                        'packed': { '$first': '$s_pym.packed' },
                        'canceled': { '$first': '$s_pym.canceled' },
                        'returned': { '$first': '$s_pym.returned' },
                        'seller_name': '$det.nms',
                        'store_image': { '$concat': [`${rt_link}store/i/`, { '$toString': '$store_id' }] },
                    }
                }
            ])

            res.status(200).json(jsonData(seller_prod[0]))
        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async prod_seen(req, res, next) {
        try {
            let { time_start, time_end } = req.query

            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }

            time_start = date2number(time_start)
            time_end = date2number(time_end)
            let time_start_double = time_end
            let time_end_double = time_end - (time_start - time_end)

            const { id } = req.params
            const idDecrypt = decryptId(id, 12)


            if (id.length < 24 || id.length > 24) {
                throw { message: 'Id is invalid' }
            }

            let dataProdSeen = await Store.aggregate([
                {
                    '$sort': { '_id': -1 }
                },
                {
                    '$match': {
                        '$and': [
                            { '_id': ObjectID(idDecrypt), },
                        ]
                    }
                },
                {
                    '$lookup': {
                        'from': 'sys_products_seen',
                        'localField': '_id',
                        'foreignField': '_s',
                        'as': 'seen',
                        'pipeline': [
                            {
                                '$sort': { '_id': -1 }
                            },
                            {
                                '$facet': {
                                    'seen_now': [
                                        {
                                            '$match': {
                                                '$and': [
                                                    { 'ep': { '$lte': time_start } },
                                                    { 'ep': { '$gte': time_end } }
                                                ]
                                            }
                                        },
                                        {
                                            '$count': 'data'
                                        }
                                    ],
                                    'seen_double': [
                                        {
                                            '$match': {
                                                '$and': [
                                                    { 'ep': { '$lte': time_start_double } },
                                                    { 'ep': { '$gte': time_end_double } }
                                                ]
                                            }
                                        },
                                        {
                                            '$count': 'data'
                                        }
                                    ],
                                    'lastTimeVisit': [
                                        {
                                            '$sort': { '_id': -1 }
                                        },
                                        {
                                            '$limit': 1
                                        },
                                        {
                                            '$project': {
                                                'time': {
                                                    '$dateToString': {
                                                        'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                                        'format': '%Y-%m-%d',
                                                        'onNull': '2020-01-01'
                                                    }
                                                },
                                                'hour': {
                                                    '$dateToString': {
                                                        'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                                        'format': '%H:%M',
                                                        'onNull': '2020-01-01'
                                                    }
                                                }
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                '$project': {
                                    'seenNow': { '$ifNull': [{ '$first': '$seen_now.data' }, 0] },
                                    'seenDouble': { '$ifNull': [{ '$first': '$seen_double.data' }, 0] },
                                    'time': { '$toString': { '$ifNull': [{ '$first': '$lastTimeVisit.time' }, 0] } },
                                    'hour': { '$toString': { '$ifNull': [{ '$first': '$lastTimeVisit.hour' }, 0] } },
                                }
                            }
                        ]
                    }
                },
                {
                    '$addFields': {
                        'seenNow': { '$first': '$seen.seenNow' },
                        'seenDouble': { '$first': '$seen.seenDouble' },
                    }
                },
                {
                    '$addFields': {
                        'percent': {
                            '$round': [
                                {
                                    '$multiply': [
                                        {
                                            '$divide': [
                                                { '$subtract': ['$seenNow', '$seenDouble'] },
                                                {
                                                    '$cond': {
                                                        'if': { '$lte': ['$seenDouble', 0] },
                                                        'then': 1,
                                                        'else': '$seenDouble'
                                                    }
                                                }
                                            ]
                                        }, 100
                                    ]
                                }, 2
                            ]
                        },
                        'diff_days': {
                            '$concat': [
                                {
                                    '$toString': {
                                        '$dateDiff': {
                                            'startDate': {
                                                '$toDate': {
                                                    '$multiply': [time_start, 1000]
                                                }
                                            },
                                            'endDate': {
                                                '$toDate': {
                                                    '$multiply': [time_end, 1000]
                                                }
                                            },
                                            'unit': 'day'
                                        }
                                    }
                                },
                                ' days'
                            ]
                        },
                    }
                },
                {
                    '$project': {
                        'total_seen': '$seenNow',
                        'percent': '$percent',
                        'days': '$diff_days',
                        'last_time_visit': { '$concat': [{ '$first': '$seen.time' }, ' ', { '$first': '$seen.hour' }] },
                        '_id': 0
                    }
                }
            ])

            let chartProdSeen = await Store.aggregate([
                {
                    '$sort': { '_id': -1 }
                },
                {
                    '$match': {
                        '$and': [
                            { '_id': ObjectID(idDecrypt), },
                        ]
                    }
                },
                {
                    '$lookup': {
                        'from': 'sys_products_seen',
                        'localField': '_id',
                        'foreignField': '_s',
                        'as': 'ps',
                        'pipeline': [
                            {
                                '$sort': { '_id': -1 }
                            },
                            {
                                '$match': {
                                    '$and': [
                                        { 'ep': { '$lte': time_start } },
                                        { 'ep': { '$gte': time_end } }
                                    ]
                                }
                            },
                            {
                                '$addFields': {
                                    'date': {
                                        '$dateToString': {
                                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                            'format': '%Y-%m-%d',
                                            'onNull': '2020-01-01'
                                        }
                                    },
                                    'total': { '$sum': 1 }
                                }
                            },
                            {
                                '$group': {
                                    '_id': '$date',
                                    'total': { '$sum': '$total' }
                                }
                            },
                            {
                                '$project': {
                                    '_id': 0,
                                    'x': '$_id',
                                    'y': '$total',
                                    'label': 'product_seen'
                                }
                            },
                            {
                                '$sort': { 'x': 1 }
                            }
                        ]
                    }
                },
                {
                    '$project': {
                        '_id': 0,
                        'result': '$ps'
                    }
                }

            ])


            dataProdSeen[0].statistic = chartProdSeen[0].result

            res.status(200).json(jsonData(dataProdSeen[0]))
        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async grafik_prodseen(req, res, next) {
        try {
            let { time_start, time_end } = req.query

            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }

            time_start = date2number(time_start)
            time_end = date2number(time_end)

            const { id } = req.params
            const idDecrypt = decryptId(id, 12)

            const grafik_prodseen = await Store.aggregate([
                {
                    '$sort': { '_id': -1 }
                },
                {
                    '$match': {
                        '$and': [
                            { '_id': ObjectID(idDecrypt), },
                        ]
                    }
                },
                {
                    '$lookup': {
                        'from': 'sys_products_seen',
                        'localField': '_id',
                        'foreignField': '_s',
                        'as': 'ps',
                        'pipeline': [
                            {
                                '$sort': { '_id': -1 }
                            },
                            {
                                '$match': {
                                    '$and': [
                                        { 'ep': { '$lte': time_start } },
                                        { 'ep': { '$gte': time_end } }
                                    ]
                                }
                            },
                            {
                                '$addFields': {
                                    'date': {
                                        '$dateToString': {
                                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                            'format': '%Y-%m-%d',
                                            'onNull': '2020-01-01'
                                        }
                                    },
                                    'total': { '$sum': 1 }
                                }
                            },
                            {
                                '$group': {
                                    '_id': '$date',
                                    'total': { '$sum': '$total' }
                                }
                            },
                            {
                                '$project': {
                                    '_id': 0,
                                    'x': '$_id',
                                    'y': '$total',
                                    'label': 'product_seen'
                                }
                            },
                            {
                                '$sort': { 'x': 1 }
                            }
                        ]
                    }
                },
                {
                    '$project': {
                        '_id': 0,
                        'result': '$ps'
                    }
                }

            ])

            if (grafik_prodseen.length === 0) {
                res.status(200).json(jsonData({ result: [] }))
            }

            res.status(200).json(jsonData(grafik_prodseen[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async topProdSeller(req, res, next) {
        try {
            const { id } = req.params
            const idDecrypt = decryptId(id, 12)

            const top_product_seller = await Store.aggregate([
                {
                    '$match': { '_id': ObjectID(idDecrypt) }
                },
                {
                    '$lookup': {
                        'from': 'stores_products',
                        'localField': '_id',
                        'foreignField': '_s',
                        'as': 'sp',
                        'pipeline': [
                            {
                                '$lookup': {
                                    'from': 'sys_payment',
                                    'foreignField': 'dat._p',
                                    'localField': '_id',
                                    'let': {
                                        'product_id': '$_id'
                                    },
                                    'as': 'test',
                                    'pipeline': [
                                        {
                                            '$match': { 'shp.sts': { '$in': ['settlement', 'shipping-deliver'] } },
                                        },
                                        {
                                            '$project': {
                                                'count': {
                                                    '$sum': {
                                                        '$filter': {
                                                            'input': {
                                                                '$map': {
                                                                    'input': '$dat',
                                                                    'in': {
                                                                        '$cond': {
                                                                            'if': { '$eq': ['$$this._p', '$$product_id'] },
                                                                            'then': '$$this.qty',
                                                                            'else': null
                                                                        }
                                                                    }
                                                                }
                                                            },
                                                            'cond': [
                                                                { $ne: ['$$this', null] },
                                                            ]
                                                        }
                                                    }
                                                },
                                                '_id': 0
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                '$addFields': {
                                    'qty': { '$sum': '$test.count' }
                                }
                            },
                            {
                                '$project': {
                                    'product_name': '$det.nms',
                                    '_id': 0,
                                    'product_image': {
                                        '$concat': [`${rt_link}store/ip/`, {
                                            '$function': {
                                                'body': encrypt,
                                                'args': [{ '$toString': '$_id' }, 12],
                                                'lang': 'js'
                                            }
                                        }, '/0']
                                    },
                                    'qty': '$qty',
                                }
                            },
                            {
                                '$sort': { 'qty': -1 }
                            },
                            {
                                '$limit': 5
                            }

                        ]

                    }
                },
                {
                    '$project': {
                        'result': '$sp',
                        '_id': 0
                    }
                }
            ])


            res.status(200).json(jsonData(top_product_seller[0].result))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async data_order(req, res, next) {
        try {
            let { time_start, time_end } = req.query

            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }

            time_start = date2number(time_start)
            time_end = date2number(time_end)
            let time_start_double = time_end
            let time_end_double = time_end - (time_start - time_end)

            const data_order = await Sys_payment.aggregate([
                {
                    '$match': {
                        '$and': [
                            { 'ep': { '$lte': time_start } },
                            { 'ep': { '$gte': time_end_double } }
                        ]
                    }
                },
                {
                    '$facet': {
                        'total_qty_now': [
                            {
                                '$match': {
                                    '$and': [
                                        { 'ep': { '$lte': time_start } },
                                        { 'ep': { '$gte': time_end } }
                                    ]
                                }
                            },
                            {
                                '$project': {
                                    'qty_now': {
                                        '$sum': {
                                            '$map': {
                                                'input': '$dat',
                                                'as': 'el',
                                                'in': '$$el.qty'
                                            }
                                        }
                                    },
                                    '_id': 0
                                }

                            }
                        ],
                        'total_qty_double': [
                            {
                                '$match': {
                                    '$and': [
                                        { 'ep': { '$lte': time_start_double } },
                                        { 'ep': { '$gte': time_end_double } }
                                    ]
                                }
                            },
                            {
                                '$project': {
                                    'qty_double': {
                                        '$sum': {
                                            '$map': {
                                                'input': '$dat',
                                                'as': 'el',
                                                'in': '$$el.qty'
                                            }
                                        }
                                    },
                                    '_id': 0
                                }

                            }
                        ]
                    }
                },
                {
                    '$addFields': {
                        'qty_total_now': { '$sum': '$total_qty_now.qty_now' },
                        'qty_total_double': { '$sum': '$total_qty_double.qty_double' },

                    }
                },
                {

                    '$addFields': {
                        'order_percent': {
                            '$multiply': [
                                {
                                    '$divide': [
                                        { '$subtract': ['$qty_total_now', '$qty_total_double'] },
                                        {
                                            '$cond': {
                                                'if': { '$lte': ['$qty_total_double', 0] },
                                                'then': 1,
                                                'else': '$qty_total_double'
                                            }
                                        }
                                    ]
                                }, 100
                            ]
                        }
                    }

                },
                {
                    '$project': {
                        'order_percent': '$order_percent',
                        'total_order': '$qty_total_now',
                    }
                }
            ])

            if (data_order.length === 0) {
                throw { message: 'Data not found' }
            }

            res.status(200).json(jsonData(data_order[0]))
        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async data_prod_seen(req, res, next) {
        try {
            let { time_start, time_end, time_start_double, time_end_double } = req.query

            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }

            if (!time_start_double) {
                throw { message: 'Start Date double is required' }
            }

            if (!time_end_double) {
                throw { message: 'End Date double is required' }
            }

            time_start = date2number(time_start)
            time_end = date2number(time_end)
            time_start_double = date2number(time_start_double)
            time_end_double = date2number(time_end_double)
            const data_prod_seen = await Sys_products_seen.aggregate([
                {
                    '$match': {
                        '$and': [
                            { 'ep': { '$lte': time_start } },
                            { 'ep': { '$gte': time_end_double } }
                        ]
                    }
                },
                {
                    '$facet': {
                        'data_a': [
                            {
                                '$match': {
                                    '$and': [
                                        { 'ep': { '$lte': time_start } },
                                        { 'ep': { '$gte': time_end } }
                                    ]
                                }
                            },
                            {
                                '$addFields': {
                                    'date': {
                                        '$dateToString': {
                                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                            'format': '%d',
                                            'onNull': '2020-01-01'
                                        }
                                    }
                                }
                            },
                            {
                                '$group': {
                                    '_id': '$date',
                                    'total': { '$sum': 1 }
                                }
                            },
                            {
                                '$project': {
                                    'label': 'stat_produk',
                                    'x': '$_id',
                                    'y': '$total',
                                    '_id': 0
                                }
                            }
                        ],
                        'data_b': [
                            {
                                '$match': {
                                    '$and': [
                                        { 'ep': { '$lte': time_start_double } },
                                        { 'ep': { '$gte': time_end_double } }
                                    ]
                                }
                            },
                            {
                                '$addFields': {
                                    'date': {
                                        '$dateToString': {
                                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                            'format': '%d',
                                            'onNull': '2020-01-01'
                                        }
                                    }
                                }
                            },
                            {
                                '$group': {
                                    '_id': '$date',
                                    'total': { '$sum': 1 }
                                }
                            },
                            {
                                '$project': {
                                    'label': 'stat_produk',
                                    'x': '$_id',
                                    'y': '$total',
                                    '_id': 0
                                }
                            }
                        ]
                    }
                },
                {
                    '$addFields': {
                        'data_now': { '$sum': '$data_a.y' },
                        'data_double': { '$sum': '$data_b.y' }
                    }
                },
                {
                    '$addFields': {
                        'percent': {
                            '$multiply': [
                                {
                                    '$divide': [
                                        { '$subtract': ['$data_now', '$data_double'] },
                                        {
                                            '$cond': {
                                                'if': { '$lte': ['$data_double', 0] },
                                                'then': 1,
                                                'else': '$data_double'
                                            }
                                        }
                                    ]
                                }, 100
                            ]
                        }
                    }
                },
                {
                    '$project': {
                        'statistic': '$data_a',
                        'total_product': '$data_now',
                        'percent': '$percent',
                        'range_day': {
                            '$concat': [
                                {
                                    '$toString': {
                                        '$dateDiff': {
                                            'startDate': {
                                                '$toDate': {
                                                    '$multiply': [time_start, 1000]
                                                }
                                            },
                                            'endDate': {
                                                '$toDate': {
                                                    '$multiply': [time_end, 1000]
                                                }
                                            },
                                            'unit': 'day'
                                        }
                                    }
                                },
                                ' days'
                            ]
                        }
                    }
                }
            ])

            if (data_prod_seen.length === 0) {
                throw { message: 'Data not found' }
            }

            res.status(200).json(jsonData(data_prod_seen))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async dataStore(req, res, next) {
        try {
            const { id } = req.params
            const idDecrypt = decryptId(id, 12)

            const dataStore = await Store.aggregate(
                [
                    {
                        '$match': {
                            '$and': [
                                { '_id': ObjectID(idDecrypt) },
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'users',
                            'as': 'us',
                            'localField': '_u',
                            'foreignField': '_id',
                            'pipeline': [
                                {
                                    '$project': {
                                        'owner': {
                                            '$reduce': {
                                                'input': '$dat.fln',
                                                'initialValue': '',
                                                'in': {
                                                    '$concat': [
                                                        '$$value',
                                                        { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                                        '$$this'
                                                    ]
                                                }
                                            }
                                        },
                                        'email': {
                                            '$cond': {
                                                'if': { '$eq': ['$dat.eml.val', null] },
                                                'then': '-',
                                                'else': {
                                                    '$function': {
                                                        'body': decrypt,
                                                        'args': [{ '$toString': '$dat.eml.val' }, 8],
                                                        'lang': 'js'
                                                    }
                                                },
                                            }
                                        },

                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'dateRegist': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'timeRegist': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                    'format': '%H:%M',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'dateReject': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$epj', 1000] } },
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'timeReject': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$epj', 1000] } },
                                    'format': '%H:%M',
                                    'onNull': '2020-01-01'
                                }
                            }
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'stores_address',
                            'as': 'sa',
                            'localField': '_id',
                            'foreignField': '_s',
                            'pipeline': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'man': { '$eq': true } },
                                            { 'pgm': { '$eq': true } }
                                        ]
                                    }
                                },
                                {
                                    '$project': {
                                        'label': '$nme',
                                        'receiver': '$rcv',
                                        'province': '$shp.pn',
                                        'city': '$shp.cn',
                                        'suburb': '$shp.sn',
                                        'area': '$shp.an',
                                        'zip': '$shp.zip',
                                        'address': '$shp.cc',
                                        'detail': '$det'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$project': {
                            '_id': 0,
                            'store_name': {
                                '$reduce': {
                                    'input': '$det.nme',
                                    'initialValue': '',
                                    'in': {
                                        '$concat': [
                                            '$$value',
                                            { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                            '$$this'
                                        ]
                                    }
                                }
                            },
                            'email': { '$ifNull': [{ '$first': '$us.email' }, '-'] },
                            'owner': { '$ifNull': [{ '$first': '$us.owner' }, '-'] },
                            'phone': {
                                '$cond': {
                                    'if': { '$eq': ['$ctc.phn', null] },
                                    'then': '-',
                                    'else': '$ctc.phn'
                                }
                            },
                            'regist': { '$concat': ['$dateRegist', ' ', '$timeRegist'] },
                            'reject': { '$concat': ['$dateReject', ' ', '$timeReject'] },
                            'label': { '$ifNull': [{ '$first': '$sa.label' }, '-'] },
                            'receiver': { '$ifNull': [{ '$first': '$sa.receiver' }, '-'] },
                            'province': { '$ifNull': [{ '$first': '$sa.province' }, '-'] },
                            'city': { '$ifNull': [{ '$first': '$sa.city' }, '-'] },
                            'suburb': { '$ifNull': [{ '$first': '$sa.suburb' }, '-'] },
                            'area': { '$ifNull': [{ '$first': '$sa.area' }, '-'] },
                            'zip': { '$ifNull': [{ '$first': '$sa.zip' }, '-'] },
                            'address': { '$ifNull': [{ '$first': '$sa.address' }, '-'] },
                            'status': 'reject',
                            'detail': { '$ifNull': [{ '$first': '$sa.detail' }, '-'] },
                        }
                    }
                ]
            )

            res.status(200).json(jsonData(dataStore[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async incomeInfo(req, res, next) {
        try {
            const { store_id } = req.params

            const idDecrypt = decryptId(store_id, 12)

            const incomeInfo = await Config.aggregate([
                {
                    '$match': {
                        'type': 'subscribe'
                    }
                },
                {
                    '$lookup': {
                        'from': 'sys_payment',
                        'pipeline': [
                            {
                                '$match': {
                                    '_s': ObjectID(idDecrypt)
                                }
                            },
                            {
                                '$facet': {
                                    'money_hold': [
                                        {
                                            '$match': {
                                                '$and': [
                                                    { 'pym.sts': { '$nin': ['pending', 'failed', 'refund-pending', 'refund-accepted', 'refunded'] } },
                                                    { 'shp.sts': { '$nin': ['returned', 'canceled', 'cancelled', 'settlement'] } }
                                                ]
                                            }
                                        },
                                        {
                                            '$addFields': {
                                                'total_money': { '$sum': { '$subtract': ['$mon.amm', { '$add': ['$mon.tsc', '$mon.fee', '$mon.tlo'] }] } }

                                            }
                                        },
                                        {
                                            '$project': {
                                                'total_money': '$total_money',
                                                '_id': 0
                                            }
                                        }
                                    ],
                                    'money_ready': [
                                        {
                                            '$match': {
                                                '$and': [
                                                    { 'pym.sts': 'settlement' },
                                                    { 'shp.sts': 'settlement' },
                                                ]
                                            }
                                        },
                                        {
                                            '$addFields': {
                                                'total_money': { '$subtract': ['$mon.amm', { '$add': ['$mon.tsc', '$mon.fee', '$mon.tlo'] }] }
                                            }
                                        },
                                        {
                                            '$project': {
                                                'total_money': '$total_money',
                                                '_id': 0
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                '$addFields': {
                                    'hold': { '$sum': '$money_hold.total_money' },
                                    'ready': { '$sum': '$money_ready.total_money' }
                                }
                            },
                            {
                                '$project': {
                                    'money_hold': '$hold',
                                    'money_ready': '$ready',
                                    'status': 'product',
                                    '_id': 0,
                                }
                            }
                        ],
                        'as': 'payment'
                    }
                },
                {
                    '$lookup': {
                        'from': 'sys_vouchers',
                        'pipeline': [
                            {
                                '$match': { '_s': ObjectID(idDecrypt) }
                            },
                            {
                                '$facet': {
                                    'money_hold': [
                                        {
                                            '$match': {
                                                '$and': [
                                                    { 'pym.sts': { '$nin': ['settlement'] } },
                                                ]
                                            }
                                        },
                                        {
                                            '$addFields': {
                                                'total_money': { '$subtract': ['$prc', '$mon.fee'] }
                                            }
                                        },
                                        {
                                            '$project': {
                                                'total_money': '$total_money',
                                                '_id': 0
                                            }
                                        }
                                    ],
                                    'money_ready': [
                                        {
                                            '$match': {
                                                '$and': [
                                                    { 'pym.sts': 'settlement' },
                                                ]
                                            }
                                        },
                                        {
                                            '$addFields': {
                                                'total_money': { '$subtract': ['$prc', '$mon.fee'] }

                                            }
                                        },
                                        {
                                            '$project': {
                                                'total_money': '$total_money',
                                                '_id': 0
                                            }
                                        }
                                    ]
                                }
                            },

                            {
                                '$addFields': {
                                    'hold': { '$sum': '$money_hold.total_money' },
                                    'ready': { '$sum': '$money_ready.total_money' }
                                }
                            },
                            {
                                '$project': {
                                    'money_hold': '$hold',
                                    'money_ready': '$ready',
                                    'status': 'voucher',
                                    '_id': 0,
                                }
                            }
                        ],
                        'as': 'vouchers'
                    }
                },
                {
                    '$lookup': {
                        'from': 'sys_doctors',
                        'pipeline': [
                            {
                                '$match': { '_s': ObjectID(idDecrypt) }
                            },
                            {
                                '$facet': {
                                    'money_hold': [
                                        {
                                            '$match': {
                                                '$and': [
                                                    { 'pym.sts': { '$nin': ['settlement'] } },
                                                ]
                                            }
                                        },
                                        {
                                            '$addFields': {
                                                'total_money': '$mon.amr'
                                            }
                                        },
                                        {
                                            '$project': {
                                                'total_money': '$total_money',
                                                '_id': 0
                                            }
                                        }
                                    ],
                                    'money_ready': [
                                        {
                                            '$match': {
                                                '$and': [
                                                    { 'pym.sts': 'settlement' },
                                                ]
                                            }
                                        },
                                        {
                                            '$addFields': {
                                                'total_money': '$mon.amr'

                                            }
                                        },
                                        {
                                            '$project': {
                                                'total_money': '$total_money',
                                                '_id': 0
                                            }
                                        }
                                    ]
                                }
                            },

                            {
                                '$addFields': {
                                    'hold': { '$sum': '$money_hold.total_money' },
                                    'ready': { '$sum': '$money_ready.total_money' }
                                }
                            },
                            {
                                '$project': {
                                    'money_hold': '$hold',
                                    'money_ready': '$ready',
                                    'status': 'doctor',
                                    '_id': 0,
                                }
                            }
                        ],
                        'as': 'doctor'
                    }
                },

                {
                    '$addFields': {
                        'payment_ready': { '$sum': '$payment.money_ready' },
                        'payment_hold': { '$sum': '$payment.money_hold' },

                        'voucher_ready': { '$sum': '$vouchers.money_ready' },
                        'voucher_hold': { '$sum': '$vouchers.money_hold' },

                        'doctor_ready': { '$sum': '$doctor.money_ready' },
                        'doctor_hold': { '$sum': '$doctor.money_hold' },
                    }
                },
                {
                    '$project': {
                        // 'money_hold': { '$add': ['$payment_hold', '$voucher_hold', '$doctor_hold'] },
                        // 'money_ready': { '$add': ['$payment_ready', '$voucher_ready', '$doctor_ready'] },
                        'money_hold': { '$add': ['$payment_hold'] },
                        'money_ready': { '$add': ['$payment_ready'] },
                        '_id': 0
                    }
                }
            ])
            res.status(200).json(jsonData(incomeInfo[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }


    }

    static async moneyHold(req, res, next) {
        try {
            const { store_id } = req.params

            const { page, item_limit, status } = req.query

            const idDecrypt = decryptId(store_id, 12)

            let filterStatus = 0

            if (status) {
                filterStatus = {
                    'result.status': {
                        '$regex': status,
                        '$options': 'i'
                    }
                }
            } else {
                filterStatus = {}
            }

            const money_hold = await Config.aggregate(queryPagination(
                [
                    {
                        '$limit': 1
                    },
                    {
                        '$lookup': {
                            'from': 'sys_payment',
                            'pipeline': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'pym.sts': { '$nin': ['pending', 'failed', 'refund-pending', 'refund-accepted', 'refunded'] } },
                                            { 'shp.sts': { '$nin': ['returned', 'canceled', 'cancelled', 'settlement'] } },
                                            { '_s': ObjectID(idDecrypt) }
                                        ]
                                    }
                                },
                                {
                                    '$lookup': {
                                        'from': 'cfg_payment_list',
                                        'localField': 'pym.chn',
                                        'foreignField': 'code',
                                        'as': 'bl',
                                        'pipeline': [
                                            {
                                                '$addFields': {
                                                    'methods': {
                                                        '$concat': ['$bank', " ", '$title']
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    '$lookup': {
                                        'from': 'users',
                                        'localField': '_u',
                                        'foreignField': '_id',
                                        'pipeline': [
                                            {
                                                '$project': {
                                                    'username': {
                                                        '$reduce': {
                                                            'input': '$dat.fln',
                                                            'initialValue': '',
                                                            'in': {
                                                                '$concat': [
                                                                    '$$value',
                                                                    { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                                                    '$$this'
                                                                ]
                                                            }
                                                        }
                                                    },
                                                }
                                            }
                                        ],
                                        'as': 'users',
                                    }
                                },
                                {
                                    '$addFields': {
                                        'total_money': { '$sum': { '$subtract': ['$mon.amm', { '$add': ['$mon.tsc', '$mon.fee', '$mon.tlo'] }] } },
                                        'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                        'payment_method': { '$ifNull': [{ '$first': '$bl.methods' }, '-'] },
                                        'username': { '$ifNull': [{ '$first': '$users.username' }, 'unknwon'] }

                                    }
                                },
                                {
                                    '$project': {
                                        'invoice': '$inv',
                                        'username': '$username',
                                        'date': '$date',
                                        'payment_method': '$payment_method',
                                        'total_sale': '$total_money',
                                        'status': 'product',
                                        'transaction_details': {
                                            'total_order': '$mon.amm',
                                            'admin_fee': '$mon.fee',
                                            'shipping_costs': { '$toInt': '0' },
                                            'discount_product': { '$toInt': '0' },
                                            'discount_voucher': { '$add': ['$mon.tsc', '$mon.tlo'] },
                                            'total_sale': '$total_money'
                                        },
                                        '_id': 0
                                    }
                                }
                            ],
                            'as': 'payment'
                        }
                    },
                    // {
                    //     '$lookup': {
                    //         'from': 'sys_doctors',
                    //         'pipeline': [
                    //             {
                    //                 '$match': {
                    //                     '$and': [
                    //                         { 'pym.sts': { '$nin': ['settlement'] } },
                    //                         { '_s': ObjectID(idDecrypt) }
                    //                     ]
                    //                 }
                    //             },
                    //             {
                    //                 '$lookup': {
                    //                     'from': 'cfg_payment_list',
                    //                     'localField': 'pym.chn',
                    //                     'foreignField': 'code',
                    //                     'as': 'bl',
                    //                     'pipeline': [
                    //                         {
                    //                             '$addFields': {
                    //                                 'methods': {
                    //                                     '$concat': ['$bank', " ", '$title']
                    //                                 }
                    //                             }
                    //                         }
                    //                     ]
                    //                 }
                    //             },
                    //             {
                    //                 '$lookup': {
                    //                     'from': 'users',
                    //                     'localField': '_u',
                    //                     'foreignField': '_id',
                    //                     'pipeline': [
                    //                         {
                    //                             '$project': {
                    //                                 'username': {
                    //                                     '$reduce': {
                    //                                         'input': '$dat.fln',
                    //                                         'initialValue': '',
                    //                                         'in': {
                    //                                             '$concat': [
                    //                                                 '$$value',
                    //                                                 { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                    //                                                 '$$this'
                    //                                             ]
                    //                                         }
                    //                                     }
                    //                                 },
                    //                             }
                    //                         }
                    //                     ],
                    //                     'as': 'users',
                    //                 }
                    //             },
                    //             {
                    //                 '$addFields': {
                    //                     'total_money': '$mon.amr',
                    //                     'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                    //                     'payment_method': { '$ifNull': [{ '$first': '$bl.methods' }, '-'] },
                    //                     'username': { '$ifNull': [{ '$first': '$users.username' }, 'unknwon'] }
                    //                 }
                    //             },
                    //             {
                    //                 '$project': {
                    //                     'invoice': '$inv',
                    //                     'username': '$username',
                    //                     'date': '$date',
                    //                     'payment_method': '$payment_method',
                    //                     'total_sale': '$total_money',
                    //                     'status': 'doctor',
                    //                     'transaction_details': {
                    //                         'total_order': '$mon.amm',
                    //                         'admin_fee': '$mon.fee',
                    //                         'shipping_costs': { '$toInt': '0' },
                    //                         'discount_product': { '$toInt': '0' },
                    //                         'discount_voucher': { '$toInt': '0' },
                    //                         'total_sale': '$total_money'
                    //                     },
                    //                     '_id': 0
                    //                 }
                    //             }
                    //         ],
                    //         'as': 'doctors'
                    //     }
                    // },
                    // {
                    //     '$lookup': {
                    //         'from': 'sys_vouchers',
                    //         'pipeline': [
                    //             {
                    //                 '$match': {
                    //                     '$and': [
                    //                         { 'pym.sts': { '$nin': ['settlement'] } },
                    //                         { '_s': ObjectID(idDecrypt) }
                    //                     ]
                    //                 }
                    //             },
                    //             {
                    //                 '$lookup': {
                    //                     'from': 'cfg_payment_list',
                    //                     'localField': 'pym.chn',
                    //                     'foreignField': 'code',
                    //                     'as': 'bl',
                    //                     'pipeline': [
                    //                         {
                    //                             '$addFields': {
                    //                                 'methods': {
                    //                                     '$concat': ['$bank', " ", '$title']
                    //                                 }
                    //                             }
                    //                         }
                    //                     ]
                    //                 }
                    //             },
                    //             {
                    //                 '$lookup': {
                    //                     'from': 'users',
                    //                     'localField': '_u',
                    //                     'foreignField': '_id',
                    //                     'pipeline': [
                    //                         {
                    //                             '$project': {
                    //                                 'username': {
                    //                                     '$reduce': {
                    //                                         'input': '$dat.fln',
                    //                                         'initialValue': '',
                    //                                         'in': {
                    //                                             '$concat': [
                    //                                                 '$$value',
                    //                                                 { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                    //                                                 '$$this'
                    //                                             ]
                    //                                         }
                    //                                     }
                    //                                 },
                    //                             }
                    //                         }
                    //                     ],
                    //                     'as': 'users',
                    //                 }
                    //             },
                    //             {
                    //                 '$addFields': {
                    //                     'total_money': { '$subtract': ['$prc', '$mon.fee'] },
                    //                     'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                    //                     'payment_method': { '$ifNull': [{ '$first': '$bl.methods' }, '-'] },
                    //                     'username': { '$ifNull': [{ '$first': '$users.username' }, 'unknwon'] }
                    //                 }
                    //             },
                    //             {
                    //                 '$project': {
                    //                     'invoice': '$inv',
                    //                     'username': '$username',
                    //                     'date': '$date',
                    //                     'payment_method': '$payment_method',
                    //                     'total_sale': '$total_money',
                    //                     'status': 'voucher',
                    //                     'transaction_details': {
                    //                         'total_order': '$prc',
                    //                         'admin_fee': '$mon.fee',
                    //                         'shipping_costs': { '$toInt': '0' },
                    //                         'discount_product': { '$toInt': '0' },
                    //                         'discount_voucher': { '$toInt': '0' },
                    //                         'total_sale': '$total_money'
                    //                     },
                    //                     '_id': 0
                    //                 }
                    //             }
                    //         ],
                    //         'as': 'vouchers'
                    //     }
                    // },
                    {
                        '$project': {
                            // 'result': { '$concatArrays': ['$vouchers', '$doctors', '$payment'] },
                            'result': { '$concatArrays': ['$payment'] },

                            '_id': 0
                        }
                    },
                    {
                        '$unwind': { 'path': '$result' }
                    },
                    {
                        '$match': filterStatus
                    },
                    {
                        '$sort': { '_id': -1 }
                    }
                ],
                [
                    {
                        '$project': {
                            'invoice': '$result.invoice',
                            'username': '$result.username',
                            'date': '$result.date',
                            'total_sale': '$result.total_sale',
                            'payment_method': '$result.payment_method',
                            'status': '$result.status',
                            'transaction_details': {
                                'total_order': '$result.transaction_details.total_order',
                                'admin_fee': '$result.transaction_details.admin_fee',
                                'shipping_costs': '$result.transaction_details.shipping_costs',
                                'discount_product': '$result.transaction_details.discount_product',
                                'discount_voucher': '$result.transaction_details.discount_voucher',
                                'total_sale': '$result.transaction_details.total_sale',
                            },
                            '_id': 0
                        }
                    }
                ], page, 3, item_limit
            ))


            res.status(200).json(jsonData(money_hold[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async moneyReady(req, res, next) {
        try {
            const { store_id } = req.params
            const { page, item_limit, status } = req.query
            const idDecrypt = decryptId(store_id, 12)

            let filterStatus = 0

            if (status) {
                filterStatus = {
                    'result.status': {
                        '$regex': status,
                        '$options': 'i'
                    }
                }
            } else {
                filterStatus = {}
            }

            const moneyReady = await Config.aggregate(queryPagination(
                [
                    {
                        '$limit': 1
                    },
                    {
                        '$lookup': {
                            'from': 'sys_payment',
                            'pipeline': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'pym.sts': 'settlement' },
                                            { 'shp.sts': 'settlement' },
                                            { '_s': ObjectID(idDecrypt) }
                                        ]
                                    }
                                },
                                {
                                    '$lookup': {
                                        'from': 'cfg_payment_list',
                                        'localField': 'pym.chn',
                                        'foreignField': 'code',
                                        'as': 'bl',
                                        'pipeline': [
                                            {
                                                '$addFields': {
                                                    'methods': {
                                                        '$concat': ['$bank', " ", '$title']
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    '$lookup': {
                                        'from': 'users',
                                        'localField': '_u',
                                        'foreignField': '_id',
                                        'pipeline': [
                                            {
                                                '$project': {
                                                    'username': {
                                                        '$reduce': {
                                                            'input': '$dat.fln',
                                                            'initialValue': '',
                                                            'in': {
                                                                '$concat': [
                                                                    '$$value',
                                                                    { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                                                    '$$this'
                                                                ]
                                                            }
                                                        }
                                                    },
                                                }
                                            }
                                        ],
                                        'as': 'users',
                                    }
                                },
                                {
                                    '$addFields': {
                                        'total_money': { '$sum': { '$subtract': ['$mon.amm', { '$add': ['$mon.tsc', '$mon.fee', '$mon.tlo'] }] } },
                                        'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                        'payment_method': { '$ifNull': [{ '$first': '$bl.methods' }, '-'] },
                                        'username': { '$ifNull': [{ '$first': '$users.username' }, 'unknwon'] }

                                    }
                                },
                                {
                                    '$project': {
                                        'invoice': '$inv',
                                        'username': '$username',
                                        'date': '$date',
                                        'payment_method': '$payment_method',
                                        'total_sale': '$total_money',
                                        'status': 'product',
                                        'transaction_details': {
                                            'total_order': '$mon.amm',
                                            'admin_fee': '$mon.fee',
                                            'shipping_costs': { '$toInt': '0' },
                                            'discount_product': { '$toInt': '0' },
                                            'discount_voucher': { '$add': ['$mon.tsc', '$mon.tlo'] },
                                            'total_sale': '$total_money'
                                        },
                                        '_id': 0
                                    }
                                }
                            ],
                            'as': 'payment'
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'sys_doctors',
                            'pipeline': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'pym.sts': 'settlement' },
                                            { '_s': ObjectID(idDecrypt) }
                                        ]
                                    }
                                },
                                {
                                    '$lookup': {
                                        'from': 'cfg_payment_list',
                                        'localField': 'pym.chn',
                                        'foreignField': 'code',
                                        'as': 'bl',
                                        'pipeline': [
                                            {
                                                '$addFields': {
                                                    'methods': {
                                                        '$concat': ['$bank', " ", '$title']
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    '$lookup': {
                                        'from': 'users',
                                        'localField': '_u',
                                        'foreignField': '_id',
                                        'pipeline': [
                                            {
                                                '$project': {
                                                    'username': {
                                                        '$reduce': {
                                                            'input': '$dat.fln',
                                                            'initialValue': '',
                                                            'in': {
                                                                '$concat': [
                                                                    '$$value',
                                                                    { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                                                    '$$this'
                                                                ]
                                                            }
                                                        }
                                                    },
                                                }
                                            }
                                        ],
                                        'as': 'users',
                                    }
                                },
                                {
                                    '$addFields': {
                                        'total_money': '$mon.amr',
                                        'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                        'payment_method': { '$ifNull': [{ '$first': '$bl.methods' }, '-'] },
                                        'username': { '$ifNull': [{ '$first': '$users.username' }, 'unknwon'] }
                                    }
                                },
                                {
                                    '$project': {
                                        'invoice': '$inv',
                                        'username': '$username',
                                        'date': '$date',
                                        'payment_method': '$payment_method',
                                        'total_sale': '$total_money',
                                        'status': 'doctor',
                                        'transaction_details': {
                                            'total_order': '$mon.amm',
                                            'admin_fee': '$mon.fee',
                                            'shipping_costs': { '$toInt': '0' },
                                            'discount_product': { '$toInt': '0' },
                                            'discount_voucher': { '$toInt': '0' },
                                            'total_sale': '$total_money'
                                        },
                                        '_id': 0
                                    }
                                }
                            ],
                            'as': 'doctors'
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'sys_vouchers',
                            'pipeline': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'pym.sts': 'settlement' },
                                            { '_s': ObjectID(idDecrypt) }
                                        ]
                                    }
                                },
                                {
                                    '$lookup': {
                                        'from': 'cfg_payment_list',
                                        'localField': 'pym.chn',
                                        'foreignField': 'code',
                                        'as': 'bl',
                                        'pipeline': [
                                            {
                                                '$addFields': {
                                                    'methods': {
                                                        '$concat': ['$bank', " ", '$title']
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    '$lookup': {
                                        'from': 'users',
                                        'localField': '_u',
                                        'foreignField': '_id',
                                        'pipeline': [
                                            {
                                                '$project': {
                                                    'username': {
                                                        '$reduce': {
                                                            'input': '$dat.fln',
                                                            'initialValue': '',
                                                            'in': {
                                                                '$concat': [
                                                                    '$$value',
                                                                    { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                                                    '$$this'
                                                                ]
                                                            }
                                                        }
                                                    },
                                                }
                                            }
                                        ],
                                        'as': 'users',
                                    }
                                },
                                {
                                    '$addFields': {
                                        'total_money': { '$subtract': ['$prc', '$mon.fee'] },
                                        'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                        'payment_method': { '$ifNull': [{ '$first': '$bl.methods' }, '-'] },
                                        'username': { '$ifNull': [{ '$first': '$users.username' }, 'unknwon'] }
                                    }
                                },
                                {
                                    '$project': {
                                        'invoice': '$inv',
                                        'username': '$username',
                                        'date': '$date',
                                        'payment_method': '$payment_method',
                                        'total_sale': '$total_money',
                                        'status': 'voucher',
                                        'transaction_details': {
                                            'total_order': '$prc',
                                            'admin_fee': '$mon.fee',
                                            'shipping_costs': { '$toInt': '0' },
                                            'discount_product': { '$toInt': '0' },
                                            'discount_voucher': { '$toInt': '0' },
                                            'total_sale': '$total_money'
                                        },
                                        '_id': 0
                                    }
                                }
                            ],
                            'as': 'vouchers'
                        }
                    },
                    {
                        '$project': {
                            'result': { '$concatArrays': ['$vouchers', '$doctors', '$payment'] },
                        }
                    },
                    {
                        '$unwind': { 'path': '$result' }
                    },
                    {
                        '$match': filterStatus
                    },
                    {
                        '$sort': { '_id': -1 }
                    }
                ],
                [
                    {
                        '$project': {
                            'invoice': '$result.invoice',
                            'username': '$result.username',
                            'date': '$result.date',
                            'total_sale': '$result.total_sale',
                            'payment_method': '$result.payment_method',
                            'status': '$result.status',
                            'transaction_details': {
                                'total_order': '$result.transaction_details.total_order',
                                'admin_fee': '$result.transaction_details.admin_fee',
                                'shipping_costs': '$result.transaction_details.shipping_costs',
                                'discount_product': '$result.transaction_details.discount_product',
                                'discount_voucher': '$result.transaction_details.discount_voucher',
                                'total_sale': '$result.transaction_details.total_sale',
                            },
                            '_id': 0
                        }
                    }
                ], page, 3, item_limit
            ))
            res.status(200).json(jsonData(moneyReady[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async myInvoice(req, res, next) {
        try {

            const { store_id } = req.params

            const idDecrypt = decryptId(store_id, 12)

            const myInvoice = await Sys_payment.aggregate([
                {
                    '$match': {
                        '_s': ObjectID(idDecrypt)
                    }
                },
                { '$sort': { '_id': -1 } },
                {
                    '$addFields': {
                        'date': {
                            '$dateToString': {
                                'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                'format': '%Y-%m',
                                'onNull': '2020-01-01'
                            }
                        }
                    }
                },
                {
                    '$group': {
                        '_id': '$date'
                    }
                },
                { '$sort': { '_id': 1 } },
                { '$limit': 5 },
                {
                    '$project': {
                        'date': '$_id',
                        '_id': 0
                    }
                }
            ])

            if (myInvoice.length === 0) { res.status(200).json(jsonData({ result: [] })) }


            const result = {
                invoice: myInvoice,
                sales_trx: myInvoice
            }
            res.status(200).json(jsonData(result))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async historyTrx(req, res, next) {
        try {
            const { store_id } = req.params2
            const historyTrx = await Sys_payment.aggregate(
                [
                    {
                        '$match': {
                            '_s': store_id
                        }
                    },
                    { '$sort': { '_id': -1 } },
                    {
                        '$addFields': {
                            'date': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                    'format': '%Y-%m',
                                    'onNull': '2020-01-01'
                                }
                            }
                        }
                    },
                    {
                        '$group': {
                            '_id': '$date'
                        }
                    },
                    { '$sort': { '_id': 1 } },
                    { '$limit': 5 },
                    {
                        '$project': {
                            'date': '$_id',
                            '_id': 0
                        }
                    }
                ]
            )

            if (historyTrx.length === 0) { throw { message: 'Data not found' } }

            res.status(200).json(jsonData(historyTrx))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async detailInvoice(req, res, next) {
        try {
            const { store_id } = req.params

            let { time_start, time_end } = req.query

            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }

            time_start = date2number(time_start)
            time_end = date2number(time_end)

            const detailInvoice = await Sys_payment.aggregate(queryPagination(
                [
                    {
                        '$match': {
                            '$and': [
                                { '_s': ObjectID(store_id) },
                                { 'ep': { '$lte': time_start } },
                                { 'ep': { '$gte': time_end } }
                            ]
                        }
                    },
                    { '$sort': { '_id': -1 } },
                    {
                        '$addFields': {
                            'date': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                    'format': '%Y-%m',
                                    'onNull': '2020-01-01'
                                }
                            }
                        }
                    },
                ],
                [
                    {
                        '$group': {
                            '_id': '$date'
                        }
                    },
                    { '$sort': { '_id': 1 } },
                    {
                        '$project': {
                            'date': '$_id',
                            '_id': 0
                        }
                    }
                ], 1, 3, 10
            ))

            // res.send(detailInvoice)
            if (detailInvoice[0].items.length === 0) { throw { message: 'Data not found' } }

            res.status(200).json(jsonData(detailInvoice[0]))

        } catch (error) {
            console.log(error);
            next(error)
        }

    }

    static async totalSaldo(req, res, next) {
        try {
            const { store_id } = req.params

            const idDecrypt = decryptId(store_id, 12)

            const totalSaldo = await Config.aggregate(
                [
                    {
                        '$limit': 1
                    },
                    {
                        '$lookup': {
                            'from': 'sys_payment',
                            'pipeline': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'pym.sts': 'settlement' },
                                            { 'shp.sts': 'settlement' },
                                            { '_s': ObjectID(idDecrypt) }
                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'total_money': { '$subtract': ['$mon.amm', { '$add': ['$mon.tsc', '$mon.fee', '$mon.tlo'] }] }
                                    }
                                },
                                {
                                    '$project': {
                                        'total_money': '$total_money',
                                        '_id': 0
                                    }
                                }
                            ],
                            'as': 'payment'
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'sys_vouchers',
                            'pipeline': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'pym.sts': 'settlement' },
                                            { '_s': ObjectID(idDecrypt) }
                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'total_money': { '$subtract': ['$prc', '$mon.fee'] }

                                    }
                                },
                                {
                                    '$project': {
                                        'total_money': '$total_money',
                                        '_id': 0
                                    }
                                }
                            ],
                            'as': 'vouchers'
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'sys_doctors',
                            'pipeline': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'pym.sts': 'settlement' },
                                            { '_s': ObjectID(idDecrypt) }
                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'total_money': '$mon.amr'

                                    }
                                },
                                {
                                    '$project': {
                                        'total_money': '$total_money',
                                        '_id': 0
                                    }
                                }
                            ],
                            'as': 'doctors'
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'rcd_stores_penalty',
                            'pipeline': [
                                {
                                    '$match': {
                                        '$and': [
                                            { '_s': ObjectID(idDecrypt) }
                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'total_money': '$amm'

                                    }
                                },
                                {
                                    '$project': {
                                        'total_money': '$total_money',
                                        '_id': 0
                                    }
                                }
                            ],
                            'as': 'penalty'
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'rcd_stores_wd',
                            'pipeline': [
                                {
                                    '$match': {
                                        '$and': [
                                            { '_s': ObjectID(idDecrypt) }
                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'total_money': { '$subtract': ['$amm', '$fee'] }

                                    }
                                },
                                {
                                    '$project': {
                                        'total_money': '$total_money',
                                        '_id': 0
                                    }
                                }
                            ],
                            'as': 'withdrawal'
                        }
                    },
                    {
                        '$addFields': {
                            'product': { '$sum': '$payment.total_money' },
                            'vouchers': { '$sum': '$vouchers.total_money' },
                            'doctors': { '$sum': '$doctors.total_money' },
                            'penalty': { '$sum': '$penalty.total_money' },
                            'withdrawal': { '$sum': '$withdrawal.total_money' },
                        }
                    },
                    {
                        '$project': {
                            'total_balance': { '$subtract': [{ '$add': ['$product', '$vouchers', '$doctors'] }, { '$add': ['$penalty', '$withdrawal'] }] },
                            '_id': 0
                        }
                    }


                ]
            )

            const mainBank = await Store_bank.aggregate(
                [
                    {
                        '$match': {
                            '_s': ObjectID(idDecrypt)
                        }
                    },
                    {
                        '$match': {
                            'man': true
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'cfg_bank_list',
                            'localField': '_bi',
                            'foreignField': '_id',
                            'pipeline': [
                                {
                                    '$project': {
                                        'bank_name': { '$toString': '$code' },
                                        '_id': 0
                                    }
                                }
                            ],
                            'as': 'bank',
                        }
                    },
                    {
                        '$addFields': {
                            'alias': { '$ifNull': [{ '$first': '$bank.bank_name' }, '-'] },
                            'bank_user': '$pnm',
                            'bank_main': '$man',
                            'bank_code': '$bc',
                            'bank_value': '$val',
                            'channel': '$nme'
                        }
                    },
                    {
                        '$project': {
                            'bank_id': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            },
                            'bank_image': { '$concat': [`${rt_link}secure/c/bank-logo/`, '$alias'] },
                            'username': '$bank_user',
                            'bank_name': '$channel',
                            'bank_code': '$bank_code',
                            'bank_number': '$bank_value',
                            'alias': '$alias',
                            '_id': 0
                        }
                    }
                ]
            )


            if (totalSaldo.lenght === 0) { res.status(200).json(jsonData({ result: {} })) }
            if (mainBank.lenght === 0) { res.status(200).json(jsonData({ result: {} })) }


            const result = {
                account: totalSaldo[0],
                mybank: mainBank[0]
            }


            res.status(200).json(jsonData(result))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async storeBankList(req, res, next) {
        try {
            const { store_id } = req.params

            const idDecrypt = decryptId(store_id, 12)

            const myBankBalance = await Store_bank.aggregate(
                [
                    {
                        '$match': {
                            '_s': ObjectID(idDecrypt)
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'cfg_bank_list',
                            'localField': '_bi',
                            'foreignField': '_id',
                            'pipeline': [
                                {
                                    '$project': {
                                        'bank_name': { '$toString': '$code' },
                                        '_id': 0
                                    }
                                }
                            ],
                            'as': 'bank',
                        }
                    },
                    {
                        '$addFields': {
                            'alias': { '$ifNull': [{ '$first': '$bank.bank_name' }, '-'] },
                            'bank_user': '$pnm',
                            'bank_main': '$man',
                            'bank_code': '$bc',
                            'bank_value': '$val',
                            'channel': '$nme'
                        }
                    },
                    {
                        '$project': {
                            'bank_id': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            },
                            'bank_image': { '$concat': [`${rt_link}secure/c/bank-logo/`, '$alias'] },
                            'username': '$bank_user',
                            'bank_name': '$channel',
                            'bank_code': '$bank_code',
                            'bank_number': '$bank_value',
                            'alias': '$alias',
                            '_id': 0,
                            'status': {
                                '$cond': {
                                    'if': { '$eq': ['$man', true] },
                                    'then': 'Utama',
                                    'else': 'Bukan Utama'
                                }
                            }
                        }
                    }
                ]
            )
            if (myBankBalance.length === 0) {
                res.status(200).json(jsonData({ result: {} }))
            }
            res.status(200).json(jsonData(myBankBalance))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async withdrawalDetail(req, res, next) {
        try {
            const { store_id, payment_id } = req.params

            const storeDecrypt = decryptId(store_id, 12)
            const paymentDecrypt = decryptId(payment_id, 12)

            const withdrawalDetail = await RecordWithdraw.aggregate(
                [
                    {
                        '$match': {
                            '$and': [
                                { '_s': ObjectID(storeDecrypt) },
                                { '_id': ObjectID(paymentDecrypt) },
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'stores_bank',
                            'localField': '_s',
                            'foreignField': '_s',
                            'as': 'storeBank',
                            'pipeline': [
                                {
                                    '$project': {
                                        'bank': { '$concat': ['$nme', '-', '$val'] }
                                    }
                                }

                            ]
                        }
                    },
                    {
                        '$project': {
                            'time_created': { '$toDate': { '$multiply': ['$ep', 1000] } },
                            'withdrawal_id': payment_id,
                            'bank_name': { '$ifNull': [{ '$first': '$storeBank.bank' }, '-'] },
                            'total_wd': '$amm',
                            'fee': '$fee',
                            'seller_account': { '$subtract': ['$amm', '$fee'] },
                            '_id': 0
                        }
                    }
                ]
            )

            res.status(200).json(jsonData(withdrawalDetail[0]))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async trxWithdrawal(req, res, next) {
        try {
            const { store_id } = req.params

            const idDecrypt = decryptId(store_id, 12)


            let { time_start, time_end, page, item_limit } = req.query

            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }

            time_start = date2number(time_start)
            time_end = date2number(time_end)


            const withdrawal = await RecordWithdraw.aggregate(queryPagination(
                [
                    {
                        '$match': {
                            '$and': [
                                { '_s': ObjectID(idDecrypt) },
                                { 'ep': { '$lte': time_start } },
                                { 'ep': { '$gte': time_end } },
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'cfg_bank_list',
                            'localField': '_bi',
                            'foreignField': '_id',
                            'as': 'banklist',
                            'pipeline': [

                                {
                                    '$project': {
                                        'name': '$alias'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'total_money': { '$subtract': ['$amm', '$fee'] },
                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                            'bank_name': { '$ifNull': [{ '$first': '$banklist.name' }, '-'] },
                            'id_encrypt': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            },
                        }
                    },
                    { '$sort': { 'date': -1 } }
                ],
                [
                    {
                        '$project': {
                            'date': '$date',
                            'no_rek': '$num',
                            'total': '$total_money',
                            'status': '$sts',
                            'bank_name': '$bank_name',
                            'type': 'withdrawal',
                            'payment_id': '$id_encrypt',
                            '_id': 0
                        }
                    }
                ], page, 3, item_limit
            ))

            res.status(200).json(jsonData(withdrawal[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async refundOrder(req, res, next) {
        try {
            const { store_id } = req.params

            const idDecrypt = decryptId(store_id, 12)

            let { time_start, time_end, page, item_limit } = req.query

            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }

            time_start = date2number(time_start)
            time_end = date2number(time_end)

            const refundOrder = await RecordPenalty.aggregate(queryPagination(
                [
                    {
                        '$match': {
                            '$and': [
                                { '_s': ObjectID(idDecrypt) },
                                { 'ep': { '$lte': time_start } },
                                { 'ep': { '$gte': time_end } },
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'sys_payment',
                            'localField': '_py',
                            'foreignField': '_id',
                            'as': 'paymentsys',
                            'pipeline': [
                                {
                                    '$lookup': {
                                        'from': 'users',
                                        'localField': '_u',
                                        'foreignField': '_id',
                                        'as': 'us',
                                        'pipeline': [
                                            {
                                                '$project': {
                                                    'buyer': {
                                                        '$reduce': {
                                                            'input': '$dat.fln',
                                                            'initialValue': '',
                                                            'in': {
                                                                '$concat': [
                                                                    '$$value',
                                                                    { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                                                    '$$this'
                                                                ]
                                                            }
                                                        }
                                                    },
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    '$project': {
                                        'item': { '$concat': [{ '$first': '$dat.pn' }, ', . . .'] },
                                        'buyer': { '$ifNull': [{ '$first': '$us.buyer' }, '-'] },
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'total_money': '$amm',
                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                            'id_encrypt': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            },
                            'buyer': { '$ifNull': [{ '$first': '$paymentsys.buyer' }, '-'] },
                            'item': { '$ifNull': [{ '$first': '$paymentsys.item' }, '-'] },
                        }
                    },
                    { '$sort': { 'payment_id': -1 } }
                ],
                [
                    {
                        '$project': {
                            'payment_id': '$id_encrypt',
                            'date': '$date',
                            'invoice': '-',
                            'total': '$total_money',
                            'status': 'done',
                            'type': 'penalty',
                            'item': '$item',
                            'buyer': '$buyer',
                            '_id': 0
                        }
                    }
                ], page, 3, item_limit
            ))
            res.status(200).json(jsonData(refundOrder[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async lastTrxDoctor(req, res, next) {
        try {
            const { store_id } = req.params

            const idDecrypt = decryptId(store_id, 12)


            let { time_start, time_end, page, item_limit } = req.query

            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }

            time_start = date2number(time_start)
            time_end = date2number(time_end)

            const lastTrxDoctor = await Sys_doctor.aggregate(queryPagination(
                [
                    {
                        '$addFields': {
                            'date_id': { '$toDecimal': { '$toDate': '$_id' } }
                        }
                    },
                    {
                        '$addFields': {
                            'date_id': { '$round': [{ '$divide': ['$date_id', 1000] }, 4] },
                        }
                    },
                    {
                        '$match': {
                            '$and': [
                                { 'pym.sts': 'settlement' },
                                { '_s': ObjectID(idDecrypt) },
                                { 'date_id': { '$lte': time_start } },
                                { 'date_id': { '$gte': time_end } },
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'users',
                            'localField': '_u',
                            'foreignField': '_id',
                            'pipeline': [
                                {
                                    '$project': {
                                        'username': {
                                            '$reduce': {
                                                'input': '$dat.fln',
                                                'initialValue': '',
                                                'in': {
                                                    '$concat': [
                                                        '$$value',
                                                        { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                                        '$$this'
                                                    ]
                                                }
                                            }
                                        },
                                    }
                                }
                            ],
                            'as': 'users',
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'doctors',
                            'localField': '_d',
                            'foreignField': '_id',
                            'pipeline': [
                                {
                                    '$project': {
                                        'full_name': {
                                            '$reduce': {
                                                'input': '$dat.fln',
                                                'initialValue': '',
                                                'in': {
                                                    '$concat': [
                                                        '$$value',
                                                        { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                                        '$$this']
                                                }
                                            }
                                        },
                                        '_id': 0
                                    }
                                },
                            ],
                            'as': 'doctors_profile'
                        }
                    },
                    {
                        '$addFields': {
                            'total_money': '$mon.amr',
                            'date': { '$toDate': { '$multiply': ['$date_id', 1000] } },
                            'username': { '$ifNull': [{ '$first': '$users.username' }, '-'] },
                            'doctor': { '$ifNull': [{ '$first': '$doctors_profile.full_name' }, '-'] },
                            'id_encrypt': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            }
                        }
                    },
                    {
                        '$sort': { 'date': -1 }
                    }

                ],
                [
                    {
                        '$project': {
                            'payment_id': '$id_encrypt',
                            'date': '$date',
                            'invoice': '$inv',
                            'username': '$username',
                            'doctor': '$doctor',
                            'item': 'consultation',
                            'total': '$total_money',
                            'type': 'doctors',
                            'status': 'done',
                            '_id': 0
                        }
                    }
                ], page, 3, item_limit
            ))

            res.status(200).json(jsonData(lastTrxDoctor[0]))


        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async lastTrxVoucher(req, res, next) {
        try {
            const { store_id } = req.params

            const idDecrypt = decryptId(store_id, 12)


            let { time_start, time_end, page, item_limit } = req.query

            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }

            time_start = date2number(time_start)
            time_end = date2number(time_end)


            const lastTrxVoucher = await Sys_voucher.aggregate(queryPagination(
                [
                    {
                        '$match': {
                            '$and': [
                                { 'pym.sts': 'settlement' },
                                { '_s': ObjectID(idDecrypt) },
                                { 'ep': { '$lte': time_start } },
                                { 'ep': { '$gte': time_end } },
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'users',
                            'localField': '_u',
                            'foreignField': '_id',
                            'pipeline': [
                                {
                                    '$project': {
                                        'username': {
                                            '$reduce': {
                                                'input': '$dat.fln',
                                                'initialValue': '',
                                                'in': {
                                                    '$concat': [
                                                        '$$value',
                                                        { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                                        '$$this'
                                                    ]
                                                }
                                            }
                                        },
                                    }
                                }
                            ],
                            'as': 'users',
                        }
                    },
                    {
                        '$addFields': {
                            'total_money': { '$subtract': ['$prc', '$mon.fee'] },
                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                            'username': { '$ifNull': [{ '$first': '$users.username' }, '-'] },
                            'id_encrypt': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            }
                        }
                    },
                    {
                        '$sort': { 'date': -1 }
                    }
                ],
                [
                    {
                        '$project': {
                            'payment_id': '$id_encrypt',
                            'date': '$date',
                            'invoice': '$inv',
                            'username': '$username',
                            'doctor': '-',
                            'item': '$vn',
                            'total': '$total_money',
                            'type': 'voucher',
                            'status': 'done',
                            '_id': 0
                        }
                    }
                ], page, 3, item_limit
            ))

            res.status(200).json(jsonData(lastTrxVoucher[0]))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async lastTrxPayment(req, res, next) {
        try {
            const { store_id } = req.params

            const idDecrypt = decryptId(store_id, 12)

            let { time_start, time_end, page, item_limit } = req.query

            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }

            time_start = date2number(time_start)
            time_end = date2number(time_end)

            const lastTrxPayment = await Sys_payment.aggregate(queryPagination(
                [
                    {
                        '$match': {
                            '$and': [
                                { 'pym.sts': 'settlement' },
                                { 'shp.sts': 'settlement' },
                                { '_s': ObjectID(idDecrypt) },
                                { 'ep': { '$lte': time_start } },
                                { 'ep': { '$gte': time_end } },
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'users',
                            'localField': '_u',
                            'foreignField': '_id',
                            'pipeline': [
                                {
                                    '$project': {
                                        'username': {
                                            '$reduce': {
                                                'input': '$dat.fln',
                                                'initialValue': '',
                                                'in': {
                                                    '$concat': [
                                                        '$$value',
                                                        { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                                        '$$this'
                                                    ]
                                                }
                                            }
                                        },
                                    }
                                }
                            ],
                            'as': 'users',
                        }
                    },
                    {
                        '$addFields': {
                            'total_money': { '$subtract': ['$mon.amm', { '$add': ['$mon.tsc', '$mon.fee', '$mon.tlo'] }] },
                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                            'username': { '$ifNull': [{ '$first': '$users.username' }, '-'] },
                            'id_encrypt': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            }

                        }
                    },
                    {
                        '$sort': { 'date': -1 }
                    }
                ],
                [
                    {
                        '$project': {
                            'payment_id': '$id_encrypt',
                            'date': '$date',
                            'invoice': '$inv',
                            'username': '$username',
                            'doctor': '-',
                            'item': { '$concat': [{ '$first': '$dat.pn' }, ', .....'] },
                            'total': '$total_money',
                            'type': 'product',
                            'status': 'done',
                            '_id': 0
                        }
                    }
                ], page, 3, item_limit
            ))

            res.status(200).json(jsonData(lastTrxPayment[0]))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async lastTrxAll(req, res, next) {
        try {
            const { store_id } = req.params

            const idDecrypt = decryptId(store_id, 12)

            let { time_start, time_end, page, item_limit } = req.query

            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }

            time_start = date2number(time_start)
            time_end = date2number(time_end)

            const lastTrxAll = await Config.aggregate(queryPagination(
                [
                    {
                        '$limit': 1
                    },
                    {
                        '$lookup': {
                            'from': 'sys_payment',
                            'pipeline': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'pym.sts': 'settlement' },
                                            { 'shp.sts': 'settlement' },
                                            { '_s': ObjectID(idDecrypt) },
                                            { 'ep': { '$lte': time_start } },
                                            { 'ep': { '$gte': time_end } },
                                        ]
                                    }
                                },
                                {
                                    '$lookup': {
                                        'from': 'users',
                                        'localField': '_u',
                                        'foreignField': '_id',
                                        'pipeline': [
                                            {
                                                '$project': {
                                                    'username': {
                                                        '$reduce': {
                                                            'input': '$dat.fln',
                                                            'initialValue': '',
                                                            'in': {
                                                                '$concat': [
                                                                    '$$value',
                                                                    { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                                                    '$$this'
                                                                ]
                                                            }
                                                        }
                                                    },
                                                }
                                            }
                                        ],
                                        'as': 'users',
                                    }
                                },
                                {
                                    '$addFields': {
                                        'total_money': { '$subtract': ['$mon.amm', { '$add': ['$mon.tsc', '$mon.fee', '$mon.tlo'] }] },
                                        'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                        'username': { '$ifNull': [{ '$first': '$users.username' }, '-'] },
                                        'id_encrypt': {
                                            '$function': {
                                                'body': encrypt,
                                                'args': [{ '$toString': '$_id' }, 12],
                                                'lang': 'js'
                                            }
                                        }

                                    }
                                },
                                {
                                    '$project': {
                                        'payment_id': '$id_encrypt',
                                        'date': '$date',
                                        'invoice': '$inv',
                                        'username': '$username',
                                        'doctor': '-',
                                        'item': { '$concat': [{ '$first': '$dat.pn' }, ', .....'] },
                                        'total': '$total_money',
                                        'type': 'product',
                                        'status': 'done',
                                        '_id': 0
                                    }
                                }
                            ],
                            'as': 'payment'
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'sys_vouchers',
                            'pipeline': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'pym.sts': 'settlement' },
                                            { '_s': ObjectID(idDecrypt) },
                                            { 'ep': { '$lte': time_start } },
                                            { 'ep': { '$gte': time_end } },
                                        ]
                                    }
                                },
                                {
                                    '$lookup': {
                                        'from': 'users',
                                        'localField': '_u',
                                        'foreignField': '_id',
                                        'pipeline': [
                                            {
                                                '$project': {
                                                    'username': {
                                                        '$reduce': {
                                                            'input': '$dat.fln',
                                                            'initialValue': '',
                                                            'in': {
                                                                '$concat': [
                                                                    '$$value',
                                                                    { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                                                    '$$this'
                                                                ]
                                                            }
                                                        }
                                                    },
                                                }
                                            }
                                        ],
                                        'as': 'users',
                                    }
                                },
                                {
                                    '$addFields': {
                                        'total_money': { '$subtract': ['$prc', '$mon.fee'] },
                                        'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                        'username': { '$ifNull': [{ '$first': '$users.username' }, '-'] },
                                        'id_encrypt': {
                                            '$function': {
                                                'body': encrypt,
                                                'args': [{ '$toString': '$_id' }, 12],
                                                'lang': 'js'
                                            }
                                        }
                                    }
                                },
                                {
                                    '$project': {
                                        'payment_id': '$id_encrypt',
                                        'date': '$date',
                                        'invoice': '$inv',
                                        'username': '$username',
                                        'doctor': '-',
                                        'item': '$vn',
                                        'total': '$total_money',
                                        'type': 'voucher',
                                        'status': 'done',
                                        '_id': 0
                                    }
                                }
                            ],
                            'as': 'vouchers'
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'sys_doctors',
                            'pipeline': [
                                {
                                    '$addFields': {
                                        'date_id': { '$toDecimal': { '$toDate': '$_id' } }
                                    }
                                },
                                {
                                    '$addFields': {
                                        'date_id': { '$round': [{ '$divide': ['$date_id', 1000] }, 4] },
                                    }
                                },
                                {
                                    '$match': {
                                        '$and': [
                                            { 'pym.sts': 'settlement' },
                                            { '_s': ObjectID(idDecrypt) },
                                            { 'date_id': { '$lte': time_start } },
                                            { 'date_id': { '$gte': time_end } },
                                        ]
                                    }
                                },
                                {
                                    '$lookup': {
                                        'from': 'users',
                                        'localField': '_u',
                                        'foreignField': '_id',
                                        'pipeline': [
                                            {
                                                '$project': {
                                                    'username': {
                                                        '$reduce': {
                                                            'input': '$dat.fln',
                                                            'initialValue': '',
                                                            'in': {
                                                                '$concat': [
                                                                    '$$value',
                                                                    { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                                                    '$$this'
                                                                ]
                                                            }
                                                        }
                                                    },
                                                }
                                            }
                                        ],
                                        'as': 'users',
                                    }
                                },
                                {
                                    '$lookup': {
                                        'from': 'doctors',
                                        'localField': '_d',
                                        'foreignField': '_id',
                                        'pipeline': [
                                            {
                                                '$project': {
                                                    'full_name': {
                                                        '$reduce': {
                                                            'input': '$dat.fln',
                                                            'initialValue': '',
                                                            'in': {
                                                                '$concat': [
                                                                    '$$value',
                                                                    { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                                                    '$$this']
                                                            }
                                                        }
                                                    },
                                                    '_id': 0
                                                }
                                            },
                                        ],
                                        'as': 'doctors_profile'
                                    }
                                },
                                {
                                    '$addFields': {
                                        'total_money': '$mon.amr',
                                        'date': { '$toDate': { '$multiply': ['$date_id', 1000] } },
                                        'username': { '$ifNull': [{ '$first': '$users.username' }, '-'] },
                                        'doctor': { '$ifNull': [{ '$first': '$doctors_profile.full_name' }, '-'] },
                                        'id_encrypt': {
                                            '$function': {
                                                'body': encrypt,
                                                'args': [{ '$toString': '$_id' }, 12],
                                                'lang': 'js'
                                            }
                                        }
                                    }
                                },
                                {
                                    '$project': {
                                        'payment_id': '$id_encrypt',
                                        'date': '$date',
                                        'invoice': '$inv',
                                        'username': '$username',
                                        'doctor': '$doctor',
                                        'item': 'consultation',
                                        'total': '$total_money',
                                        'type': 'doctors',
                                        'status': 'done',
                                        '_id': 0
                                    }
                                }
                            ],
                            'as': 'doctors'
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'rcd_stores_penalty',
                            'pipeline': [
                                {
                                    '$match': {
                                        '$and': [
                                            { '_s': ObjectID(idDecrypt) },
                                            { 'ep': { '$lte': time_start } },
                                            { 'ep': { '$gte': time_end } },
                                        ]
                                    }
                                },
                                {
                                    '$lookup': {
                                        'from': 'sys_payment',
                                        'as': 'pym',
                                        'localField': '_py',
                                        'foreignField': '_id',
                                        'pipeline': [
                                            {
                                                '$lookup': {
                                                    'from': 'users',
                                                    'localField': '_u',
                                                    'foreignField': '_id',
                                                    'pipeline': [
                                                        {
                                                            '$project': {
                                                                'username': {
                                                                    '$reduce': {
                                                                        'input': '$dat.fln',
                                                                        'initialValue': '',
                                                                        'in': {
                                                                            '$concat': [
                                                                                '$$value',
                                                                                { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                                                                '$$this'
                                                                            ]
                                                                        }
                                                                    }
                                                                },
                                                            }
                                                        }
                                                    ],
                                                    'as': 'users',
                                                }
                                            },
                                            {
                                                '$project': {
                                                    'name': { '$ifNull': [{ '$first': '$users.username' }, '-'] },
                                                    'item': { '$concat': [{ '$first': '$dat.pn' }, ',...'] }
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'total_money': '$amm',
                                        'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                        'username': { '$ifNull': [{ '$first': '$pym.name' }, '-'] },
                                        'id_encrypt': {
                                            '$function': {
                                                'body': encrypt,
                                                'args': [{ '$toString': '$_id' }, 12],
                                                'lang': 'js'
                                            }
                                        },
                                        'item_bought': { '$ifNull': [{ '$first': '$pym.item' }, '-'] },


                                    }
                                },
                                {
                                    '$project': {
                                        'payment_id': '$id_encrypt',
                                        'date': '$date',
                                        'invoice': '-',
                                        'username': '$username',
                                        'doctor': '-',
                                        'item': '$item_bought',
                                        'total': '$total_money',
                                        'type': 'penalty',
                                        'status': 'done',
                                        '_id': 0
                                    }
                                }
                            ],
                            'as': 'penalty'
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'rcd_stores_wd',
                            'pipeline': [
                                {
                                    '$match': {
                                        '$and': [
                                            { '_s': ObjectID(idDecrypt) },
                                            { 'ep': { '$lte': time_start } },
                                            { 'ep': { '$gte': time_end } },
                                        ]
                                    }
                                },
                                {
                                    '$lookup': {
                                        'from': 'cfg_bank_list',
                                        'localField': '_bi',
                                        'foreignField': '_id',
                                        'as': 'banklist',
                                        'pipeline': [

                                            {
                                                '$project': {
                                                    'name': '$alias'
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'total_money': { '$subtract': ['$amm', '$fee'] },
                                        'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                        'username': { '$ifNull': [{ '$first': '$banklist.name' }, '-'] },
                                        'id_encrypt': {
                                            '$function': {
                                                'body': encrypt,
                                                'args': [{ '$toString': '$_id' }, 12],
                                                'lang': 'js'
                                            }
                                        }

                                    }
                                },
                                {
                                    '$project': {
                                        'payment_id': '$id_encrypt',
                                        'date': '$date',
                                        'invoice': '-',
                                        'username': '$username',
                                        'doctor': '-',
                                        'item': '$num',
                                        'total': '$total_money',
                                        'type': 'withdrawal',
                                        'status': '$sts',
                                        '_id': 0
                                    }
                                }
                            ],
                            'as': 'withdrawal'
                        }
                    },
                    {
                        '$project': {
                            'result': { '$concatArrays': ['$payment', '$vouchers', '$doctors', '$penalty', '$withdrawal'] },
                            '_id': 0
                        }
                    },
                    {
                        '$unwind': { 'path': '$result' }
                    },
                    {
                        '$sort': { 'result.date': -1 }
                    },
                ],
                [
                    {
                        '$project': {
                            'payment_id': '$result.payment_id',
                            'date': '$result.date',
                            'invoice': '$result.invoice',
                            'username': '$result.username',
                            'doctor': '$result.doctor',
                            'item': '$result.item',
                            'total': '$result.total',
                            'type': '$result.type',
                            'status': '$result.status',
                            '_id': 0
                        }
                    }
                ], page, 3, item_limit
            ))

            res.status(200).json(jsonData(lastTrxAll[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async statusStoreCheck(req, res, next) {
        try {
            const { store_id } = req.params
            const storeId = decryptId(store_id, 12)

            const reviewSeller = await Store.aggregate(
                [
                    {
                        '$match': { '_id': ObjectID(storeId) }
                    },
                    {
                        '$project': {
                            'status': status_cek,
                            '_id': 0
                        }
                    }
                ]
            )

            res.status(200).json(jsonData(reviewSeller[0]))

        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async reviewSeller(req, res, next) {
        try {
            const { page, item_limit } = req.query

            const reviewSeller = await Store.aggregate(queryPagination(
                [
                    {
                        '$lookup': {
                            'from': 'users',
                            'localField': '_u',
                            'foreignField': '_id',
                            'as': 'user',
                            'pipeline': [
                                {
                                    '$project': {
                                        'status': '$dat.eml.act'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'sa_stores_reissue',
                            'localField': '_id',
                            'foreignField': '_s',
                            'as': 'store_issue',
                            'pipeline': [
                                {
                                    '$project': {
                                        'token': '$tkn'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'status_user': { '$first': '$user.status' },
                            'status_store': {
                                '$cond': {
                                    'if': { '$eq': [{ '$size': '$store_issue' }, 1] },
                                    'then': true,
                                    'else': false
                                }
                            }
                        }
                    },
                    {
                        '$match': {
                            '$expr': {
                                '$and': [
                                    { '$eq': ['$det.act', false] },
                                    { '$eq': [{ '$ifNull': ['$epj', null] }, null] },
                                    { '$eq': ['$status_user', true] },
                                    { '$eq': ['$status_store', false] },
                                ]
                            }
                        }
                    },
                    {
                        '$addFields': {
                            'date_regist': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'store_id': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            },
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'users',
                            'localField': '_u',
                            'foreignField': '_id',
                            'as': 'usr',
                            'pipeline': [
                                {
                                    '$sort': { '_id': -1 }
                                },
                                {
                                    '$project': {
                                        'owner': {
                                            '$reduce': {
                                                'input': '$dat.fln',
                                                'initialValue': '',
                                                'in': {
                                                    '$concat': [
                                                        '$$value',
                                                        { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                                        '$$this'
                                                    ]
                                                }
                                            }
                                        },
                                        'email': {
                                            '$function': {
                                                'body': decrypt,
                                                'args': [{ '$toString': '$dat.eml.val' }, 8],
                                                'lang': 'js'
                                            }
                                        },
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$sort': { '_id': -1 }
                    }
                ],
                [
                    {
                        '$project': {
                            'date_regist': '$date_regist',
                            'store_name': '$det.nms',
                            'store_image': { '$concat': [`${rt_link}store/i/`, { '$toString': '$store_id' }] },
                            'email': { '$first': '$usr.email' },
                            'owner': { '$ifNull': ['$ctc.pic', '-'] },
                            'employ': { '$ifNull': ['$ctc.jbt', '-'] },
                            'phone_number': '$ctc.phn',
                            '_id': '$store_id'
                        }
                    }
                ], page, 3, item_limit
            ))


            res.status(200).json(jsonData(reviewSeller[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async detailSellerReview(req, res, next) {
        try {
            const { id } = req.params

            const idDecrypt = decryptId(id, 12)

            const detailSellerReview = await Store.aggregate(
                [
                    {
                        '$match': { '_id': ObjectID(idDecrypt) }
                    },
                    {
                        '$addFields': {
                            'time': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                    'format': '%Y/%m/%d/',
                                    'onNull': '2020-01-01'
                                }
                            },
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'stores_bank',
                            'as': 'bank',
                            'localField': '_id',
                            'foreignField': '_s',
                            'pipeline': [
                                {
                                    '$project': {
                                        '_id': 0,
                                        'name': '$nme',
                                        'account_number': '$val'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'stores_address',
                            'as': 'address',
                            'localField': '_id',
                            'foreignField': '_s',
                            'pipeline': [
                                {
                                    '$project': {
                                        '_id': 0,
                                        'label': '$nme',
                                        'reciever': '$rcv',
                                        'phone': '$phn',
                                        'province': '$shp.pn',
                                        'city': '$shp.cn',
                                        'district': '$shp.sn',
                                        'area': '$shp.an',
                                        'zip': '$shp.zip',
                                        'detail': '$shp.cc'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'users',
                            'as': 'us',
                            'localField': '_u',
                            'foreignField': '_id',
                            'pipeline': [
                                {
                                    '$project': {
                                        'fullname': {
                                            '$reduce': {
                                                'input': '$dat.fln',
                                                'initialValue': '',
                                                'in': {
                                                    '$concat': [
                                                        '$$value',
                                                        { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                                        '$$this'
                                                    ]
                                                }
                                            }
                                        },
                                        'gender': {
                                            '$cond': {
                                                'if': { '$eq': ['$dat.sex', 'M'] },
                                                'then': 'Laki-laki',
                                                'else': {
                                                    '$cond': {
                                                        'if': { '$eq': ['$dat.sex', 'F'] },
                                                        'then': 'Perempuan',
                                                        'else': '-'
                                                    }
                                                }
                                            }
                                        },
                                        'username': '$dat.usr',
                                        'email': {
                                            '$function': {
                                                'body': decrypt,
                                                'args': [{ '$toString': '$dat.eml.val' }, 8],
                                                'lang': 'js'
                                            }
                                        },
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$unwind': { 'path': '$us' }
                    },
                    {
                        '$unwind': { 'path': '$address' }
                    },
                    {
                        '$project': {
                            '_id': 0,
                            'fullname': '$us.fullname',
                            'owner': { '$ifNull': ['$ctc.pic', '-'] },
                            'username': '$us.username',
                            'phone_number': '$ctc.phn',
                            'email': '$us.email',
                            'gender': '$us.gender',
                            'store_name': {
                                '$reduce': {
                                    'input': '$det.nme',
                                    'initialValue': '',
                                    'in': {
                                        '$concat': [
                                            '$$value',
                                            { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                            '$$this'
                                        ]
                                    }
                                }
                            },
                            'url_store': '$slg',
                            'bank': '$bank',
                            'store_logo': { '$concat': [`${rt_link}store/i/`, id] },
                            'address': '$address',
                            'legal': {
                                'siu': { '$ifNull': ['$lgl.siu', '-'] },
                                'npwp': { '$ifNull': ['$lgl.npw', '-'] },
                                'account_book': { '$ifNull': ['$lgl.cbt', '-'] }
                            },
                        }
                    }
                ]
            )

            res.status(200).json(jsonData(detailSellerReview[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async rejectSeller(req, res, next) {
        try {
            const { id } = req.params
            const { reason } = req.body
            const idDecrypt = decryptId(id, 12)

            const getDataUser = await Store.aggregate(
                [
                    {
                        '$match': { '_id': ObjectID(idDecrypt) }
                    },
                    {
                        '$project': {
                            'store_name': '$det.nms',
                            'email': {
                                '$function': {
                                    'body': decrypt,
                                    'args': [{ '$toString': '$ctc.eml' }, 8],
                                    'lang': 'js'
                                }
                            },
                            'owner': { '$ifNull': ['$ctc.pic', '-'] },
                            'role': { '$ifNull': ['$ctc.jbt', '-'] },
                            'phone_number': { '$ifNull': ['$ctc.phn', '-'] },
                            'npwp': { '$ifNull': ['$lgl.npw', '-'] },
                            '_id': 0,
                            'status': 'Ditolak'
                        }
                    }
                ]
            )

            let [badge_data] = await Config.aggregate(
                [
                    {
                        '$match': {
                            '$and': [
                                { 'type': 'logo' },
                            ]
                        }
                    },
                    {
                        '$unwind': { 'path': '$data' }
                    },
                    {
                        '$project': {
                            'skinmystery_badge': '$data.skinmystery',
                            'app_store_badge': '$data.app-store',
                            'twitter_badge': '$data.twitter',
                            'facebook_badge': '$data.facebook',
                            'instagram_badge': '$data.instagram',
                            'google_play_badge': '$data.google-play-badge',
                            '_id': 0
                        }
                    }
                ]
            )


            let [company_info] = await Config.aggregate(
                [
                    {
                        '$match': {
                            '$and': [
                                { 'type': 'company' },
                                { 'subtype': 'information' },
                            ]
                        }
                    },
                    {
                        '$unwind': { 'path': '$data' }
                    },
                    {
                        '$project': {
                            'name': '$data.name',
                            '_id': 0
                        }
                    }
                ]
            )



            if (getDataUser.length === 0) { throw { message: 'Data not found' } }

            let dataUser = getDataUser[0]

            dataUser.twitter_link = twitter_link
            dataUser.facebook_link = facebook_link
            dataUser.instagram_link = instagram_link
            dataUser.google_play_link = google_play_link
            dataUser.app_store_link = app_store_link
            dataUser.unsub_link = unsub_link
            dataUser.address = address
            dataUser.logo_sm = badge_data.skinmystery_badge
            dataUser.domain = domain
            dataUser.copyright = (new Date().getFullYear()).toString()
            dataUser.email_sm = email_sm
            dataUser.company_name = company_info.name
            dataUser.app_store_badge = badge_data.app_store_badge
            dataUser.twitter_badge = badge_data.twitter_badge
            dataUser.facebook_badge = badge_data.facebook_badge
            dataUser.instagram_badge = badge_data.instagram_badge
            dataUser.google_play_badge = badge_data.google_play_badge
            dataUser.reason = ''

            // res.send(dataUser)


            for (let i = 0; i < reason.length; i++) {
                dataUser.reason += `<li style="font-size: 20px"> ${reason[i]} </li>`
            }

            let result_email = template_reject_seller(dataUser)

            if (result_email === true) {
                const deleteStore = Store.findByIdAndUpdate(
                    { '_id': ObjectID(idDecrypt) },
                    [{
                        '$set': {
                            'epj': date2number(''),
                            'slg': {
                                '$concat': [
                                    'deleted#',
                                    '$slg',
                                    '!',
                                    { '$toString': '$_id' }
                                ]
                            },
                            'det.nms': {
                                '$concat': [
                                    'deleted#',
                                    '$det.nms',
                                    '!',
                                    { '$toString': { '$toDate': '$_id' } }
                                ]
                            },
                            'det.act': false,
                            'det.rjt': true
                        },
                    }],
                    (err) => {
                        if (err) {
                            console.log(err)
                            next(err)
                        } else {
                            const { email, username } = req.user
                            const activity = `Reject Seller ${dataUser.store_name}`
                            const timeUpdate = date2number('')

                            const addData = new Sa_activity_log(
                                {
                                    eml: email,
                                    usr: username,
                                    act: activity,
                                    ep: timeUpdate
                                }
                            )
                            addData.save((err) => {
                                if (err) {
                                    console.log(err);
                                    next(err)
                                } else {
                                    res.status(200).json(jsonData())
                                }
                            })
                        }
                    }
                )
            } else {
                res.status(200).json(jsonData('failed'))
            }


        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async postponeSeller(req, res, next) {
        try {
            const { command } = req.body
            const { id } = req.params
            const idDecrypt = decryptId(id, 12)

            const findStore = await Store.findById(idDecrypt)

            const checkToken = await Sa_stores.aggregate(
                [
                    {
                        '$match': { '_s': ObjectID(idDecrypt) }
                    },
                    {
                        '$project': {
                            'token': '$tkn',
                            '_id': 0
                        }
                    }
                ]
            )




            if (checkToken.length > 0) {
                throw { message: 'Super admin already give the token to seller' }
            }

            if (findStore.det.act === true) {
                throw { message: 'this store already active' }
            }

            let resultCommand = ''
            for (let i = 0; i < command.length; i++) {
                resultCommand += `${i + 1}. ${command[i]} \n`
            }

            const emailStore = decryptId(findStore.ctc.eml, 8)
            const storeName = findStore.det.nms
            const storeId = ObjectID(findStore._id)
            const dateMade = date2number('')


            const payloadToken = {
                store_name: storeName,
                store_id: storeId
            }

            const token = md5(payloadToken)

            const insertData = {
                _s: storeId,
                ep: dateMade,
                epd: null,
                tkn: token,
                use: false,
            }

            const configTrasnport2 = {
                service: 'gmail',
                auth: {
                    user: configMongo['email2']['user'],
                    pass: configMongo['email2']['password']
                }
            }

            const transporter = nodemailer.createTransport(configTrasnport2);

            const mailOptions = {
                from: configMongo['email2']['from'],
                to: emailStore,
                subject: 'Skin Mystery - Penundaan Toko',
                text: `Dear Toko ${storeName}, \n\n Data kamu masih ada yang perlu diperbaiki, berikut data nya: \n\n ${resultCommand} \n\n Token: ${token} \n\n Silakan klik link dibawah ini untuk memperbaiki data kamu \n\n <NANTI ADA LINK> \n\n\n Terima Kasih`
            };


            transporter.sendMail(mailOptions, (err) => {
                if (err) {
                    console.log(err)
                    throw { message: 'Failed send email' }
                } else {

                    const newSa_store = new Sa_stores(insertData)

                    newSa_store.save((err) => {
                        if (err) {
                            console.log(err)
                        } else {
                            const { email, username } = req.user
                            const activity = `Mengirim notifikasi penundaan seller ${storeName}`

                            const addData = new Sa_activity_log(
                                {
                                    eml: email,
                                    usr: username,
                                    act: activity,
                                    ep: dateMade
                                }
                            )

                            addData.save((err) => {
                                if (err) {
                                    console.log(err);
                                } else {
                                    res.status(200).json(jsonData('sukses broh'))
                                }
                            })
                        }
                    })
                }
            })

        } catch (error) {
            console.log(error)
            next(error)
        }
    }


    static async acceptSeller(req, res, next) {
        try {
            const { id } = req.params
            const idDecrypt = decryptId(id, 12)


            const checkStatus = await Store.aggregate(
                [
                    {
                        '$match': { '_id': ObjectID(idDecrypt) }
                    },
                    {
                        '$project': {
                            'status': '$det.act',
                        }
                    }
                ]
            )

            if (checkStatus[0].status === true) { throw { message: 'This store already approved' } }


            const getDataUser = await Store.aggregate(
                [
                    {
                        '$match': { '_id': ObjectID(idDecrypt) }
                    },
                    {
                        '$project': {
                            'store_name': '$det.nms',
                            'email': {
                                '$function': {
                                    'body': decrypt,
                                    'args': [{ '$toString': '$ctc.eml' }, 8],
                                    'lang': 'js'
                                }
                            },
                            'owner': { '$ifNull': ['$ctc.pic', '-'] },
                            'role': { '$ifNull': ['$ctc.jbt', '-'] },
                            'phone_number': { '$ifNull': ['$ctc.phn', '-'] },
                            'npwp': { '$ifNull': ['$lgl.npw', '-'] },
                            '_id': 0,
                            'status': 'Berhasil'
                        }
                    }
                ]
            )

            let [badge_data] = await Config.aggregate(
                [
                    {
                        '$match': {
                            '$and': [
                                { 'type': 'logo' },
                            ]
                        }
                    },
                    {
                        '$unwind': { 'path': '$data' }
                    },
                    {
                        '$project': {
                            'skinmystery_badge': '$data.skinmystery',
                            'app_store_badge': '$data.app-store',
                            'twitter_badge': '$data.twitter',
                            'facebook_badge': '$data.facebook',
                            'instagram_badge': '$data.instagram',
                            'google_play_badge': '$data.google-play-badge',
                            '_id': 0
                        }
                    }
                ]
            )

            let [company_info] = await Config.aggregate(
                [
                    {
                        '$match': {
                            '$and': [
                                { 'type': 'company' },
                                { 'subtype': 'information' },
                            ]
                        }
                    },
                    {
                        '$project': {
                            'name': '$data.name',
                            '_id': 0
                        }
                    }
                ]
            )

            if (getDataUser.length === 0) { throw { message: 'Data not found' } }

            let dataUser = getDataUser[0]

            dataUser.twitter_link = twitter_link
            dataUser.facebook_link = facebook_link
            dataUser.instagram_link = instagram_link
            dataUser.google_play_link = google_play_link
            dataUser.app_store_link = app_store_link
            dataUser.unsub_link = unsub_link
            dataUser.address = address
            dataUser.logo_sm = badge_data.skinmystery_badge
            dataUser.domain = domain
            dataUser.copyright = (new Date().getFullYear()).toString()
            dataUser.email_sm = email_sm
            dataUser.company_name = company_info.name
            dataUser.app_store_badge = badge_data.app_store_badge
            dataUser.twitter_badge = badge_data.twitter_badge
            dataUser.facebook_badge = badge_data.facebook_badge
            dataUser.instagram_badge = badge_data.instagram_badge
            dataUser.google_play_badge = badge_data.google_play_badge

            let result_email = template_accept_seller(dataUser)

            let dataUserAfterUpdate = 0

            if (result_email === true) {
                const changeStatus = Store.findOneAndUpdate(
                    {
                        '_id': ObjectID(idDecrypt)
                    },
                    {
                        '$set': {
                            'det.act': true,
                            'det.ioc' : true
                        }
                    },
                    (err, result) => {
                        if (err) {
                            console.log(err)
                            throw { message: 'Data not found' }
                        } else {

                            dataUserAfterUpdate = result

                            const deleteOtherSlug = Store.deleteMany(
                                {
                                    '$and': [
                                        { 'det.act': false },
                                        { 'slg': dataUserAfterUpdate['slg'] },
                                        { '_id': { '$not': { '$in': dataUserAfterUpdate['_id'] } } }
                                    ]
                                },
                                (err) => {
                                    if (err) {
                                        console.log(err)
                                        throw { message: 'Data not found' }
                                    } else {
                                        const { email, username } = req.user
                                        const activity = `Menerima Seller ${dataUser.store_name}`
                                        const timeUpdate = date2number('')

                                        const addData = new Sa_activity_log(
                                            {
                                                eml: email,
                                                usr: username,
                                                act: activity,
                                                ep: timeUpdate
                                            }
                                        )

                                        addData.save((err) => {
                                            if (err) {
                                                console.log(err);
                                                next(err)
                                            } else {
                                                res.status(200).json(jsonData())
                                            }
                                        })
                                    }
                                }
                            )
                        }
                    })
            } else {
                res.status(200).json(jsonData('failed'))
            }

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async detailPayment(req, res, next) {
        try {
            const { store_id, payment_id } = req.params

            const storeDecrypt = decryptId(store_id, 12)
            const paymentDecrypt = decryptId(payment_id, 12)

            const detailPayment = await Sys_payment.aggregate(
                [
                    {
                        '$match': {
                            '$and': [
                                { '_s': ObjectID(storeDecrypt) },
                                { '_id': ObjectID(paymentDecrypt) },
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'users',
                            'localField': '_u',
                            'foreignField': '_id',
                            'pipeline': [
                                {
                                    '$addFields': {
                                        'username': '$dat.usr'
                                    }
                                },
                                {
                                    '$project': {
                                        'username': '$username',
                                        'user_img': { '$concat': [`${rt_link}profile/self/avatar/`, '$username'] },
                                        '_id': 0
                                    }
                                }
                            ],
                            'as': 'user',
                        }
                    },
                    {
                        '$addFields': {
                            'username': { '$ifNull': [{ '$first': '$user.username' }, 'unknown'] },
                            'user_img': { '$ifNull': [{ '$first': '$user.user_img' }, '0'] },
                            'invoice': '$inv',
                            'total': { '$subtract': ['$mon.amm', { '$add': ['$mon.fee', '$mon.tsc', '$mon.tlo'] }] },
                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                        }
                    },
                    {
                        '$project': {
                            'invoice': payment_id,
                            'time_create': '$date',
                            'username': '$username',
                            'users_image': '$user_img',
                            'total_balance': '$total',
                            '_id': 0
                        }
                    }
                ]
            )

            res.status(200).json(jsonData(detailPayment[0]))
        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async detailVoucher(req, res, next) {
        try {
            const { store_id, payment_id } = req.params

            const storeDecrypt = decryptId(store_id, 12)
            const paymentDecrypt = decryptId(payment_id, 12)

            const detailVoucher = await Sys_voucher.aggregate(
                [
                    {
                        '$match': {
                            '$and': [
                                { '_s': ObjectID(storeDecrypt) },
                                { '_id': ObjectID(paymentDecrypt) },
                                { 'pym.sts': 'settlement' }
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'users',
                            'localField': '_u',
                            'foreignField': '_id',
                            'pipeline': [
                                {
                                    '$addFields': {
                                        'username': '$dat.usr'
                                    }
                                },
                                {
                                    '$project': {
                                        'username': '$username',
                                        'user_img': { '$concat': [`${rt_link}profile/self/avatar/`, '$username'] },
                                        '_id': 0
                                    }
                                }
                            ],
                            'as': 'user',
                        }
                    },
                    {
                        '$addFields': {
                            'username': { '$ifNull': [{ '$first': '$user.username' }, 'unknown'] },
                            'user_img': { '$ifNull': [{ '$first': '$user.user_img' }, '0'] },
                            'invoice': '$inv',
                            'total': { '$subtract': ['$prc', '$mon.fee'] },
                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                        }
                    },
                    {
                        '$project': {
                            'invoice': payment_id,
                            'time_create': '$date',
                            'username': '$username',
                            'users_image': '$user_img',
                            'total_balance': '$total',
                            '_id': 0
                        }
                    }
                ]
            )
            if (detailVoucher.length === 0) { res.send(200).json(jsonData({ result: {} })) }

            res.status(200).json(jsonData(detailVoucher[0]))

        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async detailDoctor(req, res, next) {
        try {
            const { store_id, payment_id } = req.params

            const storeDecrypt = decryptId(store_id, 12)
            const paymentDecrypt = decryptId(payment_id, 12)

            const detailDoctor = await Sys_doctor.aggregate(
                [
                    {
                        '$match': {
                            '$and': [
                                { '_s': ObjectID(storeDecrypt) },
                                { '_id': ObjectID(paymentDecrypt) },
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'date_id': { '$toDecimal': { '$toDate': '$_id' } }
                        }
                    },
                    {
                        '$addFields': {
                            'date_id': { '$round': [{ '$divide': ['$date_id', 1000] }, 4] },
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'users',
                            'localField': '_u',
                            'foreignField': '_id',
                            'pipeline': [
                                {
                                    '$addFields': {
                                        'username': '$dat.usr'
                                    }
                                },
                                {
                                    '$project': {
                                        'username': '$username',
                                        'user_img': { '$concat': [`${rt_link}profile/self/avatar/`, '$username'] },
                                        '_id': 0
                                    }
                                }
                            ],
                            'as': 'user',
                        }
                    },
                    {
                        '$addFields': {
                            'username': { '$ifNull': [{ '$first': '$user.username' }, 'unknown'] },
                            'user_img': { '$ifNull': [{ '$first': '$user.user_img' }, '0'] },
                            'invoice': '$inv',
                            'total': '$mon.amr',
                            'date': { '$toDate': { '$multiply': ['$date_id', 1000] } },
                        }
                    },
                    {
                        '$project': {
                            'invoice': payment_id,
                            'time_create': '$date',
                            'username': '$username',
                            'users_image': '$user_img',
                            'total_balance': '$total',
                            '_id': 0
                        }
                    }
                ]
            )


            if (detailDoctor.length === 0) { res.send(200).json(jsonData({ result: {} })) }

            res.status(200).json(jsonData(detailDoctor[0]))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async trxRecordAll(req, res, next) {
        try {

            const { store_id } = req.params

            let { page, item_limit, tab, time_start, time_end, search_name } = req.query

            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }

            time_start = date2number(time_start)
            time_end = date2number(time_end)

            let filterTab = 0

            if (tab) {
                filterTab = { 'status': tab }
            } else {
                filterTab = {}
            }


            let filterName = 0

            if (search_name) {
                filterName = {
                    'full_name': {
                        '$regex': search_name,
                        '$options': 'i'
                    }
                }
            } else {
                filterName = {}
            }

            const storeDecrypt = decryptId(store_id, 12)

            const trxRecordAll = await Sys_payment.aggregate(queryPagination(
                [
                    {
                        '$match': {
                            '$and': [
                                { '_s': ObjectID(storeDecrypt) },
                                { 'ep': { '$lte': time_start } },
                                { 'ep': { '$gte': time_end } }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'time': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                    'format': '%H:%M',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'date': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'users',
                            'as': 'us',
                            'localField': '_u',
                            'foreignField': '_id',
                            'pipeline': [
                                {
                                    '$project': {
                                        'full_name': {
                                            '$reduce': {
                                                'input': '$dat.fln',
                                                'initialValue': '',
                                                'in': {
                                                    '$concat': [
                                                        '$$value',
                                                        { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                                        '$$this'
                                                    ]
                                                }
                                            }
                                        },
                                        'user_avatar': { '$concat': [`${rt_link}profile/self/avatar/`, '$dat.usr'] }
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'items': {
                                '$map': {
                                    'input': '$dat',
                                    'in': {
                                        'item_image': {
                                            '$concat': [`${rt_link}store/ip/`, {
                                                '$function': {
                                                    'body': encrypt,
                                                    'args': [{ '$toString': '$$this._p' }, 12],
                                                    'lang': 'js'
                                                }
                                            }, '/0']
                                        },
                                        'item_name': '$$this.pn',
                                        'item_variant': '$$this.vn',
                                        'item_quantity': '$$this.qty',
                                        'item_total': { '$multiply': ['$$this.qty', '$$this.prc'] },
                                    }
                                }
                            },
                            'payment_id': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            }
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'cfg_payment_list',
                            'localField': 'pym.chn',
                            'foreignField': 'code',
                            'as': 'bl',
                            'pipeline': [
                                {
                                    '$sort': { '_id': -1 }
                                },
                                {
                                    '$addFields': {
                                        'methods': {
                                            '$concat': ['$bank', " ", '$title']
                                        }
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'status': switch_status_order,
                            'full_name': { '$first': '$us.full_name' },
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'sys_payment_glob',
                            'localField': '_gd',
                            'foreignField': '_id',
                            'pipeline': [
                                {
                                    '$lookup': {
                                        'from': 'sys_payment',
                                        'localField': '_id',
                                        'foreignField': '_gd',
                                        'pipeline': [
                                            { '$count': 'count' }
                                        ],
                                        'as': 'item_count'
                                    }
                                },
                                {
                                    '$addFields': {
                                        'invoice_count': { '$ifNull': [{ '$first': '$item_count.count' }, { '$toInt': '1' }] }
                                    }
                                },
                                {
                                    '$project': {
                                        'amount': {
                                            '$divide': [
                                                { '$ifNull': ['$pym.fee', { '$toInt': '0' }] },
                                                '$invoice_count'
                                            ]
                                        },

                                    }
                                }
                            ],
                            'as': 'payment_fee'
                        }
                    },
                    {
                        '$addFields': {
                            't_order': '$mon.amm',
                            's_discount': { '$ifNull': [{ '$sum': ['$mon.tsc', '$mon.tlo'] }, { '$toInt': '0' }] },
                            's_cost': {
                                '$cond': {
                                    'if': { '$eq': ['$shp.det.ins', true] },
                                    'then': '$shp.det.amm',
                                    'else': '$shp.det.bmm'
                                }
                            },
                            't_cost': { '$round': [{ '$first': '$payment_fee.amount' }] },
                            'v_skinMystery': '$mon.glo'
                        }
                    },
                    {
                        '$addFields': {
                            'user_payment': {
                                'total_order': '$t_order',
                                'shipping_cost': '$s_cost',
                                'voucher_skin_mystery': '$v_skinMystery',
                                'transaction_cost': '$t_cost',
                                'seller_discount': '$s_discount',
                                'total': { '$subtract': [{ '$add': ['$t_order', '$s_cost', '$v_skinMystery', '$t_cost'] }, '$s_discount'] }
                            }
                        }
                    },
                    {
                        '$match': {
                            '$and': [filterTab, filterName]
                        }
                    },
                    {
                        '$sort': { '_id': -1 }
                    }

                ],
                [
                    {
                        '$project': {
                            'payment_id': '$payment_id',
                            'invoice': '$inv',
                            'date_bought': {
                                '$concat': ['$date', ' ', '$time']
                            },
                            'full_name': '$full_name',
                            'user_avatar': { '$first': '$us.user_avatar' },
                            'shippment_vendor': '$shp.chn',
                            'status': '$status',
                            'payment_method': { '$first': '$bl.methods' },
                            'items': '$items',
                            'total_bought': '$user_payment.total',
                            '_id': 0,
                        }
                    },
                ], page, 3, item_limit
            ))




            res.status(200).json(jsonData(trxRecordAll[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async detailTrxRecord(req, res, next) {
        try {
            const { store_id, payment_id } = req.params

            const storeDecrypt = decryptId(store_id, 12)
            const paymentDecrypt = decryptId(payment_id, 12)


            const detailTrxRecord = await Sys_payment.aggregate(
                [
                    {
                        '$match': {
                            '$and': [
                                { '_id': ObjectID(paymentDecrypt) },
                                { '_s': ObjectID(storeDecrypt) }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'time': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                    'format': '%H:%M',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'date': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'users',
                            'as': 'us',
                            'localField': '_u',
                            'foreignField': '_id',
                            'pipeline': [
                                {
                                    '$project': {
                                        'full_name': {
                                            '$reduce': {
                                                'input': '$dat.fln',
                                                'initialValue': '',
                                                'in': {
                                                    '$concat': [
                                                        '$$value',
                                                        { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                                        '$$this'
                                                    ]
                                                }
                                            }
                                        },
                                        'user_avatar': { '$concat': [`${rt_link}profile/self/avatar/`, '$dat.usr'] }
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'items': {
                                '$map': {
                                    'input': '$dat',
                                    'in': {
                                        'item_image': {
                                            '$concat': [`${rt_link}store/ip/`, {
                                                '$function': {
                                                    'body': encrypt,
                                                    'args': [{ '$toString': '$$this._p' }, 12],
                                                    'lang': 'js'
                                                }
                                            }, '/0']
                                        },
                                        'item_name': '$$this.pn',
                                        'item_variant': '$$this.vn',
                                        'item_quantity': '$$this.qty',
                                        'item_price': '$$this.prc',
                                        'item_total': { '$multiply': ['$$this.qty', '$$this.prc'] },
                                    }
                                }
                            },
                            'payment_id': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            },
                            'shipping_history': {
                                '$map': {
                                    'input': '$shp.hst',
                                    'in': {
                                        'title': '$$this.tle',
                                        'status': '$$this.sts',
                                        'date': { '$toDate': { '$multiply': ['$$this.ep', 1000] } }
                                    }
                                }
                            },
                            'payment_history': {
                                '$map': {
                                    'input': '$pym.hst',
                                    'in': {
                                        'title': '$$this.tle',
                                        'status': '$$this.sts',
                                        'date': { '$toDate': { '$multiply': ['$$this.ep', 1000] } }
                                    }
                                }
                            },
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'cfg_payment_list',
                            'localField': 'pym.chn',
                            'foreignField': 'code',
                            'as': 'bl',
                            'pipeline': [
                                {
                                    '$sort': { '_id': -1 }
                                },
                                {
                                    '$addFields': {
                                        'methods': {
                                            '$concat': ['$bank', " ", '$title']

                                        }
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'sys_payment_glob',
                            'localField': '_gd',
                            'foreignField': '_id',
                            'pipeline': [
                                {
                                    '$lookup': {
                                        'from': 'sys_payment',
                                        'localField': '_id',
                                        'foreignField': '_gd',
                                        'pipeline': [
                                            { '$count': 'count' }
                                        ],
                                        'as': 'item_count'
                                    }
                                },
                                {
                                    '$addFields': {
                                        'invoice_count': { '$ifNull': [{ '$first': '$item_count.count' }, { '$toInt': '1' }] }
                                    }
                                },
                                {
                                    '$project': {
                                        'amount': {
                                            '$divide': [
                                                { '$ifNull': ['$pym.fee', { '$toInt': '0' }] },
                                                '$invoice_count'
                                            ]
                                        },

                                    }
                                }
                            ],
                            'as': 'payment_fee'
                        }
                    },
                    {
                        '$addFields': {
                            't_order': '$mon.amm',
                            's_discount': { '$ifNull': [{ '$sum': ['$mon.tsc', '$mon.tlo'] }, { '$toInt': '0' }] },
                            'a_fee': '$mon.fee',
                            's_cost': {
                                '$cond': {
                                    'if': { '$eq': ['$shp.det.ins', true] },
                                    'then': '$shp.det.amm',
                                    'else': '$shp.det.bmm'
                                }
                            },
                            't_cost': { '$round': [{ '$first': '$payment_fee.amount' }] },
                            'v_skinMystery': '$mon.glo'
                        }
                    },
                    {
                        '$addFields': {
                            'transaction_detail': {
                                'total_order': '$t_order',
                                'seller_discount': '$s_discount',
                                'admin_fee': '$a_fee',
                                'total': { '$subtract': ['$t_order', { '$add': ['$s_discount', '$a_fee'] }] }
                            },
                            'user_payment': {
                                'total_order': '$t_order',
                                'shipping_cost': '$s_cost',
                                'voucher_skin_mystery': '$v_skinMystery',
                                'transaction_cost': '$t_cost',
                                'seller_discount': '$s_discount',
                                'total': { '$subtract': [{ '$add': ['$t_order', '$s_cost', '$v_skinMystery', '$t_cost'] }, '$s_discount'] }

                            }
                        }
                    },
                    {
                        '$project': {
                            '_id': 0,
                            'invoice': '$inv',
                            'date_bought': {
                                '$concat': ['$date', ' ', '$time']
                            },
                            'full_name': { '$first': '$us.full_name' },
                            'user_avatar': { '$first': '$us.user_avatar' },
                            'shippment_vendor': '$shp.chn',
                            'status': switch_status_order,
                            'payment_method': { '$first': '$bl.methods' },
                            'transaction_detail': '$transaction_detail',
                            'user_payment': '$user_payment',
                            'fee_percent': { '$concat': [{ '$toString': { '$multiply': ['$fee', 100] } }, '%'] },
                            'buyer_note': '$shp.des.not',
                            'address_destination': '$shp.des.des',
                            'deadline_status': switch_deadline,
                            'cancellation_data': cancelation,
                            'items': '$items',
                            'shipping_history': '$shipping_history',
                            'payment_history': { '$ifNull': ['$payment_history', []] },
                        }
                    },
                ]
            )

            if (detailTrxRecord.length === 0) {
                res.status(200).json(jsonData({ result: [] }))
            }

            res.status(200).json(jsonData(detailTrxRecord[0]))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async reviewProduct(req, res, next) {
        try {
            const { store_id } = req.params
            const { page, item_limit, tab, reply, search_item } = req.query

            let filterMatch = 0
            let filterReply = 0

            if (tab) {
                filterMatch = { 'score': +tab }
            } else {
                filterMatch = {}
            }

            if (reply === 'true') {
                filterReply = { 'isReply': true }
            } else if (reply === 'false') {
                filterReply = { 'isReply': false }
            } else {
                filterReply = {}
            }


            let filterItem = 0

            if (search_item) {
                filterItem = {
                    'product_name': {
                        '$regex': search_item,
                        '$options': 'i'
                    }
                }
            } else {
                filterItem = {}
            }


            const storeDecrypt = decryptId(store_id, 12)

            const reviewProduct = await ProductReview.aggregate(queryPagination(
                [
                    {
                        '$match': { '_s': ObjectID(storeDecrypt) }
                    },
                    {
                        '$lookup': {
                            'from': 'users',
                            'as': 'us',
                            'localField': '_u',
                            'foreignField': '_id',
                            'pipeline': [
                                {
                                    '$project': {
                                        'user_avatar': { '$concat': [`${rt_link}profile/self/avatar/`, '$dat.usr'] },
                                        'name': {
                                            '$reduce': {
                                                'input': '$dat.fln',
                                                'initialValue': '',
                                                'in': {
                                                    '$concat': [
                                                        '$$value',
                                                        { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                                        '$$this'
                                                    ]
                                                }
                                            }
                                        },
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'sys_products_rev_reply',
                            'localField': '_id',
                            'foreignField': '_pr',
                            'pipeline': [
                                {
                                    '$addFields': {
                                        'comment': '$com',
                                    }
                                },
                                {
                                    '$project': {
                                        'comment': '$comment',
                                        '_id': 0
                                    }
                                }
                            ],
                            'as': 'product_reply',
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'stores_products',
                            'localField': '_p',
                            'foreignField': '_id',
                            'let': {
                                'variant_id': '$var._v'
                            },
                            'pipeline': [
                                {
                                    '$addFields': {
                                        'product_variant': {
                                            '$first': {
                                                '$filter': {
                                                    'input': {
                                                        '$map': {
                                                            'input': '$var',
                                                            'in': {
                                                                '$cond': {
                                                                    'if': { '$eq': ['$$this._v', '$$variant_id'] },
                                                                    'then': '$var.nme',
                                                                    'else': []
                                                                }
                                                            }
                                                        }
                                                    },
                                                    'as': 'varr',
                                                    'cond': {
                                                        '$ne': ['$$varr', []]
                                                    }
                                                }
                                            }
                                        },
                                        'item_id': {
                                            '$function': {
                                                'body': encrypt,
                                                'args': [{ '$toString': '$_id' }, 12],
                                                'lang': 'js'
                                            }
                                        },
                                    }
                                },
                                {
                                    '$project': {
                                        'variant_name': '$product_variant',
                                        'product_image': { '$concat': [`${rt_link}store/ip/`, { '$toString': '$item_id' }, '/0'] },
                                        'product_name': '$det.nms'
                                    }
                                }
                            ],
                            'as': 'products',
                        }
                    },
                    {
                        '$addFields': {
                            'variant': { '$ifNull': [{ '$first': '$products.variant_name' }, ''] },
                            'product_image': { '$ifNull': [{ '$first': '$products.product_image' }, '-'] },
                            'product_name': { '$ifNull': [{ '$first': '$products.product_name' }, '-'] }
                        }
                    },
                    {
                        '$addFields': {
                            'isReply': {
                                '$cond': {
                                    'if': { '$eq': [{ '$size': '$product_reply' }, 0] },
                                    'then': { '$toBool': true },
                                    'else': { '$toBool': false }
                                }
                            },
                            'score': '$scr',
                            'idReview': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            },
                        }
                    },
                    {
                        '$match': { '$and': [filterMatch, filterReply, filterItem] }
                    }
                ]
                ,
                [
                    {
                        '$project': {
                            '_id': '$idReview',
                            'item_name': '$product_name',
                            'item_image': '$product_image',
                            'variant_name': '$variant',
                            'name': { '$first': '$us.name' },
                            'user_avatar': { '$first': '$us.user_avatar' },
                            'score': '$score',
                            'invoice': { '$ifNull': ['$inv', '-'] },
                            'comment': '$com',
                            'isReply': '$isReply',
                            'reply': { '$ifNull': [{ '$first': '$product_reply.comment' }, null] },
                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                            'review_video': { '$ifNull': [{ '$concat': [`${rt_link}store/irv/`, '$vid'] }, '-'] },
                            'review_image': {
                                '$map': {
                                    'input': '$img',
                                    'in': {
                                        '$concat': [`${rt_link}store/ir/`, {
                                            '$function': {
                                                'body': encrypt,
                                                'args': [{ '$toString': '$_id' }, 12],
                                                'lang': 'js'
                                            }
                                        }, '/', '$$this']
                                    }
                                }
                            },
                        }
                    },
                ], page, 3, item_limit
            ))

            res.status(200).json(jsonData(reviewProduct[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async totalScoreProduct(req, res, next) {
        try {
            const { store_id } = req.params
            const storeDecrypt = decryptId(store_id, 12)


            const totalScoreProduct = await ProductReview.aggregate([
                {
                    '$match': { '_s': ObjectID(storeDecrypt) }
                },
                {
                    '$facet': {
                        'totalAll': [
                            {
                                '$count': 'totalData'
                            }
                        ],
                        'star1': [
                            {
                                '$match': { 'scr': 1 }
                            },
                            {
                                '$count': 'star1'
                            }
                        ],
                        'star2': [
                            {
                                '$match': { 'scr': 2 }
                            },
                            {
                                '$count': 'star2'
                            }
                        ],
                        'star3': [
                            {
                                '$match': { 'scr': 3 }
                            },
                            {
                                '$count': 'star3'
                            }
                        ],
                        'star4': [
                            {
                                '$match': { 'scr': 4 }
                            },
                            {
                                '$count': 'star4'
                            }
                        ],
                        'star5': [
                            {
                                '$match': { 'scr': 5 }
                            },
                            {
                                '$count': 'star5'
                            }
                        ]
                    }
                },
                {
                    '$addFields': {
                        'star1': { '$ifNull': [{ '$first': '$star1.star1' }, { '$toInt': '0' }] },
                        'star2': { '$ifNull': [{ '$first': '$star2.star2' }, { '$toInt': '0' }] },
                        'star3': { '$ifNull': [{ '$first': '$star3.star3' }, { '$toInt': '0' }] },
                        'star4': { '$ifNull': [{ '$first': '$star4.star4' }, { '$toInt': '0' }] },
                        'star5': { '$ifNull': [{ '$first': '$star5.star5' }, { '$toInt': '0' }] },
                        'total_user': { '$first': '$totalAll.totalData' }
                    }
                },
                {
                    '$addFields': {
                        'sumtotal': { '$add': [{ '$multiply': [1, '$star1'] }, { '$multiply': [2, '$star2'] }, { '$multiply': [3, '$star3'] }, { '$multiply': [4, '$star4'] }, { '$multiply': [5, '$star5'] }] }
                    }
                },
                {
                    '$addFields': {
                        'average': { '$round': [{ '$divide': ['$sumtotal', '$total_user'] }, 1] }
                    }
                },
                {
                    '$project': {
                        'average': '$average',
                        'star1': '$star1',
                        'star2': '$star2',
                        'star3': '$star3',
                        'star4': '$star4',
                        'star5': '$star5',
                        '_id': 0
                    }
                }
            ])

            if (totalScoreProduct.length === 0) { res.status(200).json(jsonData({ result: {} })) }

            res.status(200).json(jsonData(totalScoreProduct[0]))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async reviewVoucher(req, res, next) {
        try {
            const { store_id } = req.params
            const storeDecrypt = decryptId(store_id, 12)
            const { tab, page, item_limit, reply, search_voucher } = req.query

            let filterTab = 0
            let filterReply = 0

            if (tab) {
                filterTab = { 'score': +tab }
            } else {
                filterTab = {}
            }

            if (reply === 'true') {
                filterReply = { 'isReply': true }
            } else if (reply === 'false') {
                filterReply = { 'isReply': false }
            } else {
                filterReply = {}
            }


            let filterVoucher = 0

            if (search_voucher) {
                filterVoucher = {
                    'voucher_name': {
                        '$regex': search_voucher,
                        '$options': 'i'
                    }
                }
            } else {
                filterVoucher = {}
            }

            const reviewVoucher = await VoucherReview.aggregate(queryPagination(
                [
                    {
                        '$match': { '_s': ObjectID(storeDecrypt) }
                    },
                    {
                        '$lookup': {
                            'from': 'users',
                            'as': 'us',
                            'localField': '_u',
                            'foreignField': '_id',
                            'pipeline': [
                                {
                                    '$lookup': {
                                        'from': 'users_address',
                                        'as': 'ua',
                                        'localField': '_id',
                                        'foreignField': '_u',
                                        'pipeline': [
                                            {
                                                '$project': {
                                                    'address': { '$concat': ['$shp.cc', ' ', '$shp.zip'] },
                                                    '_id': 0
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    '$project': {
                                        'user_avatar': { '$concat': [`${rt_link}profile/self/avatar/`, '$dat.usr'] },
                                        'name': {
                                            '$reduce': {
                                                'input': '$dat.fln',
                                                'initialValue': '',
                                                'in': {
                                                    '$concat': [
                                                        '$$value',
                                                        { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                                        '$$this'
                                                    ]
                                                }
                                            }
                                        },
                                        'address': { '$first': '$ua.address' }
                                    }
                                },
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'stores_vouchers',
                            'as': 'sv',
                            'localField': '_vc',
                            'foreignField': '_id',
                            'pipeline': [
                                {
                                    '$project': {
                                        '_id': 0,
                                        'voucher_name': '$nme',
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'sys_vouchers_rev_reply',
                            'localField': '_id',
                            'foreignField': '_vr',
                            'pipeline': [
                                {
                                    '$addFields': {
                                        'comment': '$com',
                                    }
                                },
                                {
                                    '$project': {
                                        'comment': '$comment',
                                        '_id': 0
                                    }
                                }
                            ],
                            'as': 'voucher_reply',
                        }
                    },
                    {
                        '$addFields': {
                            'score': '$scr',
                            'isReply': {
                                '$cond': {
                                    'if': { '$eq': [{ '$size': '$voucher_reply' }, 0] },
                                    'then': { '$toBool': true },
                                    'else': { '$toBool': false }
                                }
                            },
                            'voucher_name': { '$ifNull': [{ '$first': '$sv.voucher_name' }, '-'] },
                        }
                    },
                    {
                        '$match': { '$and': [filterTab, filterReply, filterVoucher] }
                    }
                ],
                [
                    {
                        '$project': {
                            '_id': 0,
                            'user_avatar': { '$first': '$us.user_avatar' },
                            'name': { '$first': '$us.name' },
                            'address': { '$first': '$us.address' },
                            'voucher_name': '$voucher_name',
                            'score': '$score',
                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                            'review_video': { '$ifNull': [{ '$concat': [`${rt_link}store/irv/`, '$vid'] }, '-'] },
                            'review_image': {
                                '$map': {
                                    'input': '$img',
                                    'in': {
                                        '$concat': [`${rt_link}store/ir/`, {
                                            '$function': {
                                                'body': encrypt,
                                                'args': [{ '$toString': '$_id' }, 12],
                                                'lang': 'js'
                                            }
                                        }, '/', '$$this']
                                    }
                                }
                            },
                            'invoice': '$inv',
                            'comment': '$com',
                            'isReply': '$isReply',
                            'reply': { '$ifNull': [{ '$first': '$voucher_reply.comment' }, null] },
                        }
                    }
                ], page, 3, item_limit
            ))

            if (reviewVoucher.length === 0) { res.status(200).json(jsonData({ result: [] })) }

            res.status(200).json(jsonData(reviewVoucher[0]))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async totalScoreVoucher(req, res, next) {
        try {
            const { store_id } = req.params
            const storeDecrypt = decryptId(store_id, 12)


            const totalScoreVoucher = await VoucherReview.aggregate([
                {
                    '$match': { '_s': ObjectID(storeDecrypt) }
                },
                {
                    '$facet': {
                        'totalAll': [
                            {
                                '$count': 'totalData'
                            }
                        ],
                        'star1': [
                            {
                                '$match': { 'scr': 1 }
                            },
                            {
                                '$count': 'star1'
                            }
                        ],
                        'star2': [
                            {
                                '$match': { 'scr': 2 }
                            },
                            {
                                '$count': 'star2'
                            }
                        ],
                        'star3': [
                            {
                                '$match': { 'scr': 3 }
                            },
                            {
                                '$count': 'star3'
                            }
                        ],
                        'star4': [
                            {
                                '$match': { 'scr': 4 }
                            },
                            {
                                '$count': 'star4'
                            }
                        ],
                        'star5': [
                            {
                                '$match': { 'scr': 5 }
                            },
                            {
                                '$count': 'star5'
                            }
                        ]
                    }
                },
                {
                    '$addFields': {
                        'star1': { '$ifNull': [{ '$first': '$star1.star1' }, { '$toInt': '0' }] },
                        'star2': { '$ifNull': [{ '$first': '$star2.star2' }, { '$toInt': '0' }] },
                        'star3': { '$ifNull': [{ '$first': '$star3.star3' }, { '$toInt': '0' }] },
                        'star4': { '$ifNull': [{ '$first': '$star4.star4' }, { '$toInt': '0' }] },
                        'star5': { '$ifNull': [{ '$first': '$star5.star5' }, { '$toInt': '0' }] },
                        'total_user': { '$first': '$totalAll.totalData' }
                    }
                },
                {
                    '$addFields': {
                        'sumtotal': { '$add': [{ '$multiply': [1, '$star1'] }, { '$multiply': [2, '$star2'] }, { '$multiply': [3, '$star3'] }, { '$multiply': [4, '$star4'] }, { '$multiply': [5, '$star5'] }] }
                    }
                },
                {
                    '$addFields': {
                        'average': { '$round': [{ '$divide': ['$sumtotal', '$total_user'] }, 2] }
                    }
                },
                {
                    '$project': {
                        'average': '$average',
                        'star1': '$star1',
                        'star2': '$star2',
                        'star3': '$star3',
                        'star4': '$star4',
                        'star5': '$star5',
                        '_id': 0
                    }
                }
            ])

            if (totalScoreVoucher.length === 0) { res.status(200).json(jsonData({ result: {} })) }

            res.status(200).json(jsonData(totalScoreVoucher[0]))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async chartFollowerStore(req, res, next) {
        try {
            const { store_id } = req.params

            let { time_start, time_end } = req.query
            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }

            time_start = date2number(time_start)
            time_end = date2number(time_end)
            let time_start_double = time_end
            let time_end_double = time_end - (time_start - time_end)

            const idDecrypt = decryptId(store_id, 12)

            const chartFollowerStore = await StoreFollower.aggregate([
                {
                    '$addFields': {
                        'date_id': { '$toDecimal': { '$toDate': '$_id' } }
                    }
                },
                {
                    '$addFields': {
                        'date_id': { '$round': [{ '$divide': ['$date_id', 1000] }, 4] },
                    }
                },
                {
                    '$match': {
                        '$and': [
                            { '_s': ObjectID(idDecrypt) },
                            { 'date_id': { '$lte': time_start } },
                            { 'date_id': { '$gte': time_end_double } },
                        ]
                    }
                },
                {
                    '$facet': {
                        'compare_a': [
                            {
                                '$match': {
                                    '$and': [
                                        { 'date_id': { '$lte': time_start } },
                                        { 'date_id': { '$gte': time_end } }
                                    ]
                                }
                            },
                            {
                                '$addFields': {
                                    'date': {
                                        '$dateToString': {
                                            'date': { '$toDate': '$_id' },
                                            'format': '%Y-%m-%d',
                                            'onNull': '2020-01-01'
                                        }
                                    }
                                }
                            },
                            {
                                '$group': {
                                    '_id': '$date',
                                    'value': { '$sum': 1 }
                                }
                            },
                            { '$sort': { '_id': 1 } },
                            {
                                '$project': {
                                    'label': 'total_follower',
                                    'x': '$_id',
                                    'y': '$value',
                                    '_id': 0
                                }
                            }
                        ],
                        'compare_b': [
                            {
                                '$match': {
                                    '$and': [
                                        { 'date_id': { '$lte': time_start_double } },
                                        { 'date_id': { '$gte': time_end_double } }
                                    ]
                                }
                            },
                            {
                                '$addFields': {
                                    'date': {
                                        '$dateToString': {
                                            'date': { '$toDate': '$_id' },
                                            'format': '%Y-%m-%d',
                                            'onNull': '2020-01-01'
                                        }
                                    }
                                }
                            },
                            {
                                '$group': {
                                    '_id': '$date',
                                    'value': { '$sum': 1 }
                                }
                            },
                            { '$sort': { '_id': 1 } },
                            {
                                '$project': {
                                    'label': 'total_follower',
                                    'x': '$_id',
                                    'y': '$value',
                                    '_id': 0
                                }
                            }
                        ]
                    }
                },
                {
                    '$addFields': {
                        'value_a': { '$sum': '$compare_a.y' },
                        'value_b': { '$sum': '$compare_b.y' }
                    }
                },
                {
                    '$addFields': {
                        'diff_percent_followers': {
                            '$multiply': [
                                {
                                    '$divide': [
                                        { '$subtract': ['$value_a', '$value_b'] },
                                        {
                                            '$cond': {
                                                'if': { '$lte': ['$value_b', 0] },
                                                'then': 1,
                                                'else': '$value_b'
                                            }
                                        },
                                    ]
                                }, 100
                            ]
                        },
                        'days_compare': {
                            '$concat': [
                                {
                                    '$toString': {
                                        '$dateDiff': {
                                            'startDate': {
                                                '$toDate': {
                                                    '$multiply': [time_start, 1000]
                                                }
                                            },
                                            'endDate': {
                                                '$toDate': {
                                                    '$multiply': [time_end, 1000]
                                                }
                                            },
                                            'unit': 'day'
                                        }
                                    }
                                },
                                ' days'
                            ]
                        }
                    }
                },
                {
                    '$project': {
                        'statistic': '$compare_a',
                        'total_followers': '$value_a',
                        'diff_percent': { '$round': ['$diff_percent_followers', 1] },
                        'diff_days': '$days_compare',
                        '_id': 0
                    }
                }
            ])

            res.status(200).json(jsonData(chartFollowerStore[0]))

        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async listFollowerStore(req, res, next) {
        try {
            const { page, item_limit } = req.query
            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)

            const listFollowerStore = await StoreFollower.aggregate(queryPagination(
                [
                    {
                        '$match': {
                            '_s': ObjectID(idDecrypt)
                        }
                    },
                    { '$sort': { '_id': -1 } },
                    {
                        '$addFields': {
                            'date_id': { '$toDecimal': { '$toDate': '$_id' } }
                        }
                    },
                    {
                        '$addFields': {
                            'date_id': { '$round': [{ '$divide': ['$date_id', 1000] }, 4] },
                        }
                    },
                    {
                        '$addFields': {
                            'date': { '$toDate': { '$multiply': ['$date_id', 1000] } }
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'users',
                            'localField': '_u',
                            'foreignField': '_id',
                            'pipeline': [
                                {
                                    '$addFields': {
                                        'username': '$dat.usr',
                                    }
                                },
                                {
                                    '$addFields': {
                                        'user_id': {
                                            '$function': {
                                                'body': encrypt,
                                                'args': [{ '$toString': '$_id' }, 12],
                                                'lang': 'js'
                                            }
                                        }
                                    }
                                },
                                {
                                    '$project': {
                                        'user_id': '$user_id',
                                        'username': '$username',
                                        'user_img': { '$concat': [`${rt_link}profile/self/avatar/`, '$username'] },
                                        '_id': 0
                                    }
                                }
                            ],
                            'as': 'user',
                        }
                    },
                    {
                        '$addFields': {
                            'user_id': { '$ifNull': [{ '$first': '$user.user_id' }, 'unknown'] },
                            'username': { '$ifNull': [{ '$first': '$user.username' }, 'unknown'] },
                            'user_img': { '$ifNull': [{ '$first': '$user.user_img' }, 'unknown'] },
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'users',
                            'localField': '_u',
                            'foreignField': '_id',
                            'pipeline': [
                                {
                                    '$lookup': {
                                        'from': 'sys_store_blockin',
                                        'localField': '_id',
                                        'foreignField': '_u',
                                        'pipeline': [
                                            {
                                                '$addFields': {
                                                    'blocked_id': {
                                                        '$function': {
                                                            'body': encrypt,
                                                            'args': [{ '$toString': '$_id' }, 12],
                                                            'lang': 'js'
                                                        }
                                                    }
                                                }
                                            },
                                            {
                                                '$project': {
                                                    'block_id': '$blocked_id',
                                                    '_id': 0
                                                }
                                            }
                                        ],
                                        'as': 'blocked'
                                    }
                                },
                                {
                                    '$addFields': {
                                        'blocked_id': { '$ifNull': [{ '$first': '$blocked.block_id' }, null] },
                                        'check_block': { '$size': '$blocked' }
                                    }
                                },
                                {
                                    '$addFields': {
                                        'checking': {
                                            '$cond': {
                                                'if': { '$gte': ['$check_block', 1] },
                                                'then': { '$toBool': true },
                                                'else': { '$toBool': false }
                                            }
                                        }
                                    }
                                },
                                {
                                    '$project': {
                                        'checking': '$checking',
                                        'blocked_id': '$blocked_id',
                                        '_id': 0
                                    }
                                }
                            ],
                            'as': 'users',
                        }
                    },
                    {
                        '$addFields': {
                            'checking': { '$ifNull': [{ '$first': '$users.checking' }, false] },
                            'block_id': { '$ifNull': [{ '$first': '$users.blocked_id' }, null] }
                        }
                    }
                ],
                [
                    {
                        '$project': {
                            'is_block': '$checking',
                            'block_id': '$block_id',
                            'user_id': '$user_id',
                            'username': '$username',
                            'user_image': '$user_img',
                            'date': '$date',
                            '_id': 0
                        }
                    }
                ], page, 3, item_limit
            ))
            res.status(200).json(jsonData(listFollowerStore[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async statStoreSales(req, res, next) {
        try {
            let { time_start, time_end } = req.query
            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }


            time_start = date2number(time_start)
            time_end = date2number(time_end)
            let time_start_double = time_end
            let time_end_double = time_end - (time_start - time_end)

            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)

            const statStoreSales = await Sys_payment.aggregate([
                {
                    '$match': {
                        '$and': [
                            { '_s': ObjectID(idDecrypt) },
                        ]
                    }
                },
                {
                    '$addFields': {
                        'income': { '$subtract': ['$mon.amm', { '$add': ['$mon.tsc', '$mon.fee', '$mon.tlo'] }] },
                    }
                },
                {
                    '$facet': {
                        'total_now': [
                            {
                                '$match': {
                                    '$and': [
                                        { 'ep': { '$lte': time_start } },
                                        { 'ep': { '$gte': time_end } },
                                        { 'pym.sts': 'settlement' },
                                        { 'shp.sts': 'settlement' }
                                    ]
                                }
                            },
                            {
                                '$addFields': {
                                    'date': {
                                        '$dateToString': {
                                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                            'format': '%Y-%m-%d',
                                            'onNull': '2020-01-01'
                                        }
                                    }
                                }
                            },
                            {
                                '$group': {
                                    '_id': '$date',
                                    'total_income': { '$sum': '$income' }
                                }
                            },
                            {
                                '$sort': { '_id': 1 }
                            },
                            {
                                '$project': {
                                    'label': 'sales',
                                    'x': '$_id',
                                    'y': '$total_income',
                                    '_id': 0

                                }
                            }
                        ],
                        'total_double': [
                            {
                                '$match': {
                                    '$and': [
                                        { 'ep': { '$lte': time_start_double } },
                                        { 'ep': { '$gte': time_end_double } },
                                        { 'pym.sts': 'settlement' },
                                        { 'shp.sts': 'settlement' }
                                    ]
                                }
                            },
                            {
                                '$project': {
                                    'total_income': { '$sum': '$income' },
                                    '_id': 0
                                }
                            }
                        ]
                    }
                },
                {
                    '$addFields': {
                        'income_now': { '$sum': '$total_now.y' },
                        'income_double': { '$sum': '$total_double.total_income' },
                        'diffDays': {
                            '$concat': [
                                {
                                    '$toString': {
                                        '$dateDiff': {
                                            'startDate': {
                                                '$toDate': {
                                                    '$multiply': [time_start, 1000]
                                                }
                                            },
                                            'endDate': {
                                                '$toDate': {
                                                    '$multiply': [time_end, 1000]
                                                }
                                            },
                                            'unit': 'day'
                                        }
                                    }
                                },
                                ' days'
                            ]
                        }
                    }
                },
                {
                    '$addFields': {
                        'percent': percent_aggregate('$income_now', '$income_double')
                    }
                },
                {
                    '$project': {
                        'income_sale': '$income_now',
                        'percent': '$percent',
                        'diff_day': '$diffDays',
                        'statistic': '$total_now',
                        '_id': 0
                    }
                }
            ])

            res.status(200).json(jsonData(statStoreSales[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async statStoreVisitor(req, res, next) {
        try {
            let { time_start, time_end } = req.query
            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }
            time_start = date2number(time_start)
            time_end = date2number(time_end)
            let time_start_double = time_end
            let time_end_double = time_end - (time_start - time_end)

            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)

            const statStoreVisitor = await StoreSeen.aggregate([
                {
                    '$match': {
                        '$and': [
                            { '_s': ObjectID(idDecrypt) },
                        ]
                    }
                },
                {
                    '$facet': {
                        'total_now': [
                            {
                                '$match': {
                                    '$and': [
                                        { 'ep': { '$lte': time_start } },
                                        { 'ep': { '$gte': time_end } },
                                    ]
                                }
                            },
                            {
                                '$addFields': {
                                    'date': {
                                        '$dateToString': {
                                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                            'format': '%Y-%m-%d',
                                            'onNull': '2020-01-01'
                                        }
                                    }
                                }
                            },
                            {
                                '$group': {
                                    '_id': '$date',
                                    'total_visitor': { '$sum': 1 }
                                }
                            },
                            {
                                '$sort': { '_id': 1 }
                            },
                            {
                                '$project': {
                                    'label': 'total_visitor',
                                    'x': '$_id',
                                    'y': '$total_visitor',
                                    '_id': 0

                                }
                            }
                        ],
                        'total_double': [
                            {
                                '$match': {
                                    '$and': [
                                        { 'ep': { '$lte': time_start_double } },
                                        { 'ep': { '$gte': time_end_double } },
                                    ]
                                }
                            },
                            {
                                '$project': {
                                    'total_visitor': { '$sum': 1 },
                                    '_id': 0
                                }
                            }
                        ]
                    }
                },
                {
                    '$addFields': {
                        'visitors_now': { '$sum': '$total_now.y' },
                        'visitors_double': { '$sum': '$total_double.total_visitor' },
                        'diffDays': {
                            '$concat': [
                                {
                                    '$toString': {
                                        '$dateDiff': {
                                            'startDate': {
                                                '$toDate': {
                                                    '$multiply': [time_start, 1000]
                                                }
                                            },
                                            'endDate': {
                                                '$toDate': {
                                                    '$multiply': [time_end, 1000]
                                                }
                                            },
                                            'unit': 'day'
                                        }
                                    }
                                },
                                ' days'
                            ]
                        }
                    }
                },
                {
                    '$addFields': {
                        'percent': percent_aggregate('$visitors_now', '$visitors_double')
                    }
                },
                {
                    '$project': {
                        'total_visit': '$visitors_now',
                        'percent': '$percent',
                        'diff_day': '$diffDays',
                        'statistic': '$total_now',
                        '_id': 0
                    }
                }
            ])

            res.status(200).json(jsonData(statStoreVisitor[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async statStoreProductSeen(req, res, next) {
        try {
            let { time_start, time_end } = req.query
            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }
            time_start = date2number(time_start)
            time_end = date2number(time_end)
            let time_start_double = time_end
            let time_end_double = time_end - (time_start - time_end)

            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)

            const statStoreProductSeen = await Sys_products_seen.aggregate(
                [
                    {
                        '$match': { '_s': ObjectID(idDecrypt) },
                    },
                    {
                        '$facet': {
                            'total_now': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start } },
                                            { 'ep': { '$gte': time_end } },
                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'date': {
                                            '$dateToString': {
                                                'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                                'format': '%Y-%m-%d',
                                                'onNull': '2020-01-01'
                                            }
                                        }
                                    }
                                },
                                {
                                    '$group': {
                                        '_id': '$date',
                                        'total_view': { '$sum': 1 }
                                    }
                                },
                                {
                                    '$sort': { '_id': 1 }
                                },
                                {
                                    '$project': {
                                        'label': 'total_view',
                                        'x': '$_id',
                                        'y': '$total_view',
                                        '_id': 0

                                    }
                                }
                            ],
                            'total_double': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start_double } },
                                            { 'ep': { '$gte': time_end_double } },
                                        ]
                                    }
                                },
                                {
                                    '$project': {
                                        'total_view': { '$sum': 1 },
                                        '_id': 0
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'data_now': { '$sum': '$total_now.y' },
                            'data_double': { '$sum': '$total_double.total_view' },
                            'diffDays': {
                                '$concat': [
                                    {
                                        '$toString': {
                                            '$dateDiff': {
                                                'startDate': {
                                                    '$toDate': {
                                                        '$multiply': [time_start, 1000]
                                                    }
                                                },
                                                'endDate': {
                                                    '$toDate': {
                                                        '$multiply': [time_end, 1000]
                                                    }
                                                },
                                                'unit': 'day'
                                            }
                                        }
                                    },
                                    ' days'
                                ]
                            }
                        }
                    },
                    {
                        '$addFields': {
                            'percent': percent_aggregate('$data_now', '$data_double')
                        }
                    },
                    {
                        '$project': {
                            'view': '$data_now',
                            'percent': '$percent',
                            'diff_day': '$diffDays',
                            'statistic': '$total_now',
                            '_id': 0
                        }
                    }
                ]
            )

            res.status(200).json(jsonData(statStoreProductSeen[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async statStoreOrder(req, res, next) {
        try {
            let { time_start, time_end } = req.query
            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }
            time_start = date2number(time_start)
            time_end = date2number(time_end)
            let time_start_double = time_end
            let time_end_double = time_end - (time_start - time_end)

            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)

            const statStoreOrder = await Sys_payment.aggregate([
                {
                    '$match': {
                        '$and': [
                            { '_s': ObjectID(idDecrypt) },
                        ]
                    }
                },
                {
                    '$addFields': {
                        'sub_order': { '$sum': 1 }
                    }
                },
                {
                    '$facet': {
                        'total_now': [
                            {
                                '$match': {
                                    '$and': [
                                        { 'ep': { '$lte': time_start } },
                                        { 'ep': { '$gte': time_end } },
                                        { 'pym.sts': { '$nin': ['pending', 'failed'] } },

                                    ]
                                }
                            },
                            {
                                '$addFields': {
                                    'date': {
                                        '$dateToString': {
                                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                            'format': '%Y-%m-%d',
                                            'onNull': '2020-01-01'
                                        }
                                    }
                                }
                            },
                            {
                                '$group': {
                                    '_id': '$date',
                                    'total_order': { '$sum': '$sub_order' }
                                }
                            },
                            {
                                '$sort': { '_id': 1 }
                            },
                            {
                                '$project': {
                                    'label': 'total_order',
                                    'x': '$_id',
                                    'y': '$total_order',
                                    '_id': 0

                                }
                            }
                        ],
                        'total_double': [
                            {
                                '$match': {
                                    '$and': [
                                        { 'ep': { '$lte': time_start_double } },
                                        { 'ep': { '$gte': time_end_double } },
                                        { 'pym.sts': { '$nin': ['pending', 'failed'] } },
                                        // { 'shp.sts': 'settlement' },

                                    ]
                                }
                            },
                            {
                                '$project': {
                                    'total_order': { '$sum': '$total_order' },
                                    '_id': 0
                                }
                            }
                        ]
                    }
                },
                {
                    '$addFields': {
                        'order_now': { '$sum': '$total_now.y' },
                        'order_double': { '$sum': '$total_double.total_order' },
                        'diffDays': {
                            '$concat': [
                                {
                                    '$toString': {
                                        '$dateDiff': {
                                            'startDate': {
                                                '$toDate': {
                                                    '$multiply': [time_start, 1000]
                                                }
                                            },
                                            'endDate': {
                                                '$toDate': {
                                                    '$multiply': [time_end, 1000]
                                                }
                                            },
                                            'unit': 'day'
                                        }
                                    }
                                },
                                ' days'
                            ]
                        }
                    }
                },
                {
                    '$project': {
                        'income_sale': '$order_now',
                        'percent': percent_aggregate('$order_now', '$order_double'),
                        'diff_day': '$diffDays',
                        'statistic': '$total_now',
                        '_id': 0
                    }
                }
            ])

            res.status(200).json(jsonData(statStoreOrder[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async statStoreConversion(req, res, next) {
        try {
            let { time_start, time_end } = req.query
            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }
            time_start = date2number(time_start)
            time_end = date2number(time_end)
            let time_start_double = time_end
            let time_end_double = time_end - (time_start - time_end)

            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)

            const statStoreConversion = await Store.aggregate([
                {
                    '$match': {
                        '_id': ObjectID(idDecrypt)
                    }
                },
                {
                    '$lookup': {
                        'from': 'sys_products_seen',
                        'localField': '_id',
                        'foreignField': '_s',
                        'pipeline': [
                            {
                                '$facet': {
                                    'ratio_now': [
                                        {
                                            '$match': {
                                                '$and': [
                                                    { 'ep': { '$gte': time_start } },
                                                    { 'ep': { '$lte': time_end } }
                                                ]
                                            }
                                        },
                                        {
                                            '$addFields': {
                                                'date': {
                                                    '$dateToString': {
                                                        'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                                        'format': '%Y-%m-%d',
                                                        'onNull': '2020-01-01'
                                                    }
                                                }
                                            }
                                        },
                                        {
                                            '$group': {
                                                '_id': '$date',
                                                'count': { '$sum': 1 }
                                            }
                                        },
                                        {
                                            '$project': {
                                                'y': '$count',
                                                'x': '$date',
                                                'label': 'pengunjung',
                                                '_id': 0
                                            }
                                        }
                                    ],
                                    'ratio_double': [
                                        {
                                            '$match': {
                                                '$and': [
                                                    { 'ep': { '$gte': time_start_double } },
                                                    { 'ep': { '$lte': time_end_double } }
                                                ]
                                            }
                                        },
                                        {
                                            '$addFields': {
                                                'date': {
                                                    '$dateToString': {
                                                        'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                                        'format': '%Y-%m-%d',
                                                        'onNull': '2020-01-01'
                                                    }
                                                }
                                            }
                                        },
                                        {
                                            '$group': {
                                                '_id': '$date',
                                                'count': { '$sum': 1 }
                                            }
                                        },
                                        {
                                            '$project': {
                                                'y': '$count',
                                                'x': '$_id',
                                                'label': 'pengunjung',
                                                '_id': 0
                                            }
                                        }
                                    ]
                                }
                            }
                        ],
                        'as': 'seen'
                    }
                },
                {
                    '$lookup': {
                        'from': 'sys_payment',
                        'localField': '_id',
                        'foreignField': '_s',
                        'pipeline': [
                            {
                                '$facet': {
                                    'ratio_now': [
                                        {
                                            '$match': {
                                                '$and': [
                                                    { 'tgr.pym': { '$gte': time_start } },
                                                    { 'tgr.pym': { '$lte': time_end } }
                                                ]
                                            }
                                        },
                                        {
                                            '$addFields': {
                                                'date': {
                                                    '$dateToString': {
                                                        'date': { '$toDate': { '$multiply': ['$tgr.pym', 1000] } },
                                                        'format': '%Y-%m-%d',
                                                        'onNull': '2020-01-01'
                                                    }
                                                }
                                            }
                                        },
                                        {
                                            '$group': {
                                                '_id': '$date',
                                                'count': { '$sum': 1 }
                                            }
                                        },
                                        {
                                            '$project': {
                                                'y': '$count',
                                                'x': '$_id',
                                                'label': 'pesanan',
                                                '_id': 0
                                            }
                                        }
                                    ],
                                    'ratio_double': [
                                        {
                                            '$match': {
                                                '$and': [
                                                    { 'tgr.pym': { '$gte': time_start_double } },
                                                    { 'tgr.pym': { '$lte': time_end_double } }
                                                ]
                                            }
                                        },
                                        {
                                            '$addFields': {
                                                'date': {
                                                    '$dateToString': {
                                                        'date': { '$toDate': { '$multiply': ['$tgr.pym', 1000] } },
                                                        'format': '%Y-%m-%d',
                                                        'onNull': '2020-01-01'
                                                    }
                                                }
                                            }
                                        },
                                        {
                                            '$group': {
                                                '_id': '$date',
                                                'count': { '$sum': 1 }
                                            }
                                        },
                                        {
                                            '$project': {
                                                'y': '$count',
                                                'x': '$_id',
                                                'label': 'pesanan',
                                                '_id': 0
                                            }
                                        }
                                    ]
                                }
                            }
                        ],
                        'as': 'payment'
                    }
                },
                {
                    '$project': {
                        'seen_now': { '$ifNull': [{ '$first': '$seen.ratio_now' }, []] },
                        'payment_now': { '$ifNull': [{ '$first': '$payment.ratio_now' }, []] },
                        'seen_double': { '$ifNull': [{ '$first': '$seen.ratio_double' }, []] },
                        'payment_double': { '$ifNull': [{ '$first': '$payment.ratio_double' }, []] }
                    }
                },
                {
                    '$project': {
                        'ratio_now': {
                            '$function': {
                                'body': 'function ratios(a,r,x){var e=[],t=0;r.map((r,l)=>{var n=0;a.map((x,e)=>{x.x===r.x&&r.x==a[e].x&&(n=a[e].y/r.y*100)}),t+=n,e.push({x:r.x,y:n,label:x})});var l=t/(e.length?e.length:1);return{list:e,average:l}}',
                                'args': ['$payment_now', '$seen_now', 'conversion'],
                                'lang': 'js'
                            }
                        },
                        'ratio_double': {
                            '$function': {
                                'body': 'function ratios(a,r,x){var e=[],t=0;r.map((r,l)=>{var n=0;a.map((x,e)=>{x.x===r.x&&r.x==a[e].x&&(n=a[e].y/r.y*100)}),t+=n,e.push({x:r.x,y:n,label:x})});var l=t/(e.length?e.length:1);return{list:e,average:l}}',
                                'args': ['$payment_double', '$seen_double', '...'],
                                'lang': 'js'
                            }
                        }
                    }
                },
                {
                    '$addFields': {
                        'ratio_size': { '$size': '$ratio_now.list' }
                    }
                },
                {
                    '$project': {
                        'statistic': '$ratio_now.list',
                        'conversion_now': { '$toDouble': '$ratio_now.average' },
                        'conversion_compare': { '$toDouble': '$ratio_double.average' },
                        '_id': 0
                    }
                },
                {
                    '$project': {
                        'statistic': '$statistic',
                        'conversion': '$conversion_now',
                        'percent': {
                            '$multiply': [
                                {
                                    '$divide': [
                                        '$conversion_now',
                                        {
                                            '$cond': {
                                                'if': { '$eq': ['$conversion_compare', 0] },
                                                'then': { '$toInt': '1' },
                                                'else': '$conversion_compare'
                                            }
                                        }
                                    ]
                                },
                                100
                            ]
                        },
                        'diff_days': range_day_aggregate(time_start, time_end),
                        '_id': 0
                    }
                }
            ])

            res.status(200).json(jsonData(statStoreConversion[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async statStoreCancellation(req, res, next) {
        try {
            let { time_start, time_end } = req.query
            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }
            time_start = date2number(time_start)
            time_end = date2number(time_end)
            let time_start_double = time_end
            let time_end_double = time_end - (time_start - time_end)

            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)

            const statStoreCancellation = await Sys_payment.aggregate([
                {
                    '$match': {
                        '$and': [
                            { '_s': ObjectID(idDecrypt) },
                            { 'pym.sts': { '$nin': ['pending', 'failed'] } },
                            { 'shp.sts': { '$in': ['cancelled', 'canceled'] } }
                        ]
                    }
                },
                {
                    '$facet': {
                        'total_now': [
                            {
                                '$match': {
                                    '$and': [
                                        { 'ep': { '$lte': time_start } },
                                        { 'ep': { '$gte': time_end } },
                                    ]
                                }
                            },
                            {
                                '$addFields': {
                                    'date': {
                                        '$dateToString': {
                                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                            'format': '%Y-%m-%d',
                                            'onNull': '2020-01-01'
                                        }
                                    }
                                }
                            },
                            {
                                '$group': {
                                    '_id': '$date',
                                    'total_cancel': { '$sum': 1 }
                                }
                            },
                            {
                                '$sort': { '_id': 1 }
                            },
                            {
                                '$project': {
                                    'label': 'total_cancel',
                                    'x': '$_id',
                                    'y': '$total_cancel',
                                    '_id': 0

                                }
                            }
                        ],
                        'total_double': [
                            {
                                '$match': {
                                    '$and': [
                                        { 'ep': { '$lte': time_start_double } },
                                        { 'ep': { '$gte': time_end_double } },
                                    ]
                                }
                            },
                            {
                                '$project': {
                                    'total_cancel': { '$sum': 1 },
                                    '_id': 0
                                }
                            }
                        ]
                    }
                },
                {
                    '$addFields': {
                        'cancel_now': { '$sum': '$total_now.y' },
                        'cancel_double': { '$sum': '$total_double.total_cancel' },
                    }
                },
                {
                    '$project': {
                        'cancel_total': '$cancel_now',
                        'percent': percent_aggregate('$cancel_now', '$cancel_double'),
                        'diff_day': range_day_aggregate(time_start, time_end),
                        'statistic': '$total_now',
                        '_id': 0
                    }
                },
            ])

            res.status(200).json(jsonData(statStoreCancellation[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async statStoreReturn(req, res, next) {
        try {
            let { time_start, time_end } = req.query
            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }
            time_start = date2number(time_start)
            time_end = date2number(time_end)
            let time_start_double = time_end
            let time_end_double = time_end - (time_start - time_end)

            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)

            const statStoreReturn = await Sys_payment.aggregate([
                {
                    '$match': {
                        '$and': [
                            { '_s': ObjectID(idDecrypt) },
                            { 'pym.sts': { '$nin': ['pending', 'failed'] } },
                            { 'shp.sts': { '$in': ['returned', 'return-pending'] } }
                        ]
                    }
                },
                {
                    '$facet': {
                        'total_now': [
                            {
                                '$match': {
                                    '$and': [
                                        { 'ep': { '$lte': time_start } },
                                        { 'ep': { '$gte': time_end } },
                                    ]
                                }
                            },
                            {
                                '$addFields': {
                                    'date': {
                                        '$dateToString': {
                                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                            'format': '%Y-%m-%d',
                                            'onNull': '2020-01-01'
                                        }
                                    }
                                }
                            },
                            {
                                '$group': {
                                    '_id': '$date',
                                    'total_return': { '$sum': 1 }
                                }
                            },
                            {
                                '$sort': { '_id': 1 }
                            },
                            {
                                '$project': {
                                    'label': 'total_return',
                                    'x': '$_id',
                                    'y': '$total_return',
                                    '_id': 0

                                }
                            }
                        ],
                        'total_double': [
                            {
                                '$match': {
                                    '$and': [
                                        { 'ep': { '$lte': time_start_double } },
                                        { 'ep': { '$gte': time_end_double } },
                                    ]
                                }
                            },
                            {
                                '$project': {
                                    'total_return': { '$sum': 1 },
                                    '_id': 0
                                }
                            }
                        ]
                    }
                },
                {
                    '$addFields': {
                        'return_now': { '$sum': '$total_now.y' },
                        'return_double': { '$sum': '$total_double.total_return' },
                    }
                },
                {
                    '$project': {
                        'cancel_total': '$return_now',
                        'percent': percent_aggregate('$return_now', '$return_double'),
                        'diff_day': range_day_aggregate(time_start, time_end),
                        'statistic': '$total_now',
                        '_id': 0
                    }
                },
            ])

            res.status(200).json(jsonData(statStoreReturn[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async statStoreSaleByOrder(req, res, next) {
        try {
            let { time_start, time_end } = req.query
            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }
            time_start = date2number(time_start)
            time_end = date2number(time_end)
            let time_start_double = time_end
            let time_end_double = time_end - (time_start - time_end)

            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)

            const statStoreSaleByOrder = await Sys_payment.aggregate([
                {
                    '$match': {
                        '$and': [
                            { '_s': ObjectID(idDecrypt) },
                            { 'pym.sts': 'settlement' },
                            { 'shp.sts': 'settlement' },
                            { 'pym.stt': { '$lte': time_start } },
                            { 'pym.stt': { '$gte': time_end_double } },
                        ]
                    }
                },
                {
                    '$addFields': {
                        'totalAmount': { '$subtract': ['$mon.amm', { '$add': ['$mon.tsc', '$mon.fee', '$mon.tlo'] }] },
                    }
                },
                {
                    '$facet': {
                        'total_now': [
                            {
                                '$match': {
                                    '$and': [
                                        { 'ep': { '$lte': time_start } },
                                        { 'ep': { '$gte': time_end } },
                                    ]
                                }
                            },
                            {
                                '$addFields': {
                                    'date': {
                                        '$dateToString': {
                                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                            'format': '%Y-%m-%d',
                                            'onNull': '2020-01-01'
                                        }
                                    }
                                }
                            },
                            {
                                '$group': {
                                    '_id': '$date',
                                    'price': { '$sum': '$totalAmount' },
                                    'order': { '$sum': 1 },

                                }
                            },
                            {
                                '$sort': { '_id': 1 }
                            },
                            {
                                '$project': {
                                    'label': 'average',
                                    'x': '$_id',
                                    'y': { '$divide': ['$price', '$order'] },
                                    '_id': 0

                                }
                            }
                        ],
                        'total_double': [
                            {
                                '$match': {
                                    '$and': [
                                        { 'ep': { '$lte': time_start_double } },
                                        { 'ep': { '$gte': time_end_double } },
                                    ]
                                }
                            },
                            {
                                '$addFields': {
                                    'date': {
                                        '$dateToString': {
                                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                            'format': '%Y-%m-%d',
                                            'onNull': '2020-01-01'
                                        }
                                    }
                                }
                            },
                            {
                                '$group': {
                                    '_id': '$date',
                                    'price': { '$sum': '$totalAmount' },
                                    'order': { '$sum': 1 },

                                }
                            },
                            {
                                '$sort': { '_id': 1 }
                            },
                            {
                                '$project': {
                                    'label': 'average',
                                    'x': '$_id',
                                    'y': { '$divide': ['$price', '$order'] },
                                    '_id': 0

                                }
                            }

                        ]
                    }
                },
                {
                    '$addFields': {
                        'data_now': { '$sum': '$total_now.y' },
                        'data_double': { '$sum': '$total_double.y' },
                    }
                },
                {
                    '$project': {
                        'result': '$data_now',
                        'percent': percent_aggregate('$data_now', '$data_double'),
                        'diff_day': range_day_aggregate(time_start, time_end),
                        'statistic': '$total_now',
                        '_id': 0
                    }
                },
            ])

            res.status(200).json(jsonData(statStoreSaleByOrder[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async buyerType(req, res, next) {
        try {
            let { time_start, time_end } = req.query
            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }


            time_start = date2number(time_start)
            time_end = date2number(time_end)

            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)

            const buyerType = await Sys_payment.aggregate(
                [
                    {
                        '$match': {
                            '$and': [
                                { '_s': ObjectID(idDecrypt) },
                                { 'pym.sts': { '$in': ['settlement', 'pending'] } },
                                { 'ep': { '$lte': time_start } },
                                { 'ep': { '$gte': time_end } },
                            ]
                        }
                    },
                    {
                        '$project': {
                            'user_id': '$_u',
                            'store_id': '$_s',
                            'buying_date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                            'item_count': { '$sum': '$dat.qty' }
                        }
                    },
                    {
                        '$facet': {
                            'buyer_new': [
                                {
                                    '$group': {
                                        '_id': {
                                            'u': '$user_id',
                                            's': '$store_id'
                                        },
                                        'buying_date': { '$first': '$buying_date' },
                                        'total_buy': { '$sum': 1 }
                                    }
                                },
                                {
                                    '$match': {
                                        'total_buy': 1
                                    }
                                },
                                {
                                    '$group': {
                                        '_id': '$buying_date',
                                        'total_buy': { '$sum': '$total_buy' }
                                    }
                                },
                                {
                                    '$project': {
                                        'date': '$_id',
                                        'total_buy': '$total_buy',
                                        '_id': 0
                                    }
                                }
                            ],
                            'buyer_reguler': [
                                {
                                    '$group': {
                                        '_id': {
                                            'u': '$user_id',
                                            's': '$store_id'
                                        },
                                        'buying_date': { '$first': '$buying_date' },
                                        'total_buy': { '$sum': 1 }
                                    }
                                },
                                {
                                    '$match': {
                                        'total_buy': { '$gt': 1 }
                                    }
                                },
                                {
                                    '$group': {
                                        '_id': '$buying_date',
                                        'total_buy': { '$sum': '$total_buy' }
                                    }
                                },
                                {
                                    '$project': {
                                        'date': '$_id',
                                        'total_buy': '$total_buy',
                                        '_id': 0
                                    }
                                }

                            ],
                        }
                    },
                    {
                        '$project': {
                            'buyer_new': { '$ifNull': [{ '$sum': '$buyer_new.total_buy' }, { '$toInt': '0' }] },
                            'buyer_reguler': { '$ifNull': [{ '$sum': '$buyer_reguler.total_buy' }, { '$toInt': '0' }], },
                            '_id': 0
                        }
                    }
                ]
            )

            res.status(200).json(jsonData(buyerType[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async buyerGender(req, res, next) {
        try {
            let { time_start, time_end } = req.query
            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }


            time_start = date2number(time_start)
            time_end = date2number(time_end)
            let time_start_double = time_end
            let time_end_double = time_end - (time_start - time_end)

            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)

            const buyerGender = await Sys_payment.aggregate(
                [
                    {
                        '$match': {
                            '$and': [
                                { '_s': ObjectID(idDecrypt) },
                                { 'pym.sts': { '$in': ['settlement', 'pending'] } },
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'users',
                            'localField': '_u',
                            'foreignField': '_id',
                            'pipeline': [
                                {
                                    '$project': {
                                        'gender': { '$ifNull': ['$dat.sex', 'unknown'] },
                                    }
                                },
                            ],
                            'as': 'user',
                        }
                    },
                    {
                        '$addFields': {
                            'gender': { '$first': '$user.gender' }
                        }
                    },
                    {
                        '$facet': {
                            'data_now': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start } },
                                            { 'ep': { '$gte': time_end } },
                                        ]
                                    }
                                },
                                {
                                    '$group': {
                                        '_id': '$gender',
                                        'count_result': { '$sum': 1 }
                                    }
                                },
                                {
                                    '$project': {
                                        'gender': '$_id',
                                        'count': '$count_result',
                                        '_id': 0
                                    }
                                }
                            ],
                            'data_double': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start_double } },
                                            { 'ep': { '$gte': time_end_double } },
                                        ]
                                    }
                                },
                                {
                                    '$group': {
                                        '_id': '$gender',
                                        'count_result': { '$sum': 1 }
                                    }
                                },
                                {
                                    '$project': {
                                        'gender': '$_id',
                                        'count': '$count_result',
                                        '_id': 0
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'male_now': count_gender('$data_now', 'M'),
                            'male_double': count_gender('$data_double', 'M'),
                            'female_now': count_gender('$data_now', 'F'),
                            'female_double': count_gender('$data_double', 'F'),
                            'unknown_now': count_gender('$data_now', 'unknown'),
                            'unknown_double': count_gender('$data_double', 'unknown'),
                        }
                    },
                    {
                        '$addFields': {
                            'maleNow': { '$sum': '$male_now' },
                            'maleDouble': { '$sum': '$male_double' },
                            'femaleNow': { '$sum': '$female_now' },
                            'femaleDouble': { '$sum': '$female_double' },
                            'unknownNow': { '$sum': '$unknown_now' },
                            'unknownDouble': { '$sum': '$unknown_double' },
                        }
                    },
                    {
                        '$addFields': {
                            'percent_male': percent_aggregate('$maleNow', '$maleDouble'),
                            'percent_male': percent_aggregate('$femaleNow', '$femaleDouble'),
                            'percent_male': percent_aggregate('$unknownNow', '$unknownDouble'),
                        }
                    },
                    {
                        '$project': {
                            'male': {
                                'total': '$maleNow',
                                'percent': '$percent_male'
                            },
                            'female': {
                                'total': '$femaleNow',
                                'percent': '$percent_female'
                            },
                            'unknown': {
                                'total': '$unknownNow',
                                'percent': '$percent_unknown'
                            },
                        }
                    }

                ]
            )

            res.status(200).json(jsonData(buyerGender[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async buyerAge(req, res, next) {
        try {
            let { time_start, time_end } = req.query
            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }


            time_start = date2number(time_start)
            time_end = date2number(time_end)

            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)

            const buyerAge = await Sys_payment.aggregate(
                [
                    {
                        '$match': {
                            '$and': [
                                { '_s': ObjectID(idDecrypt) },
                                { 'pym.sts': { '$in': ['settlement', 'pending'] } },
                                { 'ep': { '$lte': time_start } },
                                { 'ep': { '$gte': time_end } },
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'users',
                            'localField': '_u',
                            'foreignField': '_id',
                            'pipeline': [

                                {
                                    '$project': {
                                        'birthday': '$dat.bdy'
                                    }
                                },
                            ],
                            'as': 'user',
                        }
                    },
                    {
                        '$addFields': {
                            'user_birthday': { '$ifNull': [{ '$first': '$user.birthday' }, date2number('')] },
                        }
                    },
                    {
                        '$facet': {
                            'buyer_age': [
                                {
                                    '$addFields': {
                                        'timenow': { '$toDate': { '$multiply': [date2number(''), 1000] } },
                                        'user_birthday': { '$toDate': { '$multiply': ['$user_birthday', 1000] } }
                                    }
                                },
                                {
                                    '$addFields': {
                                        'user_age': {
                                            '$dateDiff': {
                                                'startDate': '$user_birthday',
                                                'endDate': '$timenow',
                                                'unit': 'year'
                                            }
                                        }
                                    }
                                },
                                {
                                    '$group': {
                                        '_id': '$user_age',
                                        'count_result': { '$sum': 1 }
                                    }
                                },
                                {
                                    '$project': {
                                        'age': '$_id',
                                        'count': '$count_result',
                                        '_id': 0
                                    }
                                },
                                {
                                    '$sort': { 'age': 1 }
                                }
                            ]
                        }
                    }
                ]
            )

            res.status(200).json(jsonData(buyerAge[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async productRank(req, res, next) {
        try {
            let { time_start, time_end, page, item_limit, tab } = req.query
            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }


            time_start = date2number(time_start)
            time_end = date2number(time_end)

            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)

            const productSale = await Sys_payment.aggregate(queryPagination(
                [
                    {
                        '$match': {
                            '$and': [
                                { '_s': ObjectID(idDecrypt) },
                                { 'pym.sts': 'settlement' },
                                { 'shp.sts': 'settlement' },
                            ]
                        }
                    },
                    {
                        '$unwind': {
                            'path': '$dat'
                        }
                    },
                    {
                        '$group': {
                            '_id': '$dat._p',
                            'pname': { '$first': '$dat.pn' },
                            'pprice': { '$first': '$dat.prc' },
                            'pqty': { '$sum': '$dat.qty' }

                        }
                    },
                    {
                        '$addFields': {
                            'product_id': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            },
                            'total_price': { '$multiply': ['$pprice', '$pqty'] },
                        }
                    },
                    { '$sort': { 'total_price': -1 } },
                ],
                [
                    {
                        '$project': {
                            'item_id': '$product_id',
                            'item_image': { '$concat': [`${rt_link}store/ip/`, { '$toString': '$product_id' }, '/0'] },
                            'item_name': '$pname',
                            'item_price': '$pprice',
                            'total_price': '$total_price',
                            '_id': 0,
                            'label': 'product sale'

                        }
                    }
                ], page, 3, item_limit
            ))



            const productQuantity = await Sys_payment.aggregate(queryPagination(
                [
                    {
                        '$match': {
                            '$and': [
                                { '_s': ObjectID(idDecrypt) },
                                { 'pym.sts': 'settlement' },
                                { 'shp.sts': 'settlement' },

                            ]
                        }
                    },
                    {
                        '$unwind': {
                            'path': '$dat'
                        }
                    },
                    {
                        '$group': {
                            '_id': '$dat._p',
                            'pname': { '$first': '$dat.pn' },
                            'pprice': { '$first': '$dat.prc' },
                            'ptotal': { '$sum': '$dat.qty' }
                        }
                    },
                    { '$sort': { 'ptotal': -1 } },
                    {
                        '$addFields': {
                            'product_id': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            }
                        }
                    }
                ],
                [
                    {
                        '$project': {
                            'item_id': '$product_id',
                            'item_image': { '$concat': [`${rt_link}store/ip/`, { '$toString': '$product_id' }, '/0'] },
                            'item_name': '$pname',
                            'item_price': '$pprice',
                            'total_quantity': '$ptotal',
                            '_id': 0,
                            'label': 'product quantity'

                        }
                    }
                ], page, 3, item_limit
            ))


            const productSeen = await Sys_products_seen.aggregate(queryPagination(
                [
                    {
                        '$match': {
                            '_s': ObjectID(idDecrypt)
                        }
                    },
                    {
                        '$group': {
                            '_id': '$_p',
                            'total': { '$sum': 1 }
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'stores_products',
                            'localField': '_id',
                            'foreignField': '_id',
                            'pipeline': [
                                {
                                    '$lookup': {
                                        'from': 'stores_products_variants',
                                        'localField': '_id',
                                        'foreignField': '_p',
                                        'pipeline': [
                                            {
                                                '$match': {
                                                    '$and': [
                                                        { 'del': { '$ne': true } },
                                                        { 'man': true }
                                                    ]
                                                }
                                            },
                                            {
                                                '$addFields': {
                                                    'price': { '$first': '$prc.val' }
                                                }
                                            }
                                        ],
                                        'as': 'variant'
                                    }
                                },
                                {
                                    '$addFields': {
                                        'product_name': '$det.nms',
                                        'product_price': { '$first': '$variant.price' }
                                    }
                                }
                            ],
                            'as': 'prod'
                        }
                    },
                    {
                        '$addFields': {
                            'pname': { '$ifNull': [{ '$first': '$prod.product_name' }, 'unkown'] },
                            'pprice': { '$ifNull': [{ '$first': '$prod.product_price' }, { '$toInt': '0' }] },
                        }
                    },
                    { '$sort': { 'total': -1 } },
                    {
                        '$addFields': {
                            'product_id': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            }
                        }
                    }
                ],
                [
                    {
                        '$project': {
                            'item_id': '$product_id',
                            'item_image': { '$concat': [`${rt_link}store/ip/`, { '$toString': '$product_id' }, '/0'] },
                            'item_name': '$pname',
                            'item_price': '$pprice',
                            'total_view': '$total',
                            '_id': 0,
                            'label': 'product sale'
                        }
                    }
                ], page, 3, item_limit
            ))

            if (tab === 'quantity') { res.status(200).json(jsonData(productQuantity[0])) }
            if (tab === 'product_seen') { res.status(200).json(jsonData(productSeen[0])) }
            if (tab === 'product_sale') { res.status(200).json(jsonData(productSale[0])) }

            res.status(200).json(jsonData(productSale[0]))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async productSold(req, res, next) {
        try {
            let { time_start, time_end } = req.query
            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }


            time_start = date2number(time_start)
            time_end = date2number(time_end)
            let time_start_double = time_end
            let time_end_double = time_end - (time_start - time_end)

            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)


            const productSold = await Sys_payment.aggregate(
                [
                    {
                        '$match': {
                            '$and': [
                                { '_s': ObjectID(idDecrypt) },
                                { 'ep': { '$lte': time_start } },
                                { 'ep': { '$gte': time_end_double } },
                                { 'pym.sts': 'settlement' },
                                { 'shp.sts': 'settlement' }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'total': {
                                '$sum': {
                                    '$map': {
                                        'input': '$dat',
                                        'in': '$$this.qty'
                                    }
                                }
                            }
                        }
                    },
                    {
                        '$facet': {
                            'dataNow': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start } },
                                            { 'ep': { '$gte': time_end } }
                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'date': {
                                            '$dateToString': {
                                                'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                                'format': '%Y-%m-%d',
                                                'onNull': '2020-01-01'
                                            }
                                        }
                                    }
                                },
                                {
                                    '$group': {
                                        '_id': '$date',
                                        'order': { '$sum': '$total' }
                                    }
                                },
                                { '$sort': { '_id': 1 } },
                                {
                                    '$project': {
                                        'label': 'total_products_sale',
                                        'x': '$_id',
                                        'y': '$order',
                                        '_id': 0
                                    }
                                }
                            ],
                            'dataDouble': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start_double } },
                                            { 'ep': { '$gte': time_end_double } }
                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'date': {
                                            '$dateToString': {
                                                'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                                'format': '%Y-%m-%d',
                                                'onNull': '2020-01-01'
                                            }
                                        }
                                    }
                                },
                                {
                                    '$project': {
                                        '_id': 0,
                                        'order': { '$sum': '$total' }
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'data_now': { '$sum': '$dataNow.y' },
                            'data_double': { '$sum': '$dataDouble.order' }
                        }
                    },
                    {
                        '$project': {
                            '_id': 0,
                            'total_sale': '$data_now',
                            'percent': percent_aggregate('$data_now', '$data_double'),
                            'diff_days': range_day_aggregate(time_start, time_end),
                            'statistic': '$dataNow',
                        }
                    }
                ]
            )

            res.status(200).json(jsonData(productSold[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async productSeen(req, res, next) {
        try {
            let { time_start, time_end } = req.query
            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }


            time_start = date2number(time_start)
            time_end = date2number(time_end)
            let time_start_double = time_end
            let time_end_double = time_end - (time_start - time_end)

            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)


            const productSeen = await Sys_products_seen.aggregate(chartProductSeen(time_start, time_end, time_start_double, time_end_double, ObjectID, idDecrypt))

            res.status(200).json(jsonData(productSeen[0]))
        } catch (error) {
            console.log(error);
        }
    }


    static async productCart(req, res, next) {
        try {
            let { time_start, time_end } = req.query
            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }


            time_start = date2number(time_start)
            time_end = date2number(time_end)
            let time_start_double = time_end
            let time_end_double = time_end - (time_start - time_end)

            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)

            const productCart = await UserCart.aggregate(
                [
                    {
                        '$match': {
                            '$and': [
                                { '_s': ObjectID(idDecrypt) },
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'date_id': { '$toDecimal': { '$toDate': '$_id' } }
                        }
                    },
                    {
                        '$addFields': {
                            'date_id': { '$round': [{ '$divide': ['$date_id', 1000] }, 4] },
                        }
                    },
                    {
                        '$addFields': {
                            'total_cart': {
                                '$sum': {
                                    '$map': {
                                        'input': '$dat',
                                        'in': '$$this.qty'
                                    }
                                }
                            }
                        }
                    },
                    {
                        '$facet': {
                            'dataNow': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start } },
                                            { 'ep': { '$gte': time_end } }
                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'date': {
                                            '$dateToString': {
                                                'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                                'format': '%Y-%m-%d',
                                                'onNull': '2020-01-01'
                                            }
                                        }
                                    }
                                },
                                {
                                    '$group': {
                                        '_id': '$date',
                                        'chart': { '$sum': '$total_cart' }
                                    }
                                },
                                { '$sort': { '_id': 1 } },
                                {
                                    '$project': {
                                        'label': 'statistic_product_cart',
                                        'x': '$_id',
                                        'y': '$chart',
                                        '_id': 0
                                    }
                                }
                            ],
                            'dataDouble': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start_double } },
                                            { 'ep': { '$gte': time_end_double } }
                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'date': {
                                            '$dateToString': {
                                                'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                                'format': '%Y-%m-%d',
                                                'onNull': '2020-01-01'
                                            }
                                        }
                                    }
                                },
                                {
                                    '$project': {
                                        '_id': 0,
                                        'cart': { '$sum': '$total_cart' }
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'data_now': { '$sum': '$dataNow.y' },
                            'data_double': { '$sum': '$dataDouble.cart' }
                        }
                    },
                    {
                        '$project': {
                            '_id': 0,
                            'total_cart': '$data_now',
                            'percent': percent_aggregate('$data_now', '$data_double'),
                            'diff_days': range_day_aggregate(time_start, time_end),
                            'statistic': '$dataNow',
                        }
                    }
                ]
            )
            res.status(200).json(jsonData(productCart[0]))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async voucherSold(req, res, next) {
        try {
            let { time_start, time_end } = req.query
            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }


            time_start = date2number(time_start)
            time_end = date2number(time_end)
            let time_start_double = time_end
            let time_end_double = time_end - (time_start - time_end)

            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)

            const voucherSold = await Sys_voucher.aggregate(
                [
                    {
                        '$match': {
                            '$and': [
                                { '_s': ObjectID(idDecrypt) },
                                { 'pym.sts': 'settlement' }
                            ]
                        }
                    },
                    {
                        '$facet': {
                            'dataNow': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start } },
                                            { 'ep': { '$gte': time_end } }
                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'date': {
                                            '$dateToString': {
                                                'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                                'format': '%Y-%m-%d',
                                                'onNull': '2020-01-01'
                                            }
                                        }
                                    }
                                },
                                {
                                    '$group': {
                                        '_id': '$date',
                                        'voucher_bought': { '$sum': 1 }
                                    }
                                },
                                { '$sort': { '_id': 1 } },
                                {
                                    '$project': {
                                        'label': 'statistic_voucher_sold',
                                        'x': '$_id',
                                        'y': '$voucher_bought',
                                        '_id': 0
                                    }
                                }
                            ],
                            'dataDouble': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start_double } },
                                            { 'ep': { '$gte': time_end_double } }
                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'date': {
                                            '$dateToString': {
                                                'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                                'format': '%Y-%m-%d',
                                                'onNull': '2020-01-01'
                                            }
                                        }
                                    }
                                },
                                {
                                    '$project': {
                                        '_id': 0,
                                        'voucher_bought': { '$sum': 1 }
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'data_now': { '$sum': '$dataNow.y' },
                            'data_double': { '$sum': '$dataDouble.voucher_bought' }
                        }
                    },
                    {
                        '$project': {
                            '_id': 0,
                            'voucher_bought': '$data_now',
                            'percent': percent_aggregate('$data_now', '$data_double'),
                            'diff_days': range_day_aggregate(time_start, time_end),
                            'statistic': '$dataNow',
                        }
                    }
                ]
            )
            res.status(200).json(jsonData(voucherSold[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async voucherUsed(req, res, next) {
        try {
            let { time_start, time_end } = req.query
            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }


            time_start = date2number(time_start)
            time_end = date2number(time_end)
            let time_start_double = time_end
            let time_end_double = time_end - (time_start - time_end)

            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)

            const voucherUsed = await Sys_voucher.aggregate(
                [
                    {
                        '$addFields': {
                            'used': { '$size': '$isu' }
                        }
                    },
                    {
                        '$addFields': {
                            'cek_used': {
                                '$cond': {
                                    'if': { '$gte': ['$used', 1] },
                                    'then': true,
                                    'else': false
                                }
                            }
                        }
                    },
                    {
                        '$match': {
                            '$and': [
                                { '_s': ObjectID(idDecrypt) },
                                { 'cek_used': true }
                            ]
                        }
                    },
                    {
                        '$facet': {
                            'dataNow': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start } },
                                            { 'ep': { '$gte': time_end } }
                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'date': {
                                            '$dateToString': {
                                                'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                                'format': '%Y-%m-%d',
                                                'onNull': '2020-01-01'
                                            }
                                        }
                                    }
                                },
                                {
                                    '$group': {
                                        '_id': '$date',
                                        'voucher_used': { '$sum': 1 }
                                    }
                                },
                                { '$sort': { '_id': 1 } },
                                {
                                    '$project': {
                                        'label': 'statistic_voucher_used',
                                        'x': '$_id',
                                        'y': '$voucher_used',
                                        '_id': 0
                                    }
                                }
                            ],
                            'dataDouble': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start_double } },
                                            { 'ep': { '$gte': time_end_double } }
                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'date': {
                                            '$dateToString': {
                                                'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                                'format': '%Y-%m-%d',
                                                'onNull': '2020-01-01'
                                            }
                                        }
                                    }
                                },
                                {
                                    '$project': {
                                        '_id': 0,
                                        'voucher_used': { '$sum': 1 }
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'data_now': { '$sum': '$dataNow.y' },
                            'data_double': { '$sum': '$dataDouble.voucher_used' }
                        }
                    },
                    {
                        '$project': {
                            '_id': 0,
                            'voucher_used': '$data_now',
                            'percent': percent_aggregate('$data_now', '$data_double'),
                            'diff_days': range_day_aggregate(time_start, time_end),
                            'statistic': '$dataNow',
                        }
                    }
                ]
            )
            res.status(200).json(jsonData(voucherUsed[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async voucherSale(req, res, next) {
        try {
            let { time_start, time_end } = req.query
            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }


            time_start = date2number(time_start)
            time_end = date2number(time_end)
            let time_start_double = time_end
            let time_end_double = time_end - (time_start - time_end)

            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)

            const voucherSale = await Sys_voucher.aggregate(
                [
                    {
                        '$match': { '_s': ObjectID(idDecrypt) },

                    },
                    {
                        '$facet': {
                            'dataNow': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start } },
                                            { 'ep': { '$gte': time_end } }
                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'date': {
                                            '$dateToString': {
                                                'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                                'format': '%Y-%m-%d',
                                                'onNull': '2020-01-01'
                                            }
                                        }
                                    }
                                },
                                {
                                    '$group': {
                                        '_id': '$date',
                                        'voucher_sale': { '$sum': '$prc' }
                                    }
                                },
                                { '$sort': { '_id': 1 } },
                                {
                                    '$project': {
                                        'label': 'statistic_voucher_sale',
                                        'x': '$_id',
                                        'y': '$voucher_sale',
                                        '_id': 0
                                    }
                                }
                            ],
                            'dataDouble': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start_double } },
                                            { 'ep': { '$gte': time_end_double } }
                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'date': {
                                            '$dateToString': {
                                                'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                                'format': '%Y-%m-%d',
                                                'onNull': '2020-01-01'
                                            }
                                        }
                                    }
                                },
                                {
                                    '$project': {
                                        '_id': 0,
                                        'voucher_sale': { '$sum': '$prc' }
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'data_now': { '$sum': '$dataNow.y' },
                            'data_double': { '$sum': '$dataDouble.voucher_sale' }
                        }
                    },
                    {
                        '$project': {
                            '_id': 0,
                            'voucher_sale': '$data_now',
                            'percent': percent_aggregate('$data_now', '$data_double'),
                            'diff_days': range_day_aggregate(time_start, time_end),
                            'statistic': '$dataNow',
                        }
                    }
                ]
            )
            res.status(200).json(jsonData(voucherSale[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async voucherTable(req, res, next) {
        try {
            let { time_start, time_end, page, item_limit, tab } = req.query
            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }


            time_start = date2number(time_start)
            time_end = date2number(time_end)

            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)

            const listSale = await Sys_voucher.aggregate(queryPagination(
                [
                    {
                        '$match': {
                            '$and': [
                                { '_s': ObjectID(idDecrypt) },
                                { 'ep': { '$lte': time_start } },
                                { 'ep': { '$gte': time_end } }
                            ]
                        }
                    },
                    {
                        '$group': {
                            '_id': '$_vc',
                            'vname': { '$first': '$vn' },
                            'total_sale': { '$sum': '$prc' }
                        }
                    },
                    {
                        '$addFields': {
                            'item_id': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            }
                        }
                    }
                ],
                [
                    {
                        '$project': {
                            'voucher_id': '$item_id',
                            'voucher_name': '$vname',
                            'total_sale': '$total_sale',
                            '_id': 0
                        }
                    },
                    {
                        '$sort': { 'total_sale': -1 }
                    }
                ], page, 3, item_limit
            ))


            const listUsed = await Sys_voucher.aggregate(queryPagination(
                [
                    {
                        '$addFields': {
                            'is_used': {
                                '$cond': {
                                    'if': { '$gte': [{ '$size': '$isu' }, 1] },
                                    'then': true,
                                    'else': false
                                }
                            }
                        }
                    },
                    {
                        '$match': {
                            '$and': [
                                { '_s': ObjectID(idDecrypt) },
                                { 'ep': { '$lte': time_start } },
                                { 'ep': { '$gte': time_end } },
                                { 'is_used': true }
                            ]
                        }
                    },
                    {
                        '$group': {
                            '_id': '$_vc',
                            'vname': { '$first': '$vn' },
                            'total_sale': { '$sum': '$qty' }
                        }
                    },
                    {
                        '$addFields': {
                            'item_id': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            }
                        }
                    }
                ],
                [
                    {
                        '$project': {
                            'voucher_id': '$item_id',
                            'voucher_name': '$vname',
                            'total_sale': '$total_sale',
                            '_id': 0
                        }
                    },
                    {
                        '$sort': { 'total_sale': -1 }
                    }
                ], page, 3, item_limit
            ))

            if (tab === 'sale') { res.status(200).json(jsonData(listSale[0])) }

            if (tab === 'used') { res.status(200).json(jsonData(listUsed[0])) }


            res.status(200).json(jsonData(listSale[0]))


        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async summaryBex(req, res, next) {
        try {
            let { time_start, time_end } = req.query
            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }


            time_start = date2number(time_start)
            time_end = date2number(time_end)
            let time_start_double = time_end
            let time_end_double = time_end - (time_start - time_end)

            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)

            const summaryBex = await Doctor.aggregate(
                [
                    {
                        '$match': {
                            '$and': [
                                { '_s': ObjectID(idDecrypt) },
                                { 'doc.isd': false }
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'doctors_chats',
                            'localField': '_id',
                            'foreignField': '_d',
                            'pipeline': [
                                {
                                    '$match': { 'scr': { '$nin': [null, 0] } }
                                },
                                {
                                    '$facet': {
                                        'consulA': [
                                            {
                                                '$match': {
                                                    '$and': [
                                                        { 'ep': { '$lte': time_start } },
                                                        { 'ep': { '$gte': time_end } }
                                                    ]
                                                }
                                            },
                                            {
                                                '$addFields': {
                                                    'date': {
                                                        '$dateToString': {
                                                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                                            'format': '%Y-%m-%d',
                                                            'onNull': '2020-01-01'
                                                        }
                                                    }
                                                }
                                            },
                                            {
                                                '$group': {
                                                    '_id': '$date',
                                                    'value': { '$sum': 1 }
                                                }
                                            },
                                            { '$sort': { '_id': 1 } },
                                            {
                                                '$project': {
                                                    'label': 'consul',
                                                    'x': '$_id',
                                                    'y': '$value',
                                                    '_id': 0
                                                }
                                            }
                                        ],
                                        'consulB': [
                                            {
                                                '$match': {
                                                    '$and': [
                                                        { 'ep': { '$lte': time_start_double } },
                                                        { 'ep': { '$gte': time_end_double } }
                                                    ]
                                                }
                                            },
                                            {
                                                '$addFields': {
                                                    'date': {
                                                        '$dateToString': {
                                                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                                            'format': '%Y-%m-%d',
                                                            'onNull': '2020-01-01'
                                                        }
                                                    }
                                                }
                                            },
                                            {
                                                '$group': {
                                                    '_id': '$date',
                                                    'value': { '$sum': 1 }
                                                }
                                            },
                                            {
                                                '$project': {
                                                    'y': '$value',
                                                    '_id': 0
                                                }
                                            }
                                        ],
                                        'ratingA': [
                                            {
                                                '$match': {
                                                    '$and': [
                                                        { 'ep': { '$lte': time_start } },
                                                        { 'ep': { '$gte': time_end } }
                                                    ]
                                                }
                                            },
                                            {
                                                '$addFields': {
                                                    'date': {
                                                        '$dateToString': {
                                                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                                            'format': '%Y-%m-%d',
                                                            'onNull': '2020-01-01'
                                                        }
                                                    }
                                                }
                                            },
                                            {
                                                '$group': {
                                                    '_id': '$date',
                                                    'value': { '$sum': '$scr' }
                                                }
                                            },
                                            { '$sort': { '_id': 1 } },
                                            {
                                                '$project': {
                                                    'label': 'rating',
                                                    'x': '$_id',
                                                    'y': '$value',
                                                    '_id': 0
                                                }
                                            }
                                        ],
                                        'ratingB': [
                                            {
                                                '$match': {
                                                    '$and': [
                                                        { 'ep': { '$lte': time_start_double } },
                                                        { 'ep': { '$gte': time_end_double } }
                                                    ]
                                                }
                                            },
                                            {
                                                '$addFields': {
                                                    'date': {
                                                        '$dateToString': {
                                                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                                            'format': '%Y-%m-%d',
                                                            'onNull': '2020-01-01'
                                                        }
                                                    }
                                                }
                                            },
                                            {
                                                '$group': {
                                                    '_id': '$date',
                                                    'value': { '$sum': '$scr' }
                                                }
                                            },
                                            { '$sort': { '_id': 1 } },
                                            {
                                                '$project': {
                                                    'y': '$value',
                                                    '_id': 0
                                                }
                                            }
                                        ],
                                        'average': [
                                            {
                                                '$group': {
                                                    '_id': '$_d',
                                                    'score': { '$sum': '$scr' },
                                                    'consult': { '$sum': 1 }
                                                }
                                            },
                                            {
                                                '$project': {
                                                    '_id': '$_id',
                                                    'avg': { '$divide': ['$score', '$consult'] },
                                                    'consult': '$consult',
                                                    'rating': '$score'
                                                }
                                            },
                                            { '$sort': { 'avg': -1 } }
                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'doctor_id': { '$ifNull': [{ '$first': '$average._id' }, '-'] }
                                    }
                                },
                                {
                                    '$addFields': {
                                        'stat_consult': '$consulA',
                                        'total_consult_a': { '$sum': '$consulA.y' },
                                        'total_consult_b': { '$sum': '$consulB.y' },
                                        'stat_rating': '$ratingA',
                                        'total_rating_a': { '$sum': '$ratingA.y' },
                                        'total_rating_b': { '$sum': '$ratingB.y' },
                                        'rats': { '$ifNull': [{ '$first': '$average.avg' }, { '$toInt': '0' }] },
                                        'doctor': {
                                            'rata_doctor': { '$ifNull': [{ '$first': '$average.avg' }, { '$toInt': '0' }] },
                                            'doctor_id': '$doctor_id'
                                        }
                                    }
                                },
                                {
                                    '$project': {
                                        'stat_consult': '$stat_consult',
                                        'total_consult': '$total_consult_a',
                                        'percent_consult': percent_aggregate('$total_consult_a', '$total_consult_b'),

                                        'stat_rating': '$stat_rating',
                                        'total_rating': '$total_rating_a',
                                        'percent_rating': percent_aggregate('$total_rating_a', '$total_rating_b'),

                                        'diff_day': range_day_aggregate(time_start, time_end),

                                        'rating': '$rats',
                                        'doctor': '$doctor',
                                        '_id': 0
                                    }
                                }
                            ],
                            'as': 'result'
                        },
                    },
                    {
                        '$unwind': {
                            'path': '$result'
                        }
                    },
                    {
                        '$facet': {
                            'diff_day': [
                                {
                                    '$project': {
                                        'result': '$result.diff_day',
                                        '_id': 0
                                    }
                                }
                            ],
                            'stat_rating': [
                                {
                                    '$project': {
                                        'result': '$result.rating'
                                    }
                                }
                            ],
                            'consult': [
                                {
                                    '$project': {
                                        'stat_consult': '$result.stat_consult',
                                        'total_consult': '$result.total_consult',
                                        'percent': '$result.percent_consult',
                                        'diff_day': '$result.diff_day',
                                        '_id': 0
                                    }
                                }
                            ],
                            'rating': [
                                {
                                    '$project': {
                                        'stat_rating': '$result.stat_rating',
                                        'total_rating': '$result.total_rating',
                                        'percent': '$result.percent_rating',
                                        'diff_day': '$result.diff_day',
                                        '_id': 0
                                    }
                                }
                            ],
                            'doctor': [
                                {
                                    '$addFields': {
                                        'username': '$dat.usr',
                                        'doctor_id': {
                                            '$function': {
                                                'body': encrypt,
                                                'args': [{ '$toString': '$_id' }, 12],
                                                'lang': 'js'
                                            }
                                        }
                                    }
                                },
                                {
                                    '$project': {
                                        'doctor_id': '$doctor_id',
                                        'rating': '$result.doctor.rata_doctor',
                                        'specialist': '$doc.fld',
                                        'doctor_image': { '$concat': [`${rt_link}doctor/chat/embed/avatar/`, '$doctor_id'] },
                                        'fullname': {
                                            '$reduce': {
                                                'input': '$dat.fln',
                                                'initialValue': '',
                                                'in': {
                                                    '$concat': [
                                                        '$$value',
                                                        { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                                        '$$this'
                                                    ]
                                                }
                                            }
                                        },
                                        '_id': 0
                                    }
                                },
                                { '$sort': { 'rating': -1 } }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'rating': { '$round': [{ '$avg': '$stat_rating.result' }, 1] },
                            'stat_consult': {
                                '$reduce': {
                                    'input': '$consult',
                                    'initialValue': [],
                                    'in': {
                                        '$concatArrays': [
                                            '$$value',
                                            '$$this.stat_consult'
                                        ]
                                    }
                                }
                            },
                            'total_consult': { '$sum': '$consult.total_consult' },
                            'percent_consult': { '$round': [{ '$avg': '$consult.percent' }, 1] },
                            'stat_rating': {
                                '$reduce': {
                                    'input': '$rating',
                                    'initialValue': [],
                                    'in': {
                                        '$concatArrays': [
                                            '$$value',
                                            '$$this.stat_rating'
                                        ]
                                    }
                                },
                            },
                            'total_rating': { '$sum': '$rating.total_rating' },
                            'percent_rating': { '$round': [{ '$avg': '$rating.percent' }, 1] },
                            'diff_day': { '$first': '$diff_day.result' }
                        }
                    },
                    {
                        '$addFields': {
                            'rate_overall': '$rating',
                            'doctor': { '$first': '$doctor' },
                            'statistic_rating': '$stat_rating',
                            'total_rating': '$total_rating',
                            'percent_rating': '$percent_rating',
                            'statistic_consult': '$stat_consult',
                            'total_consult': '$total_consult',
                            'percent': '$diff_percent_consult',
                            'diff_days': '$diff_day',
                        }
                    },
                    {
                        '$addFields': {
                            'doctor_id': '$doctor.doctor_id'
                        }
                    },
                    {
                        '$addFields': {
                            'doctor_id': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': { '$ifNull': ['$doctor_id', ''] } }, 12],
                                    'lang': 'js'
                                }
                            },
                        }
                    },
                    {
                        '$addFields': {
                            'doctor_id': {
                                '$switch': {
                                    'branches': [
                                        { 'case': { '$ne': ['$doctor_id', ''] }, 'then': '$doctor_id' }
                                    ],
                                    'default': null
                                }
                            }
                        }
                    },
                    {
                        '$addFields': {
                            'doctor': {
                                'doctor_id': '$doctor_id',
                                'username': '$doctor.username',
                                'fullname': '$doctor.fullname',
                                'specialist': '$doctor.specialist',
                                'rate_doctor': '$doctor.rata_doctor'
                            }
                        }
                    },
                    {
                        '$project': {
                            'average_rating': '$rating',
                            'doctor': '$doctor',
                            'statistic_rating': '$statistic_rating',
                            'total_rating': '$total_rating',
                            'percent_rating': '$percent_rating',
                            'statistic_consult': '$statistic_consult',
                            'total_consult': '$total_consult',
                            'percent_consult': '$percent_consult',
                            'diff_days': '$diff_days',
                            '_id': 0
                        }
                    }
                ]
            )

            res.status(200).json(jsonData(summaryBex[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async tableBex(req, res, next) {
        try {
            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)

            const { page, item_limit } = req.query

            const tableBex = await Doctor.aggregate(queryPagination(
                [
                    {
                        '$match': {
                            '$and': [
                                { '_s': ObjectID(idDecrypt) },
                                { 'doc.isd': false },
                                { 'dat.act': true }
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'doctors_chats',
                            'localField': '_id',
                            'foreignField': '_d',
                            'pipeline': [
                                {
                                    '$group': {
                                        '_id': '$_d',
                                        'total': { '$sum': 1 },
                                        'rating': { '$sum': '$scr' },
                                    }
                                },
                                {
                                    '$project': {
                                        'total': '$total',
                                        'rating': '$rating',
                                        '_id': 0
                                    }
                                },
                                { '$sort': { 'total': -1 } }
                            ],
                            'as': 'consult'
                        }
                    },
                    {
                        '$unwind': {
                            'path': '$consult',
                            'preserveNullAndEmptyArrays': true
                        }
                    },
                    {
                        '$addFields': {
                            'doctor_id': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            },
                            'fullname': {
                                '$reduce': {
                                    'input': '$dat.fln',
                                    'initialValue': '',
                                    'in': {
                                        '$concat': [
                                            '$$value',
                                            { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                            '$$this'
                                        ]
                                    }
                                }
                            },
                            'username': '$dat.usr',
                            'total_consult': { '$ifNull': ['$consult.total', { '$toInt': '0' }] },
                            'rating': { '$ifNull': ['$consult.rating', { '$toInt': '0' }] },
                        }
                    }
                ],
                [
                    {
                        '$project': {
                            'doctor_id': '$doctor_id',
                            'fullname': '$fullname',
                            'username': '$username',
                            'bex_image': { '$concat': [`${rt_link}doctor/chat/embed/avatar/`, '$doctor_id'] },
                            'total_consult': '$total_consult',
                            'rating': '$rating',
                            '_id': 0
                        }
                    }
                ], page, 3, item_limit
            ))

            res.status(200).json(jsonData(tableBex[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async summaryDoctor(req, res, next) {
        try {
            let { time_start, time_end } = req.query
            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }


            time_start = date2number(time_start)
            time_end = date2number(time_end)
            let time_start_double = time_end
            let time_end_double = time_end - (time_start - time_end)

            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)

            const summaryDoctor = await Doctor.aggregate(
                [
                    {
                        '$match': {
                            '$and': [
                                { '_s': ObjectID(idDecrypt) },
                                { 'doc.isd': true }
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'sys_doctors',
                            'localField': '_id',
                            'foreignField': '_d',
                            'pipeline': [
                                {
                                    '$addFields': {
                                        'date_id': { '$toDecimal': { '$toDate': '$_id' } }
                                    }
                                },
                                {
                                    '$addFields': {
                                        'date_id': { '$round': [{ '$divide': ['$date_id', 1000] }, 4] },
                                    }
                                },
                                {
                                    '$facet': {
                                        'data_now': [
                                            {
                                                '$match': {
                                                    '$and': [
                                                        { 'date_id': { '$lte': time_start } },
                                                        { 'date_id': { '$gte': time_end } },
                                                        { 'pym.sts': 'settlement' }
                                                    ]
                                                }
                                            },
                                            {
                                                '$addFields': {
                                                    'date': {
                                                        '$dateToString': {
                                                            'date': { '$toDate': { '$multiply': ['$date_id', 1000] } },
                                                            'format': '%Y-%m-%d',
                                                            'onNull': '2020-01-01'
                                                        }
                                                    }
                                                }
                                            },
                                            {
                                                '$group': {
                                                    '_id': '$date',
                                                    'value': { '$sum': '$mon.amr' }
                                                }
                                            },
                                            { '$sort': { '_id': 1 } },
                                            {
                                                '$project': {
                                                    'label': 'statistic_consult',
                                                    'x': '$_id',
                                                    'y': '$value',
                                                    '_id': 0
                                                }
                                            }
                                        ],
                                        'data_double': [
                                            {
                                                '$match': {
                                                    '$and': [
                                                        { 'ep': { '$lte': time_start_double } },
                                                        { 'ep': { '$gte': time_end_double } },
                                                        { 'pym.sts': 'settlement' }

                                                    ]
                                                }
                                            },
                                            {
                                                '$addFields': {
                                                    'date': {
                                                        '$dateToString': {
                                                            'date': { '$toDate': { '$multiply': ['$date_id', 1000] } },
                                                            'format': '%Y-%m-%d',
                                                            'onNull': '2020-01-01'
                                                        }
                                                    }
                                                }
                                            },
                                            {
                                                '$group': {
                                                    '_id': '$date',
                                                    'value': { '$sum': '$mon.amr' }
                                                }
                                            },
                                            {
                                                '$project': {
                                                    'y': '$value',
                                                    '_id': 0
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'dataA': { '$sum': '$data_now.y' },
                                        'dataB': { '$sum': '$data_double.b' }
                                    }
                                },
                                {
                                    '$addFields': {
                                        'percent': percent_aggregate('$dataA', '$dataB'),
                                        'diffDays': range_day_aggregate(time_start, time_end)
                                    }
                                }
                            ],
                            'as': 'income_doc'
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'doctors_chats',
                            'localField': '_id',
                            'foreignField': '_d',
                            'pipeline': [
                                {
                                    '$match': { 'scr': { '$nin': [null, 0] } }
                                },
                                {
                                    '$facet': {
                                        'consult_a': [
                                            {
                                                '$match': {
                                                    '$and': [
                                                        { 'ep': { '$lte': time_start } },
                                                        { 'ep': { '$gte': time_end } },
                                                        { 'end': true }
                                                    ]
                                                }
                                            },
                                            {
                                                '$addFields': {
                                                    'date': {
                                                        '$dateToString': {
                                                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                                            'format': '%Y-%m-%d',
                                                            'onNull': '2020-01-01'
                                                        }
                                                    }
                                                }
                                            },
                                            {
                                                '$group': {
                                                    '_id': '$date',
                                                    'value': { '$sum': 1 }
                                                }
                                            },
                                            { '$sort': { '_id': 1 } },
                                            {
                                                '$project': {
                                                    'label': 'statistic_consult',
                                                    'x': '$_id',
                                                    'y': '$value',
                                                    '_id': 0
                                                }
                                            }
                                        ],
                                        'consult_b': [
                                            {
                                                '$match': {
                                                    '$and': [
                                                        { 'ep': { '$lte': time_start_double } },
                                                        { 'ep': { '$gte': time_end_double } },
                                                        { 'end': true }

                                                    ]
                                                }
                                            },
                                            {
                                                '$addFields': {
                                                    'date': {
                                                        '$dateToString': {
                                                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                                            'format': '%Y-%m-%d',
                                                            'onNull': '2020-01-01'
                                                        }
                                                    }
                                                }
                                            },
                                            {
                                                '$group': {
                                                    '_id': '$date',
                                                    'value': { '$sum': 1 }
                                                }
                                            },
                                            {
                                                '$project': {
                                                    'y': '$value',
                                                    '_id': 0
                                                }
                                            }
                                        ],
                                        'rating_a': [
                                            {
                                                '$match': {
                                                    '$and': [
                                                        { 'ep': { '$lte': time_start } },
                                                        { 'ep': { '$gte': time_end } },
                                                        { 'end': true }

                                                    ]
                                                }
                                            },
                                            {
                                                '$addFields': {
                                                    'date': {
                                                        '$dateToString': {
                                                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                                            'format': '%Y-%m-%d',
                                                            'onNull': '2020-01-01'
                                                        }
                                                    }
                                                }
                                            },
                                            {
                                                '$group': {
                                                    '_id': '$date',
                                                    'value': { '$sum': '$scr' }
                                                }
                                            },
                                            { '$sort': { '_id': 1 } },
                                            {
                                                '$project': {
                                                    'label': 'statistic_consult',
                                                    'x': '$_id',
                                                    'y': '$value',
                                                    '_id': 0
                                                }
                                            }
                                        ],
                                        'rating_b': [
                                            {
                                                '$match': {
                                                    '$and': [
                                                        { 'ep': { '$lte': time_start_double } },
                                                        { 'ep': { '$gte': time_end_double } },
                                                        { 'end': true }

                                                    ]
                                                }
                                            },
                                            {
                                                '$addFields': {
                                                    'date': {
                                                        '$dateToString': {
                                                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                                            'format': '%Y-%m-%d',
                                                            'onNull': '2020-01-01'
                                                        }
                                                    }
                                                }
                                            },
                                            {
                                                '$group': {
                                                    '_id': '$date',
                                                    'value': { '$sum': '$scr' }
                                                }
                                            },
                                            {
                                                '$project': {
                                                    'y': '$value',
                                                    '_id': 0
                                                }
                                            }
                                        ],
                                        'rata_rata': [
                                            {
                                                '$group': {
                                                    '_id': '$_d',
                                                    'score': { '$sum': '$scr' },
                                                    'consult': { '$sum': 1 }
                                                }
                                            },
                                            {
                                                '$project': {
                                                    '_id': '$_id',
                                                    'avg_aja': { '$divide': ['$score', '$consult'] },
                                                    'consult': '$consult',
                                                    'rating': '$score'
                                                }
                                            },
                                            { '$sort': { 'avg_aja': -1 } }
                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'doctor_id': { '$first': '$rata_rata._id' }
                                    }
                                },
                                {
                                    '$addFields': {
                                        'stat_consult': '$consult_a',
                                        'total_consult_a': { '$sum': '$consult_a.y' },
                                        'total_consult_b': { '$sum': '$consult_b.y' },
                                        'stat_rating': '$rating_a',
                                        'total_rating_a': { '$sum': '$rating_a.y' },
                                        'total_rating_b': { '$sum': '$rating_b.y' },
                                        'rats': { '$ifNull': [{ '$avg': '$rata_rata.avg_aja' }, { '$toInt': '0' }] },
                                        'doctor': {
                                            'rata_doctor': { '$ifNull': [{ '$first': '$rata_rata.avg_aja' }, { '$toInt': '0' }] },
                                            'doctor_id': '$doctor_id'
                                        }
                                    }
                                },
                                {
                                    '$project': {
                                        'stat_consult': '$stat_consult',
                                        'total_consult': '$total_consult_a',
                                        'percent_consult': percent_aggregate('$total_consult_a', '$total_consult_b'),

                                        'stat_rating': '$stat_rating',
                                        'total_rating': '$total_rating_a',
                                        'percent_rating': percent_aggregate('$total_rating_a', '$total_rating_b'),

                                        'diffDays': range_day_aggregate(time_start, time_end),
                                        'rats': '$rats',
                                        'doctor': '$doctor',
                                        '_id': 0
                                    }
                                }
                            ],
                            'as': 'chat'
                        }
                    },
                    {
                        '$unwind': {
                            'path': '$chat'
                        }
                    },
                    {
                        '$unwind': {
                            'path': '$income_doc'
                        }
                    },
                    {
                        '$facet': {
                            'total_sys': [
                                {
                                    '$project': {
                                        'stat_sys_doctor': '$income_doc.data_now',
                                        'total_sys_doctor': '$income_doc.dataA',
                                        'diff_percent_sys': '$income_doc.percent',
                                        '_id': 0
                                    }
                                }
                            ],
                            'days_compare': [
                                {
                                    '$project': {
                                        'days_compare': '$chat.diffDays',
                                        '_id': 0
                                    }
                                }
                            ],
                            'rats_overall': [
                                {
                                    '$match': { 'chat.rats': { '$gt': 0 } }
                                },
                                {
                                    '$project': {
                                        'rats': '$chat.rats',
                                    }
                                }
                            ],
                            'consult': [
                                {
                                    '$project': {
                                        'stat_consult': '$chat.stat_consult',
                                        'total_consult': '$chat.total_consult',
                                        'percent_consult': '$percent_consult',
                                        'diffDays': '$chat.diffDays',
                                        '_id': 0
                                    }
                                }
                            ],
                            'rating': [
                                {
                                    '$project': {
                                        'stat_rating': '$chat.stat_rating',
                                        'total_rating': '$chat.total_rating',
                                        'percent_rating': '$percent_rating',
                                        'diffDays': '$chat.diffDays',
                                        '_id': 0
                                    }
                                }
                            ],
                            'doctor': [
                                {
                                    '$addFields': {
                                        'username': '$dat.usr',
                                        'doctor_id': {
                                            '$function': {
                                                'body': encrypt,
                                                'args': [{ '$toString': '$_id' }, 12],
                                                'lang': 'js'
                                            }
                                        },
                                    }
                                },
                                {
                                    '$project': {
                                        'doctor_id': '$doctor_id',
                                        'rata_doctor': '$chat.doctor.rata_doctor',
                                        'specialist': '$doc.fld',
                                        'username': '$username',
                                        'fullname': {
                                            '$reduce': {
                                                'input': '$dat.fln',
                                                'initialValue': '',
                                                'in': {
                                                    '$concat': [
                                                        '$$value',
                                                        { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                                        '$$this'
                                                    ]
                                                }
                                            }
                                        },
                                        '_id': 0
                                    }
                                },
                                { '$sort': { 'rata_doctor': -1 } }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'stat_sys_doc': {
                                '$reduce': {
                                    'input': '$total_sys',
                                    'initialValue': [],
                                    'in': {
                                        '$concatArrays': [
                                            '$$value',
                                            '$$this.stat_sys_doctor'
                                        ]
                                    }
                                }
                            },
                            'total_sys_doc': { '$sum': '$total_sys.total_sys_doctor' },
                            'percent_doctor': { '$sum': '$total_sys.diff_percent_sys' },
                            'rats_overall': { '$avg': '$rats_overall.rats' },
                            'stat_consult': {
                                '$reduce': {
                                    'input': '$consult',
                                    'initialValue': [],
                                    'in': {
                                        '$concatArrays': [
                                            '$$value',
                                            '$$this.stat_consult'
                                        ]
                                    }
                                }
                            },
                            'total_consult': { '$sum': '$consult.total_consult' },
                            'percent_consult': { '$avg': '$consult.percent_consult' },
                            'stat_rating': {
                                '$reduce': {
                                    'input': '$rating',
                                    'initialValue': [],
                                    'in': {
                                        '$concatArrays': [
                                            '$$value',
                                            '$$this.stat_rating'
                                        ]
                                    }
                                },
                            },
                            'total_rating': { '$sum': '$rating.total_rating' },
                            'percent_rating': { '$avg': '$rating.percent_rating' },
                            'days_compare': { '$first': '$days_compare.days_compare' }
                        }
                    },
                    {
                        '$addFields': {
                            'rate_overall': '$rats_overall',
                            'doctor': { '$first': '$doctor' },
                            'statistic_rating': '$stat_rating',
                            'total_rating': '$total_rating',
                            'percent_rating': '$percent_rating',
                            'statistic_consult': '$stat_consult',
                            'total_consult': '$total_consult',
                            'percent_consult': '$percent_consult',
                            'diff_days': '$days_compare',
                            'stat_sys_doc': '$stat_sys_doc',
                            'total_sys_doc': '$total_sys_doc',
                            'percent_doctor': '$percent_doctor'
                        }
                    },
                    {
                        '$addFields': {
                            'doctorResult': {
                                'doctor_id': '$doctor.doctor_id',
                                'username': '$doctor.username',
                                'fullname': '$doctor.fullname',
                                'image': { '$concat': [`${rt_link}doctor/chat/embed/avatar/`, '$doctor.doctor_id'] },
                                'specialist': '$doctor.specialist',
                                'rate_doctor': '$doctor.rata_doctor'
                            }
                        }
                    },
                    {
                        '$project': {
                            'average_rating': { '$round': ['$rate_overall', 2] },
                            'doctor': '$doctorResult',
                            'statistic_income': '$statistic_rating',
                            'total_income': '$total_rating',
                            'percent_income': '$percent_rating',
                            'statistic_consult': '$statistic_consult',
                            'total_consult': '$total_consult',
                            'percent_consult': '$percent_consult',
                            'rating_consult': '$rating_consult',
                            'diff_days': '$diff_days',
                            'statistic_total_sale': '$stat_sys_doc',
                            'total_sale': '$total_sys_doc',
                            'percent_doctor': '$percent_doctor',
                            '_id': 0
                        }
                    }
                ]
            )

            res.status(200).json(jsonData(summaryDoctor))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async summaryIncomeDocs(req, res, next) {
        try {
            let { time_start, time_end } = req.query
            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }


            time_start = date2number(time_start)
            time_end = date2number(time_end)
            let time_start_double = time_end
            let time_end_double = time_end - (time_start - time_end)

            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)


            const summaryIncomeDocs = await Sys_doctor.aggregate(
                [
                    {
                        '$match': { '_s': ObjectID(idDecrypt) }
                    },
                    {
                        '$addFields': {
                            'date_id': { '$toDecimal': { '$toDate': '$_id' } }
                        }
                    },
                    {
                        '$addFields': {
                            'date_id': { '$round': [{ '$divide': ['$date_id', 1000] }, 4] },
                        }
                    },
                    {
                        '$facet': {
                            'data_now': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'date_id': { '$lte': time_start } },
                                            { 'date_id': { '$gte': time_end } },
                                            { 'pym.sts': 'settlement' }
                                        ]
                                    }
                                },
                                {
                                    '$project': {
                                        'income': { '$sum': '$mon.fen' }
                                    }
                                }
                            ],
                            'data_later': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'date_id': { '$lte': time_start_double } },
                                            { 'date_id': { '$gte': time_end_double } },
                                            { 'pym.sts': 'settlement' }
                                        ]
                                    }
                                },
                                {
                                    '$project': {
                                        'income': { '$sum': '$mon.fen' }
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'data_a': { '$sum': '$data_now.income' },
                            'data_b': { '$sum': '$data_later.income' },
                        }
                    },
                    {
                        '$project': {
                            'income': '$data_a',
                            'percent': percent_aggregate('$data_a', '$data_b'),
                            'diff_day': range_day_aggregate(time_start, time_end),
                            '_id': 0
                        }
                    }
                ]
            )

            res.status(200).json(jsonData(summaryIncomeDocs[0]))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async summaryIncomeDocsChart(req, res, next) {
        try {
            let { time_start, time_end } = req.query
            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }


            time_start = date2number(time_start)
            time_end = date2number(time_end)
            let time_start_double = time_end
            let time_end_double = time_end - (time_start - time_end)

            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)


            const summaryIncomeDocsChart = await Sys_doctor.aggregate(
                [
                    {
                        '$match': { '_s': ObjectID(idDecrypt) }
                    },
                    {
                        '$addFields': {
                            'date_id': { '$toDecimal': { '$toDate': '$_id' } }
                        }
                    },
                    {
                        '$addFields': {
                            'date_id': { '$round': [{ '$divide': ['$date_id', 1000] }, 4] },
                        }
                    },
                    {
                        '$facet': {
                            'data_now': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'date_id': { '$lte': time_start } },
                                            { 'date_id': { '$gte': time_end } },
                                            { 'pym.sts': 'settlement' }
                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'date': {
                                            '$dateToString': {
                                                'date': { '$toDate': { '$multiply': ['$date_id', 1000] } },
                                                'format': '%Y-%m-%d',
                                                'onNull': '2020-01-01'
                                            }
                                        },
                                    }
                                },
                                {
                                    '$group': {
                                        '_id': '$date',
                                        'income': { '$sum': '$mon.fen' }
                                    }
                                },
                                {
                                    '$project': {
                                        'x': '$_id',
                                        'y': '$income',
                                        '_id': 0
                                    }
                                },
                                {
                                    '$sort': { 'x': 1 }
                                }
                            ],
                        }
                    },
                    {
                        '$addFields': {
                            'data_a': { '$sum': '$data_now.y' },
                        }
                    },
                    {
                        '$project': {
                            'income': '$data_a',
                            'statistic': '$data_now',
                            '_id': 0
                        }
                    }
                ]
            )

            res.status(200).json(jsonData(summaryIncomeDocsChart[0]))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async summaryConsult(req, res, next) {
        try {
            let { time_start, time_end } = req.query
            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }


            time_start = date2number(time_start)
            time_end = date2number(time_end)
            let time_start_double = time_end
            let time_end_double = time_end - (time_start - time_end)

            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)


            const summaryConsult = await Doctor_chat.aggregate(
                [
                    {
                        '$match': {
                            '$and': [
                                { '_s': ObjectID(idDecrypt) },
                                { 'end': true },
                            ]
                        },
                    },
                    {
                        '$addFields': {
                            'count': { '$sum': 1 }
                        }
                    },
                    {
                        '$facet': {
                            'data_now': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start } },
                                            { 'ep': { '$gte': time_end } },
                                        ]
                                    }
                                },
                                {
                                    '$project': {
                                        'total': { '$sum': '$count' }
                                    }
                                }
                            ],
                            'data_later': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start_double } },
                                            { 'ep': { '$gte': time_end_double } },
                                        ]
                                    }
                                },
                                {
                                    '$project': {
                                        'total': { '$sum': '$count' }
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'data_a': { '$sum': '$data_now.total' },
                            'data_b': { '$sum': '$data_later.total' },
                        }
                    },
                    {
                        '$project': {
                            'total': '$data_a',
                            'percent': percent_aggregate('$data_a', '$data_b'),
                            'diff_day': range_day_aggregate(time_start, time_end),
                            '_id': 0
                        }
                    }
                ]
            )

            res.status(200).json(jsonData(summaryConsult[0]))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async summaryConsultChart(req, res, next) {
        try {
            let { time_start, time_end } = req.query
            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }


            time_start = date2number(time_start)
            time_end = date2number(time_end)

            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)


            const summaryConsultChart = await Doctor_chat.aggregate(
                [
                    {
                        '$match': {
                            '$and': [
                                { '_s': ObjectID(idDecrypt) },
                                { 'end': true },
                            ]
                        },
                    },
                    {
                        '$addFields': {
                            'count': { '$sum': 1 }
                        }
                    },
                    {
                        '$facet': {
                            'data_now': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start } },
                                            { 'ep': { '$gte': time_end } },
                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'date': {
                                            '$dateToString': {
                                                'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                                'format': '%Y-%m-%d',
                                                'onNull': '2020-01-01'
                                            }
                                        },
                                    }
                                },
                                {
                                    '$group': {
                                        '_id': '$date',
                                        'total': { '$sum': '$count' }
                                    }
                                },
                                {
                                    '$project': {
                                        'x': '$_id',
                                        'y': '$total',
                                        '_id': 0
                                    }
                                },
                                {
                                    '$sort': { 'x': 1 }
                                }
                            ],

                        }
                    },
                    {
                        '$addFields': {
                            'data_a': { '$sum': '$data_now.y' },
                        }
                    },

                    {
                        '$project': {
                            'total': '$data_a',
                            'statistic': '$data_now',
                            '_id': 0
                        }
                    }
                ]
            )

            res.status(200).json(jsonData(summaryConsultChart[0]))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async summaryRating(req, res, next) {
        try {
            let { time_start, time_end } = req.query
            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }


            time_start = date2number(time_start)
            time_end = date2number(time_end)

            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)


            let summaryRating = await Doctor_chat.aggregate(
                [
                    {
                        '$match': {
                            '$and': [
                                { '_s': ObjectID(idDecrypt) },
                                { 'end': true },
                                { 'ep': { '$lte': time_start } },
                                { 'ep': { '$gte': time_end } },
                                { 'scr': { '$gt': 0 } },

                            ]
                        },
                    },
                    {
                        '$addFields': {
                            'count': { '$sum': 1 }
                        }
                    },
                    {
                        '$project': {
                            'total_count': { '$sum': '$count' },
                            'total_rating': { '$sum': '$scr' }
                        }
                    }

                ]
            )

            let totalChat = 0
            let totalRating = 0

            for (let i = 0; i < summaryRating.length; i++) {
                totalChat += summaryRating[i].total_count
                totalRating += summaryRating[i].total_rating
            }

            let averageRating = +((totalRating / totalChat).toFixed(2))

            res.status(200).json(jsonData(averageRating))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async summaryTopDoctor(req, res, next) {
        try {
            let { time_start, time_end } = req.query
            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }


            time_start = date2number(time_start)
            time_end = date2number(time_end)

            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)


            let summaryTopDoctor = await Doctor_chat.aggregate(
                [
                    {
                        '$match': {
                            '$and': [
                                { '_s': ObjectID(idDecrypt) },
                                { 'end': true },
                                { 'ep': { '$lte': time_start } },
                                { 'ep': { '$gte': time_end } },
                                { 'scr': { '$gt': 0 } },
                            ]
                        },
                    },

                    {
                        '$lookup': {
                            'from': 'doctors',
                            'localField': '_d',
                            'foreignField': '_id',
                            'as': 'doctor',
                            'pipeline': [
                                {
                                    '$addFields': {
                                        'doctor_id': {
                                            '$function': {
                                                'body': encrypt,
                                                'args': [{ '$toString': '$_id' }, 12],
                                                'lang': 'js'
                                            }
                                        },
                                    }
                                },
                                {
                                    '$project': {
                                        'doctor_name': {
                                            '$reduce': {
                                                'input': '$dat.fln',
                                                'initialValue': '',
                                                'in': {
                                                    '$concat': [
                                                        '$$value',
                                                        { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                                        '$$this'
                                                    ]
                                                }
                                            }
                                        },
                                        'doctor_image': { '$concat': [`${rt_link}doctor/chat/embed/avatar/`, { '$toString': '$doctor_id' }] },
                                        'specialist': '$doc.fld'
                                    }
                                }
                            ]

                        }
                    },
                    {
                        '$addFields': {
                            'count': { '$sum': 1 },
                            'doctor_name': { '$ifNull': [{ '$first': '$doctor.doctor_name' }, '-'] },
                            'doctor_image': { '$ifNull': [{ '$first': '$doctor.doctor_image' }, '-'] },
                            'specialist': { '$ifNull': [{ '$first': '$doctor.specialist' }, '-'] },


                        }
                    },
                    {
                        '$group': {
                            '_id': '$_d',
                            'total_chat': { '$sum': '$count' },
                            'doctor_name': { '$first': '$doctor_name' },
                            'doctor_image': { '$first': '$doctor_image' },
                            'specialist': { '$first': '$specialist' },
                            'total_rating': { '$sum': '$scr' }
                        }
                    },
                    {
                        '$sort': { 'total_chat': -1 }
                    },
                    {
                        '$limit': 1
                    },
                    {
                        '$project': {
                            'doctor_name': '$doctor_name',
                            'doctor_image': '$doctor_image',
                            'specialist': '$specialist',
                            'rating': { '$round': [{ '$divide': ['$total_rating', '$total_chat'] }, 2] },
                            '_id': 0
                        }
                    }

                ]
            )

            res.status(200).json(jsonData(summaryTopDoctor[0]))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async tableDoctor(req, res, next) {
        try {
            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)

            const { page, item_limit } = req.query

            const tableDoctor = await Doctor.aggregate(queryPagination(
                [
                    {
                        '$match': {
                            '$and': [
                                { '_s': ObjectID(idDecrypt) },
                                { 'doc.isd': true },
                                { 'dat.act': true }
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'sys_doctors',
                            'localField': '_id',
                            'foreignField': '_d',
                            'pipeline': [
                                {
                                    '$match': { 'pym.sts': 'settlement' }
                                },
                                {
                                    '$project': {
                                        'total_bought': { '$sum': 1 },
                                        'total_income': { '$sum': '$mon.fen' },
                                        '_id': 0
                                    }
                                }
                            ],
                            'as': 'sys_doctor'
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'doctors_chats',
                            'localField': '_id',
                            'foreignField': '_d',
                            'pipeline': [
                                {
                                    '$project': {
                                        '_id': 0,
                                        'total': { '$sum': 1 },
                                        'rating': '$scr',
                                    }
                                },
                            ],
                            'as': 'consult'
                        }
                    },
                    {
                        '$addFields': {
                            'doctor_id': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            },
                            'fullname': {
                                '$reduce': {
                                    'input': '$dat.fln',
                                    'initialValue': '',
                                    'in': {
                                        '$concat': [
                                            '$$value',
                                            { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                            '$$this'
                                        ]
                                    }
                                }
                            },
                            'total_consult': { '$sum': '$consult.rating' },
                            'total_rating': { '$sum': '$consult.total' },
                        }
                    },
                    {
                        '$match': {
                            '$and': [
                                { 'total_rating': { '$gt': 0 } },
                                { 'total_consult': { '$gt': 0 } },
                            ]
                        }
                    },
                    {
                        '$sort': { 'total_consult': -1 }
                    },
                    {
                        '$limit': 10
                    }
                ],
                [
                    {
                        '$project': {
                            'doctor_id': '$doctor_id',
                            'fullname': '$fullname',
                            'doctor_image': { '$concat': [`${rt_link}doctor/chat/embed/avatar/`, '$doctor_id'] },
                            'total_consult': '$total_consult',
                            'rating': { '$round': [{ '$divide': ['$total_consult', '$total_rating'] }, 2] },
                            'total_purchase': { '$sum': '$sys_doctor.total_bought' },
                            'total_income': { '$sum': '$sys_doctor.total_income' },
                            '_id': 0
                        }
                    }
                ], page, 3, item_limit
            ))

            res.status(200).json(jsonData(tableDoctor[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async listProduct(req, res, next) {
        try {
            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)

            const { page, item_limit, searchProduct, tab } = req.query

            let filterProduct = 0

            if (searchProduct) {
                filterProduct = {
                    'product_name': {
                        '$regex': searchProduct,
                        '$options': 'i'
                    }
                }
            } else {
                filterProduct = {}
            }

            let filterStatus = 0
            if (tab) {
                filterStatus = { 'status': tab }
            } else {
                filterStatus = {}
            }


            const listProduct = await Stores_product.aggregate(queryPagination(
                [
                    {
                        '$match': { '_s': ObjectID(idDecrypt) }
                    },
                    {
                        '$lookup': {
                            'from': 'sys_payment',
                            'localField': '_id',
                            'foreignField': 'dat._p',
                            'let': {
                                'product': '$_id',
                                'store': '$_s'
                            },
                            'pipeline': [
                                {
                                    '$match': {
                                        '$expr': { '$eq': ['$_s', '$$store'] }
                                    }
                                },
                                {
                                    '$match': {
                                        '$and': [
                                            { 'pym.sts': { '$in': ['settlement'] } }
                                        ]
                                    }
                                },

                                {
                                    '$project': {
                                        'total': {
                                            '$sum': {
                                                '$map': {
                                                    'input': '$dat',
                                                    'in': {
                                                        '$cond': {
                                                            'if': { '$eq': ['$$this._p', '$$product'] },
                                                            'then': '$$this.qty',
                                                            'else': { '$toInt': '0' }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            ],
                            'as': 'bought',
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'stores_products_variants',
                            'localField': '_id',
                            'foreignField': '_p',
                            'let': { 'store_id': '$_s' },
                            'pipeline': [
                                {
                                    '$match': {
                                        '$expr': {
                                            '$and': [
                                                { '$eq': ['$_s', '$$store_id'] },
                                                { '$eq': ['$act', true] },
                                                { '$eq': ['$del', false] },
                                            ]
                                        }

                                    }
                                },
                                {
                                    '$match': {
                                        'det': { '$ne': true }
                                    }
                                },
                                {
                                    '$lookup': {
                                        'from': 'sys_payment',
                                        'localField': '_p',
                                        'foreignField': 'dat._p',
                                        'let': {
                                            'product': '$_p',
                                            'store': '$_s',
                                            'variant': '$_id'
                                        },
                                        'pipeline': [
                                            {
                                                '$match': {
                                                    '$expr': {
                                                        '$and': [{
                                                            '$eq': ['$_s', '$$store']
                                                        }]
                                                    }
                                                }
                                            },
                                            {
                                                '$match': {
                                                    '$and': [
                                                        { 'pym.sts': { '$in': ['settlement'] } }
                                                    ]
                                                }
                                            },
                                            {
                                                '$project': {
                                                    'total': {
                                                        '$sum': {
                                                            '$map': {
                                                                'input': '$dat',
                                                                'in': {
                                                                    '$cond': {
                                                                        'if': {
                                                                            '$and': [
                                                                                { '$eq': ['$$this._p', '$$product'] },
                                                                                { '$eq': ['$$this._v', '$$variant'] }
                                                                            ]
                                                                        },
                                                                        'then': '$$this.qty',
                                                                        'else': { '$toInt': '0' }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ],
                                        'as': 'brought'
                                    }
                                },
                                {
                                    '$addFields': {
                                        'name': {
                                            '$map': {
                                                'input': '$nme',
                                                'in': {
                                                    '$cond': {
                                                        'if': { '$gte': [{ '$size': '$nme' }, 1] },
                                                        'then': { '$concat': ['$$this.nme', ' | ', '$$this.val'] },
                                                        'else': '-'
                                                    }
                                                },
                                            }
                                        },
                                        'sale': { '$ifNull': [{ '$sum': '$brought.total' }, { '$toInt': '0' }] }
                                    }
                                },
                                {
                                    '$project': {
                                        'price': {
                                            '$cond': {
                                                'if': { '$eq': [{ '$size': '$prc' }, 1] },
                                                'then': { '$first': '$prc.val' },
                                                'else': 0
                                            }
                                        },
                                        'stock': { '$subtract': [{ '$sum': '$stk' }, '$sale'] },
                                        'stock_total': { '$sum': '$stk' },
                                        '_id': 0,
                                        'name': { '$ifNull': [{ '$first': '$name' }, []] },
                                        'main': '$man',
                                        'sale': '$sale'
                                    }
                                }
                            ],
                            'as': 'variant'
                        }
                    },
                    {
                        '$addFields': {
                            'stock_variant': { '$sum': '$variant.stock_total' },
                            'total_bought': { '$ifNull': [{ '$sum': '$bought.total' }, { '$toInt': '0' }] },
                            'item_id': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            },
                            'price': { '$ifNull': [{ '$first': '$variant.price' }, { '$toInt': '0' }] }
                        }
                    },
                    {
                        '$addFields': {
                            'total': { '$subtract': ['$stock_variant', '$total_bought'] }
                        }
                    },
                    {
                        '$addFields': {
                            'status': status_product,
                            'product_name': '$det.nms',
                        }
                    },
                    {
                        '$match': {
                            '$and': [filterProduct, filterStatus]
                        }
                    },
                ],
                [
                    {
                        '$project': {
                            '_id': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            },
                            'total_quantity': '$total',
                            'product_name': '$det.nms',
                            'product_image': { '$concat': [`${rt_link}store/ip/`, { '$toString': '$item_id' }, '/0'] },
                            'sku': '$sku',
                            'status': '$status',
                            'total_price': '$price',
                            'total_sale': { '$sum': '$variant.sale' },
                            'variant': {
                                '$cond': {
                                    'if': { '$eq': [{ '$first': '$variant.name' }, []] },
                                    'then': [],
                                    'else': '$variant'
                                }
                            },
                        }
                    }

                ], page, 3, item_limit
            ))

            res.status(200).json(jsonData(listProduct[0]))


        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async productDetail(req, res, next) {
        try {
            const { store_id, product_id } = req.params
            const id_store = decryptId(store_id, 12)
            const id_product = decryptId(product_id, 12)


            var productDetail = await Stores_product.aggregate(
                [
                    {
                        '$match': {
                            '$and': [
                                { '_id': ObjectID(id_product) },
                                { '_s': ObjectID(id_store) },
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'cfg_category',
                            'let': {
                                'category': '$cat'
                            },
                            'as': 'config_category',
                            'pipeline': [
                                {
                                    '$match': {
                                        '$expr': {
                                            '$and': [
                                                { '$in': ['$$category', ['$idx', '$grp', '$cat', '$sub']] }
                                            ]
                                        }
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'stores_etalase',
                            'let': {
                                'id_etalase': '$_e'
                            },
                            'as': 'etalase',
                            'pipeline': [
                                {
                                    '$match': {
                                        '$expr': {
                                            '$and': [
                                                { '$eq': ['$$id_etalase', '$_id'] }
                                            ]
                                        }
                                    }
                                },
                                {
                                    '$project': {
                                        '_id': 0,
                                        'name': '$nme'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'cfg_analyst_score',
                            'let': {
                                'tag': '$tag'
                            },
                            'as': 'analyze_score',
                            'pipeline': [
                                {
                                    '$match': {
                                        '$expr': {
                                            '$and': [
                                                { '$in': [{ '$toString': '$typ' }, '$$tag'] }
                                            ]
                                        }
                                    }
                                },
                                {
                                    '$project': {
                                        '_id': 0,
                                        'name': '$tle'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'stores_products_variants',
                            'as': 'variant',
                            'localField': '_id',
                            'foreignField': '_p',
                            'pipeline': [
                                {
                                    '$match': { 'act': true }
                                },
                                {
                                    '$lookup': {
                                        'from': 'sys_payment',
                                        'as': 'payment',
                                        'localField': '_id',
                                        'foreignField': 'dat._v',
                                        'pipeline': [

                                            {
                                                '$project': {
                                                    '_id': 0,
                                                    'stock_bought': { '$sum': '$dat.qty' }
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'stock_bought': { '$ifNull': [{ '$sum': '$payment.stock_bought' }, { '$toInt': '0' }] }
                                    }
                                },
                                {
                                    '$project': {
                                        '_id': 0,
                                        'stock_left': { '$subtract': ['$stk', '$stock_bought'] },
                                        'name': {
                                            '$map': {
                                                'input': '$nme',
                                                'in': {
                                                    'category': '$$this.nme',
                                                    'value': '$$this.val'
                                                }

                                            }
                                        },
                                        'price': { '$first': '$prc.val' }
                                    }
                                },

                            ]
                        }
                    },
                    {
                        '$unwind': { 'path': '$config_category' }
                    },
                    {
                        '$project': {
                            '_id': 0,
                            'product_info': {
                                'name': {
                                    '$reduce': {
                                        'input': '$det.nme',
                                        'initialValue': '',
                                        'in': {
                                            '$concat': [
                                                '$$value',
                                                { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                                '$$this'
                                            ]
                                        }
                                    }
                                },
                                'category': { '$concat': ['$config_category.idx', ' > ', '$config_category.grp', ' > ', 'config_category.cat', ' > ', '$config_category.sub'] },
                                'image': {
                                    '$map': {
                                        'input': '$det.img',
                                        'in': {
                                            '$concat': [`${rt_link}store/ip/`, {
                                                '$function': {
                                                    'body': encrypt,
                                                    'args': [{ '$toString': '$_id' }, 12],
                                                    'lang': 'js'
                                                }
                                            }, '/', { '$toString': '$$this' }]
                                        },
                                    }
                                },
                                'video': { '$ifNull': ['$det.vid', '-'] },
                                'etalase': '$etalase',
                                'description': { '$ifNull': ['$det.des', '-'] }
                            },
                            'spec': {
                                'bpom': '$det.pom',
                                'using_method': { '$ifNull': ['$dyn.pgn', '-'] },
                                'ingredient': { '$ifNull': ['$dyn.kdn', '-'] },
                                // 'skin_type': {'$type' : '$dyn.sty'},
                                'skin_type': {
                                    '$cond': {
                                        'if': { '$eq': [{ '$type': '$dyn.sty' }, 'array'] },
                                        'then': '$dyn.sty',
                                        'else': []
                                    }
                                },
                                'skin_problem': '$analyze_score',
                                'restriction': {
                                    'pregnant': '$dyn.sft.hml',
                                    'brace_feeding': '$dyn.sft.mys',
                                    'praben': '$dyn.sft.prb',
                                    'fragnance': '$dyn.sft.frg',
                                    'fragnance': '$dyn.sft.frg',
                                    'sls': '$dyn.sft.sls',
                                    'alchohol': '$dyn.sft.alc',
                                },
                                'undertone': '$dyn.skt'
                            },
                            'table_variant': '$variant',
                            'sku': { '$ifNull': ['$sku', '-'] },
                            'dimension': {
                                'weight': { '$ifNull': [{ '$concat': [{ '$toString': { '$multiply': ['$det.dim.wh', 1000] } }, ' gr'] }, '-'] },
                                'width': { '$ifNull': [{ '$concat': [{ '$toString': '$det.dim.w' }, ' cm'] }, '-'] },
                                'height': { '$ifNull': [{ '$concat': [{ '$toString': '$det.dim.h' }, ' cm'] }, '-'] },
                                'length': { '$ifNull': [{ '$concat': [{ '$toString': '$det.dim.l' }, ' cm'] }, '-'] },
                            }
                        }
                    }
                ]
            )

            if (productDetail.length === 0) {
                res.status(200).json(jsonData({ result: [] }))
            }


            if (productDetail[0].product_info.description !== '-') {
                productDetail[0].product_info.description = encodeBase64(productDetail[0].product_info.description)
            }
            if (productDetail[0].spec.using_method !== '-') {
                productDetail[0].spec.using_method = encodeBase64(productDetail[0].spec.using_method)
            }
            if (productDetail[0].spec.ingredient !== '-') {
                productDetail[0].spec.ingredient = encodeBase64(productDetail[0].spec.ingredient)
            }



            let result = productDetail[0]

            for (let i = 0; i < result.table_variant.length; i++) {

                for (let j = 0; j < result.table_variant[i].name.length; j++) {

                    var keyObj = result.table_variant[i].name[j].category

                    keyObj = keyObj.charAt(0).toUpperCase() + keyObj.slice(1);

                    result.table_variant[i][keyObj] = result.table_variant[i].name[j].value

                }
                delete result.table_variant[i].name
            }

            res.status(200).json(jsonData(result))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async countProduct(req, res, next) {
        try {
            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)


            const countProduct = await Stores_product.aggregate(
                [
                    {
                        '$match': { '_s': ObjectID(idDecrypt) }
                    },
                    {
                        '$lookup': {
                            'from': 'stores_products_variants',
                            'as': 'variant',
                            'foreignField': '_p',
                            'localField': '_id',
                            'pipeline': [
                                {
                                    '$addFields': {
                                        'name': {
                                            '$map': {
                                                'input': '$nme',
                                                'in': {
                                                    '$cond': {
                                                        'if': { '$gte': [{ '$size': '$nme' }, 1] },
                                                        'then': { '$concat': ['$$this.nme', ' | ', '$$this.val'] },
                                                        'else': '-'
                                                    }
                                                },
                                            }
                                        },
                                        'price': {
                                            '$map': {
                                                'input': '$prc',
                                                'in': {
                                                    '$cond': {
                                                        'if': { '$gte': [{ '$size': '$prc' }, 1] },
                                                        'then': '$$this.val',
                                                        'else': { '$toInt': 0 }
                                                    }
                                                },
                                            }
                                        },
                                    }
                                },
                                {
                                    '$unwind': { 'path': '$name' },
                                },
                                {
                                    '$unwind': { 'path': '$price' },
                                },
                                {
                                    '$lookup': {
                                        'from': 'sys_payment',
                                        'as': 'payment',
                                        'localField': '_id',
                                        'foreignField': 'dat._v',
                                        'let': {
                                            'store_id': '$_s',
                                            'product_id': '$_p',
                                            'variant_id': '$_id',
                                        },
                                        'pipeline': [
                                            {
                                                '$match': {
                                                    '$expr': {
                                                        '$and': [
                                                            { '$eq': ['$_s', '$$store_id'] },
                                                            { '$in': ['$pym.sts', ['settlement', 'refund-request']] }
                                                        ]
                                                    }
                                                }
                                            },
                                            {
                                                '$facet': {
                                                    'total_beli': [
                                                        {
                                                            '$project': {
                                                                'bought': {
                                                                    '$sum': {
                                                                        '$map': {
                                                                            'input': '$dat',
                                                                            'in': {
                                                                                '$cond': {
                                                                                    'if': {
                                                                                        '$and': [
                                                                                            { '$eq': ['$$this._p', '$$product_id'] },
                                                                                            { '$eq': ['$$this._v', '$$variant_id'] },
                                                                                        ]
                                                                                    },
                                                                                    'then': '$$this.qty',
                                                                                    'else': { '$toInt': '0' }
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    ],
                                                    'jumlah_transaksi': [
                                                        {
                                                            '$project': {
                                                                'total': { '$sum': 1 }
                                                            }
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                '$project': {
                                                    'stok_dibeli': { '$ifNull': [{ '$first': '$total_beli.bought' }, { '$toInt': '0' }] },
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'bought': { '$ifNull': [{ '$first': '$payment.stok_dibeli' }, { '$toInt': '0' }] },
                                    }
                                },
                                {
                                    '$addFields': {
                                        'stock': { '$subtract': ['$stk', '$bought'] }
                                    }
                                },
                                {
                                    '$project': {
                                        'stock': '$stock',
                                        '_id': 0
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'total_quantity': { '$sum': '$variant.stock' },
                        }
                    },
                    {
                        '$addFields': {
                            'status': status_product,
                            'item_id': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            },
                        }
                    },
                    {
                        '$project': {
                            '_id': 0,
                            'status': '$status',

                        }
                    },

                ],
            )

            let newResult = {
                published: 0,
                unpublished: 0,
                empty: 0,
                draft: 0,
                all: countProduct.length
            }

            for (let i = 0; i < countProduct.length; i++) {
                if (countProduct[i].status === 'published') {
                    newResult.published += 1
                } else if (countProduct[i].status === 'unpublished') {
                    newResult.unpublished += 1
                } else if (countProduct[i].status === 'empty') {
                    newResult.empty += 1
                } else if (countProduct[i].status === 'draft') {
                    newResult.draft += 1
                }
            }

            console.log(countProduct)

            res.status(200).json(jsonData(newResult))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async listDocBex(req, res, next) {
        try {
            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)
            const { page, item_limit, tab, search_doctor } = req.query

            let filterDoctor = 0

            if (search_doctor) {
                filterDoctor = {
                    'name': {
                        '$regex': search_doctor,
                        '$options': 'i'
                    }
                }
            } else {
                filterDoctor = {}
            }

            const listDoc = await Doctor.aggregate(queryPagination(
                [
                    {
                        '$match': {
                            '$and': [
                                { 'doc.isd': true },
                                { '_s': ObjectID(idDecrypt) }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'doctorId': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            },
                            'name': {
                                '$reduce': {
                                    'input': '$dat.fln',
                                    'initialValue': '',
                                    'in': {
                                        '$concat': [
                                            '$$value',
                                            { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                            '$$this'
                                        ]
                                    }
                                }
                            },
                        }
                    },
                    {
                        '$match': filterDoctor
                    }
                ],
                [
                    {
                        '$project': {
                            'name': '$name',
                            'birthday': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$dat.bdy', 1000] } },
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'gender': {
                                '$cond': {
                                    'if': { '$eq': ['$dat.sex', 'm'] },
                                    'then': 'Male',
                                    'else': {
                                        '$cond': {
                                            'if': { '$eq': ['$dat.sex', 'f'] },
                                            'then': 'Female',
                                            'else': '-'
                                        }
                                    }
                                }
                            },
                            'status': {
                                '$switch': {
                                    'branches': [
                                        {
                                            'case': {
                                                '$and': [
                                                    { '$eq': ['$act', true] },
                                                    { '$eq': ['$dat.act', true] },
                                                ]
                                            },
                                            'then': 'Aktif'
                                        },
                                        {
                                            'case': {
                                                '$and': [
                                                    { '$eq': ['$act', false] },
                                                    { '$eq': ['$dat.act', true] },
                                                ]
                                            },
                                            'then': 'Tidak Aktif'
                                        },
                                        {
                                            'case': {
                                                '$and': [
                                                    { '$eq': ['$dat.act', false] },
                                                ]
                                            },
                                            'then': 'Ditangguhkan'
                                        },
                                    ],
                                    'default': 'unknown'
                                }
                            },
                            '_id': 0,
                            'label': 'doctor',
                            'doctor_avatar': { '$concat': [`${rt_link}doctor/chat/embed/avatar/`, '$doctorId'] },

                        }
                    }
                ], page, 3, item_limit
            ))

            const listBex = await Doctor.aggregate(queryPagination(
                [
                    {
                        '$match': {
                            '$and': [
                                { 'doc.isd': false },
                                { '_s': ObjectID(idDecrypt) }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'doctorId': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            },
                            'name': {
                                '$reduce': {
                                    'input': '$dat.fln',
                                    'initialValue': '',
                                    'in': {
                                        '$concat': [
                                            '$$value',
                                            { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                            '$$this'
                                        ]
                                    }
                                }
                            },
                        }
                    },
                    {
                        '$match': filterDoctor
                    }
                ],
                [
                    {
                        '$project': {
                            'name': '$name',
                            'birthday': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$dat.bdy', 1000] } },
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'gender': {
                                '$cond': {
                                    'if': { '$eq': ['$dat.sex', 'm'] },
                                    'then': 'Male',
                                    'else': {
                                        '$cond': {
                                            'if': { '$eq': ['$dat.sex', 'f'] },
                                            'then': 'Female',
                                            'else': '-'
                                        }
                                    }
                                }
                            },
                            'status': {
                                '$switch': {
                                    'branches': [
                                        {
                                            'case': {
                                                '$and': [
                                                    { '$eq': ['$act', true] },
                                                    { '$eq': ['$dat.act', true] },
                                                ]
                                            },
                                            'then': 'Aktif'
                                        },
                                        {
                                            'case': {
                                                '$and': [
                                                    { '$eq': ['$act', false] },
                                                    { '$eq': ['$dat.act', true] },
                                                ]
                                            },
                                            'then': 'Tidak Aktif'
                                        },
                                        {
                                            'case': {
                                                '$and': [
                                                    { '$eq': ['$dat.act', false] },
                                                ]
                                            },
                                            'then': 'Ditangguhkan'
                                        },
                                    ],
                                    'default': 'unknown'
                                }
                            },
                            '_id': 0,
                            'specialist': { '$ifNull': ['$doc.fld', '-'] },
                            'sip_number': { '$ifNull': ['$doc.sip.num', '-'] },
                            'str_number': { '$ifNull': ['$doc.str.num', '-'] },
                            'price': { '$ifNull': ['$dyn.prc', '-'] },
                            'doctor_avatar': { '$concat': [`${rt_link}doctor/chat/embed/avatar/`, '$doctorId'] },
                            'label': 'skin and beauty expert'

                        }
                    }
                ], page, 3, item_limit
            ))

            if (tab === 'doctor') { res.status(200).json(jsonData(listDoc[0])) }

            if (tab === 'bex') { res.status(200).json(jsonData(listBex[0])) }

            res.status(200).json(jsonData(listDoc[0]))


        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async countDocBex(req, res, next) {
        try {
            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)

            const countDocBex = await Doctor.aggregate(
                [
                    {
                        '$match': { '_s': ObjectID(idDecrypt) }
                    },
                    {
                        '$facet': {
                            'doctor': [
                                {
                                    '$match': { 'doc.isd': true }
                                },
                                {
                                    '$count': 'total'
                                }
                            ],
                            'bex': [
                                {
                                    '$match': { 'doc.isd': false }
                                },
                                {
                                    '$count': 'total'
                                }
                            ]
                        }
                    },
                    {
                        '$project': {
                            'doctor': { '$ifNull': [{ '$first': '$doctor.total' }, { '$toInt': '0' }] },
                            'bex': { '$ifNull': [{ '$first': '$bex.total' }, { '$toInt': '0' }] },
                            '_id': 0

                        }
                    }
                ]
            )

            res.status(200).json(jsonData(countDocBex[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async listClinic(req, res, next) {
        try {
            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)
            const { page, item_limit, clinic_name } = req.query

            let searchName = 0

            if (clinic_name) {
                searchName = {
                    'name': {
                        '$regex': clinic_name,
                        '$options': 'i'
                    }
                }
            } else {
                searchName = {}
            }


            const listClinic = await Stores_clinic.aggregate(queryPagination(
                [

                    {
                        '$match': { '_s': ObjectID(idDecrypt) }
                    },
                    {
                        '$addFields': {
                            'name': '$nme'
                        }
                    },
                    {
                        '$match': searchName
                    }
                ],
                [
                    {
                        '$project': {
                            'name': '$name',
                            '_id': 0,
                            'address': { '$concat': ['$det.det', ' ', '$det.an', ' ', '$det.sn', ' ', '$det.cty', ' ', '$det.prv', ' ', '$det.zip'] }
                        }
                    }
                ], page, 3, item_limit
            ))

            res.status(200).json(jsonData(listClinic[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async listVoucher(req, res, next) {
        try {
            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)
            const { page, item_limit, voucher_name, voucher_status } = req.query

            let searchVoucher = 0

            if (voucher_name) {
                searchVoucher = {
                    'name': {
                        '$regex': voucher_name,
                        '$options': 'i'
                    }
                }
            } else {
                searchVoucher = {}
            }

            let searchStatus = 0

            if (voucher_status) {
                searchStatus = { 'status': voucher_status }
            } else {
                searchStatus = {}
            }


            const listVoucher = await StoreVoucher.aggregate(queryPagination(
                [

                    {
                        '$match': { '_s': ObjectID(idDecrypt) }
                    },
                    {
                        '$addFields': {
                            'status': statusVch,
                            'name': '$nme'
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'stores_clinic',
                            'as': 'sa',
                            'localField': '_cl',
                            'foreignField': '_id',
                            'pipeline': [
                                {
                                    '$project': {
                                        '_id': 0,
                                        'clinic_name': '$nme',
                                        'clinic_address': { '$concat': ['$det.det', ' ', '$det.an', ' ', '$det.sn', ' ', '$det.prv', '$det.cty'] }
                                    }
                                }
                            ]

                        }
                    },
                    {
                        '$match': {
                            '$and': [searchVoucher, searchStatus]
                        }
                    }
                ],
                [
                    {
                        '$project': {
                            '_id': 0,
                            'name': '$name',
                            'price': '$val',
                            'expired_date': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$epe', 1000] } },
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'quota': '$lmt',
                            'description': '$des',
                            'status': '$status',
                            'clinic_list': '$sa'
                        }
                    }
                ], page, 3, item_limit
            ))

            res.status(200).json(jsonData(listVoucher[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async countClinicVoucher(req, res, next) {
        try {
            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)

            const countClinicVoucher = await Config.aggregate(
                [
                    {
                        '$limit': 1
                    },
                    {
                        '$lookup': {
                            'from': 'stores_clinic',
                            'as': 'sc',
                            'pipeline': [
                                {
                                    '$match': { '_s': ObjectID(idDecrypt) }
                                },
                                {
                                    '$count': 'total'
                                }
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'stores_vouchers',
                            'as': 'sv',
                            'pipeline': [
                                {
                                    '$match': { '_s': ObjectID(idDecrypt) }
                                },
                                {
                                    '$count': 'total'
                                }
                            ]
                        }
                    },
                    {
                        '$project': {
                            'total_clinic': { '$ifNull': [{ '$first': '$sc.total' }, { '$toInt': '0' }] },
                            'total_voucher': { '$ifNull': [{ '$first': '$sv.total' }, { '$toInt': '0' }] },
                            '_id': 0
                        }
                    }
                ]
            )

            res.status(200).json(jsonData(countClinicVoucher[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async infoSeller(req, res, next) {
        try {
            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)

            const [infoSeller] = await Store.aggregate(
                [
                    {
                        '$match': { '_id': ObjectID(idDecrypt) }
                    },
                    {
                        '$lookup': {
                            'from': 'users',
                            'as': 'us',
                            'localField': '_u',
                            'foreignField': '_id',
                            'pipeline': [
                                {
                                    '$project': {
                                        'name': {
                                            '$reduce': {
                                                'input': '$dat.fln',
                                                'initialValue': '',
                                                'in': {
                                                    '$concat': [
                                                        '$$value',
                                                        { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                                        '$$this'
                                                    ]
                                                }
                                            }
                                        },
                                    }
                                }
                            ]

                        }
                    },
                    {
                        '$lookup': {
                            'from': 'stores_address',
                            'as': 'sa',
                            'localField': '_id',
                            'foreignField': '_s',
                            'pipeline': [
                                {
                                    '$project': {
                                        'label': '$nme',
                                        'sender_name': '$rcv',
                                        'province': '$shp.pn',
                                        'city': '$shp.cn',
                                        'suburb': '$shp.sn',
                                        'area': '$shp.an',
                                        'zip': '$shp.zip',
                                        'detail': '$det',
                                        'status': {
                                            '$cond': {
                                                'if': { '$eq': ['$man', true] },
                                                'then': 'Utama',
                                                'else': 'Tidak Utama'
                                            }
                                        },
                                        '_id': 0
                                    }
                                }
                            ]

                        }
                    },
                    {
                        '$lookup': {
                            'from': 'stores_bank',
                            'as': 'sb',
                            'localField': '_id',
                            'foreignField': '_s',
                            'pipeline': [
                                {
                                    '$project': {
                                        'bank_name': '$nme',
                                        'account_number': '$val',
                                        'people_name': { '$ifNull': ['$pnm', '-'] },
                                        'status': {
                                            '$cond': {
                                                'if': { '$eq': ['$man', true] },
                                                'then': 'Utama',
                                                'else': 'Tidak Utama'
                                            }
                                        },
                                        '_id': 0
                                    }
                                }
                            ]

                        }
                    },
                    {
                        '$addFields': {
                            'date_created': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'time_created': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                    'format': '%H:%M',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'date_login': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$det.on', 1000] } },
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'time_login': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$det.on', 1000] } },
                                    'format': '%H:%M',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'dayRegist': {
                                '$dateDiff': {
                                    'startDate': {
                                        '$toDate': {
                                            '$multiply': ['$ep', 1000.00]
                                        }
                                    },
                                    'endDate': { '$toDate': { '$multiply': [date2number(''), 1000.00] } },
                                    'unit': 'day'
                                }
                            }
                        }
                    },

                    {
                        '$project': {
                            '_id': 0,
                            'store_id': store_id,
                            'username': '$det.nms',
                            'shop_name': {
                                '$reduce': {
                                    'input': '$det.nme',
                                    'initialValue': '',
                                    'in': {
                                        '$concat': [
                                            '$$value',
                                            { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                            '$$this'
                                        ]
                                    }
                                }
                            },
                            'account_created': { '$concat': ['$date_created', ' ', '$time_created'] },
                            'last_login': { '$concat': ['$date_login', ' ', '$time_login'] },
                            'email': {
                                '$function': {
                                    'body': decrypt,
                                    'args': [{ '$toString': '$ctc.eml' }, 8],
                                    'lang': 'js'
                                }
                            },
                            'phone_number': '$ctc.phn',
                            'bank_list': '$sb',
                            'address_list': '$sa',
                            'account_status': {
                                '$cond': {
                                    'if': { '$eq': ['$det.act', true] },
                                    'then': 'Aktif',
                                    'else': 'Tidak Aktif'
                                }
                            },
                            'store_logo': { '$concat': [`${rt_link}store/i/`, { '$toString': store_id }] },
                            'npwp': { '$ifNull': ['$lgl.npw', '-'] },
                            'siup': { '$ifNull': ['$lgl.siu', '-'] },
                            'saving_book': { '$ifNull': ['$lgl.cbt', '-'] },
                            'shipping_service': {
                                '$map': {
                                    'input': '$shp',
                                    'in': {
                                        'name': { '$concat': ['$$this.nme', ' ', '$$this.typ'] }
                                    }
                                }
                            },
                            'status': status_store
                        }
                    }
                ]
            )
            res.status(200).json(jsonData(infoSeller))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async listAdminStore(req, res, next) {
        try {
            const { store_id } = req.params
            const idDecrypt = decryptId(store_id, 12)

            const listAdminStore = await Store.aggregate(
                [
                    {
                        '$match': { '_id': ObjectID(idDecrypt) },
                    },
                    {
                        '$facet': {
                            'superadmin': [
                                {
                                    '$lookup': {
                                        'from': 'users',
                                        'as': 'sa',
                                        'localField': '_u',
                                        'foreignField': '_id',
                                        'pipeline': [
                                            {
                                                '$project': {
                                                    'fullname': {
                                                        '$reduce': {
                                                            'input': '$dat.fln',
                                                            'initialValue': '',
                                                            'in': {
                                                                '$concat': [
                                                                    '$$value',
                                                                    { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                                                    '$$this'
                                                                ]
                                                            }
                                                        }
                                                    },
                                                    'email': {
                                                        '$function': {
                                                            'body': decrypt,
                                                            'args': [{ '$toString': '$dat.eml.val' }, 8],
                                                            'lang': 'js'
                                                        }
                                                    },
                                                    'user_avatar': { '$concat': [`${rt_link}profile/self/avatar/`, '$dat.usr'] }
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    '$unwind': { 'path': '$sa' }
                                },
                                {
                                    '$project': {
                                        'name': '$sa.fullname',
                                        'email': '$sa.email',
                                        'avatar': '$sa.user_avatar',
                                        '_id': 0
                                    }
                                }
                            ],
                            'admin_finance': [
                                {
                                    '$match': { 'stf.lvl': 1 }
                                },
                                {
                                    '$lookup': {
                                        'from': 'users',
                                        'as': 'af',
                                        'localField': 'stf._u',
                                        'foreignField': '_id',
                                        'pipeline': [
                                            {
                                                '$project': {
                                                    'fullname': {
                                                        '$reduce': {
                                                            'input': '$dat.fln',
                                                            'initialValue': '',
                                                            'in': {
                                                                '$concat': [
                                                                    '$$value',
                                                                    { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                                                    '$$this'
                                                                ]
                                                            }
                                                        }
                                                    },
                                                    'email': {
                                                        '$function': {
                                                            'body': decrypt,
                                                            'args': [{ '$toString': '$dat.eml.val' }, 8],
                                                            'lang': 'js'
                                                        }
                                                    },
                                                    'user_avatar': { '$concat': [`${rt_link}profile/self/avatar/`, '$dat.usr'] }
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    '$unwind': { 'path': '$af' }
                                },
                                {
                                    '$project': {
                                        'name': '$af.fullname',
                                        'email': '$af.email',
                                        'avatar': '$af.user_avatar',
                                        '_id': 0
                                    }
                                }
                            ],
                            'admin': [
                                {
                                    '$match': { 'stf.lvl': 99 }
                                },
                                {
                                    '$lookup': {
                                        'from': 'users',
                                        'as': 'adm',
                                        'localField': 'stf._u',
                                        'foreignField': '_id',
                                        'pipeline': [
                                            {
                                                '$project': {
                                                    'fullname': {
                                                        '$reduce': {
                                                            'input': '$dat.fln',
                                                            'initialValue': '',
                                                            'in': {
                                                                '$concat': [
                                                                    '$$value',
                                                                    { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                                                    '$$this'
                                                                ]
                                                            }
                                                        }
                                                    },
                                                    'email': {
                                                        '$function': {
                                                            'body': decrypt,
                                                            'args': [{ '$toString': '$dat.eml.val' }, 8],
                                                            'lang': 'js'
                                                        }
                                                    },
                                                    'user_avatar': { '$concat': [`${rt_link}profile/self/avatar/`, '$dat.usr'] }
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    '$unwind': { 'path': '$adm' }
                                },
                                {
                                    '$project': {
                                        'name': '$adm.fullname',
                                        'email': '$adm.email',
                                        'avatar': '$adm.user_avatar',
                                        '_id': 0
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$unwind': { 'path': '$superadmin' }
                    },
                ]
            )

            res.status(200).json(jsonData(listAdminStore[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async store_logs(req, res, next) {
        try {
            const { store_id } = req.params

            const id_decrypt = decryptId(store_id, 12)

            const { page, item_limit } = req.query

            const [store_logs] = await Store_log.aggregate(queryPagination(
                [
                    {
                        '$match': { '_s': ObjectID(id_decrypt) }
                    },
                    {
                        '$addFields': {
                            'date': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'time': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                    'format': '%H:%M',
                                    'onNull': '2020-01-01'
                                }
                            },
                        }
                    }
                ],
                [
                    {
                        '$project': {
                            '_id': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            },
                            'date_time': { '$concat': ['$date', ' ', '$time'] },
                            'information': '$des',
                            'category': '$pge',
                            'detail': { '$concat': ['by ', '$usr'] }
                        }
                    }
                ], page, 3, item_limit
            ))

            res.status(200).json(jsonData(store_logs))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async voucher_sold(req, res, next) {
        try {
            let { store_id } = req.params
            store_id = decryptId(store_id, 12)

            let { page, item_limit, search_voucher, status } = req.query

            let filter = 0

            if (status) {
                filter = { 'status': status }
            } else {
                filter = {}
            }

            let [voucher_sold] = await Sys_voucher.aggregate(queryPagination(
                [
                    {
                        '$match': {
                            '$and': [
                                { '_s': ObjectID(store_id) },
                                { 'pym.sts': 'settlement' }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'date_order': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'time_order': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                    'format': '%H:%M',
                                    'onNull': '2020-01-01'
                                }
                            },
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'cfg_payment_list',
                            'localField': 'pym.chn',
                            'foreignField': 'code',
                            'as': 'bl',
                            'pipeline': [
                                {
                                    '$addFields': {
                                        'methods': {
                                            '$concat': ['$bank', " ", '$title']
                                        }
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'users',
                            'as': 'us',
                            'localField': '_u',
                            'foreignField': '_id',
                            'pipeline': [
                                {
                                    '$project': {
                                        'full_name': {
                                            '$reduce': {
                                                'input': '$dat.fln',
                                                'initialValue': '',
                                                'in': {
                                                    '$concat': [
                                                        '$$value',
                                                        { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                                        '$$this'
                                                    ]
                                                }
                                            }
                                        },
                                        'user_avatar': { '$concat': [`${rt_link}profile/self/avatar/`, '$dat.usr'] }
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'stores_vouchers',
                            'as': 'sv',
                            'localField': '_vc',
                            'foreignField': '_id',
                            'pipeline': [
                                {
                                    '$project': {
                                        'expired_epoch': '$epe'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'expired_epoch': { '$ifNull': [{ '$first': '$sv.expired_epoch' }, '-'] },
                        }
                    },
                    {
                        '$addFields': {
                            'status': statusVchSold
                        }
                    },
                    {
                        '$match': {
                            '$and': [
                                search_something('vn', search_voucher),
                                filter
                            ]
                        }
                    }
                ],
                [
                    {
                        '$project': {
                            'voucher_name': '$vn',
                            'voucher_price': '$prc',
                            'voucher_order': { '$concat': ['$date_order', ' ', '$time_order'] },
                            'payment_method': { '$ifNull': [{ '$first': '$bl.methods' }, '-'] },
                            'full_name': { '$ifNull': [{ '$first': '$us.full_name' }, '-'] },
                            'user_avatar': { '$ifNull': [{ '$first': '$us.user_avatar' }, '-'] },
                            'order_id': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            },
                            'status': '$status',
                            'clinic_name': '-',
                            'clinic_address': '-',
                            'total_payment': { '$multiply': ['$prc', '$qty'] },
                            '_id': 0


                        }
                    }
                ], page, 3, item_limit
            ))


            res.status(200).json(jsonData(voucher_sold))


        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async store_coupon(req, res, next) {
        try {
            let { store_id } = req.params
            store_id = decryptId(store_id, 12)

            let { page, item_limit, category, search_coupon } = req.query

            let filter = 0

            if (category) {
                filter = { 'type': category }
            } else {
                filter = {}
            }

            let [store_coupon] = await Stores_coupon.aggregate(queryPagination(
                [
                    {
                        '$match': { '_s': ObjectID(store_id) }
                    },
                    {
                        '$lookup': {
                            'from': 'users_coupon',
                            'as': 'uc',
                            'localField': '_id',
                            'foreignField': '_cp',
                            'pipeline': [
                                {
                                    '$project': {
                                        'used': {
                                            '$cond': {
                                                'if': { '$eq': ['$isu', true] },
                                                'then': { '$toInt': '1' },
                                                'else': { '$toInt': '0' }
                                            }
                                        },
                                    }
                                },
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'total_used': { '$toString': { '$sum': '$uc.used' } },
                            'limit': { '$toString': '$lmt' },
                            'now_coupon': { '$subtract': ['$lmt', { '$sum': '$uc.used' }] },
                            'date_start': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$eps', 1000] } },
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'time_start': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$eps', 1000] } },
                                    'format': '%H:%M',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'date_end': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$epe', 1000] } },
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'time_end': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$epe', 1000] } },
                                    'format': '%H:%M',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'type': {
                                '$cond': {
                                    'if': { '$eq': ['$typ', 'po'] },
                                    'then': 'Ongkir',
                                    'else': 'Discount'
                                }
                            },

                        }
                    },
                    {
                        '$addFields': {
                            'status': statusKupon(),
                        }
                    },
                    {
                        '$match': {
                            '$and': [
                                filter, search_something('nms', search_coupon)
                            ]
                        }
                    }
                ],
                [
                    {
                        '$project': {
                            'coupon_id': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            },
                            'name': '$nms',
                            'type': '$type',
                            'target': {
                                '$cond': {
                                    'if': { '$eq': ['$tar', 'followed'] },
                                    'then': 'Pengikut Toko',
                                    'else': 'Semua Pembeli'
                                }
                            },
                            'Potongan': {
                                '$cond': {
                                    'if': { '$lte': ['$vpc', { '$toInt': '1' }] },
                                    'then': { '$concat': [{ '$toString': { '$multiply': ['$vpc', 100] } }, '%'] },
                                    'else': {
                                        '$concat': ['Rp', {
                                            '$toString': {
                                                '$function': {
                                                    'body': rupiah_format_mongo,
                                                    'args': ['$vpc'],
                                                    'lang': 'js'
                                                }
                                            },
                                        }]
                                    }
                                }
                            },
                            'quota': { '$concat': ['$total_used', '/', '$limit'] },
                            'status': '$status',
                            'period_start': { '$concat': ['$date_start', ' ', '$time_start'] },
                            'period_end': { '$concat': ['$date_end', ' ', '$time_end'] },
                            '_id': 0
                        }
                    }
                ], page, 3, item_limit
            ))

            res.status(200).json(jsonData(store_coupon))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async coupon_info(req, res, next) {
        try {
            const { store_id, coupon_id } = req.params

            let store_decrypt = decryptId(store_id, 12)
            let coupon_decrypt = decryptId(coupon_id, 12)


            const [coupon_info] = await Stores_coupon.aggregate(
                [
                    {
                        '$match': {
                            '$and': [
                                { '_id': ObjectID(coupon_decrypt) },
                                { '_s': ObjectID(store_decrypt) },
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'users_coupon',
                            'as': 'uc',
                            'localField': '_id',
                            'foreignField': '_cp',
                            'pipeline': [
                                {
                                    '$project': {
                                        'used': {
                                            '$cond': {
                                                'if': { '$eq': ['$isu', true] },
                                                'then': { '$toInt': '1' },
                                                'else': { '$toInt': '0' }
                                            }
                                        },
                                    }
                                },
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'date_id': { '$toDecimal': { '$toDate': '$_id' } }
                        }
                    },
                    {
                        '$addFields': {
                            'date_id': { '$round': [{ '$divide': ['$date_id', 1000] }, 4] },
                        }
                    },
                    {
                        '$addFields': {
                            'date_start': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$eps', 1000] } },
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'time_start': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$eps', 1000] } },
                                    'format': '%H:%M',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'date_end': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$epe', 1000] } },
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'time_end': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$epe', 1000] } },
                                    'format': '%H:%M',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'date_made': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$date_id', 1000] } },
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'time_made': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$date_id', 1000] } },
                                    'format': '%H:%M',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'now_coupon': { '$subtract': ['$lmt', { '$sum': '$uc.used' }] },
                        }
                    },
                    {
                        '$project': {
                            'name': '$nms',
                            'type': {
                                '$cond': {
                                    'if': { '$eq': ['$typ', 'po'] },
                                    'then': 'Ongkir',
                                    'else': 'Discount'
                                }
                            },
                            'target': {
                                '$cond': {
                                    'if': { '$eq': ['$tar', 'followed'] },
                                    'then': 'Pengikut Toko',
                                    'else': 'Semua Pembeli'
                                }
                            },
                            'period_start': { '$concat': ['$date_start', ' ', '$time_start'] },
                            'period_end': { '$concat': ['$date_end', ' ', '$time_end'] },
                            'made': { '$concat': ['$date_made', ' ', '$time_made'] },
                            'discount_minimal': {
                                '$cond': {
                                    'if': { '$lte': ['$vpc', { '$toInt': '1' }] },
                                    'then': { '$concat': [{ '$toString': { '$multiply': ['$vpc', 100] } }, '%'] },
                                    'else': {
                                        '$concat': ['Rp', {
                                            '$toString': {
                                                '$function': {
                                                    'body': rupiah_format_mongo,
                                                    'args': ['$vpc'],
                                                    'lang': 'js'
                                                }
                                            },
                                        }]
                                    }
                                }
                            },
                            'minimum_buy': '$vmi',
                            'quota': '$lmt',
                            'status': statusKupon(),
                            '_id': 0

                        }
                    }
                ]
            )

            res.status(200).json(jsonData(coupon_info))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async coupon_claim(req, res, next) {
        try {

            const { store_id, coupon_id } = req.params
            let { page, item_limit, search_name } = req.query

            let store_decrypt = decryptId(store_id, 12)
            let coupon_decrypt = decryptId(coupon_id, 12)

            let [coupon_claim] = await User_coupon.aggregate(queryPagination(
                [
                    {
                        '$match': {
                            '$and': [
                                { '_s': ObjectID(store_decrypt) },
                                { '_cp': ObjectID(coupon_decrypt) },
                                { '_gd': { '$eq': null } }
                            ]
                        }
                    },
                    {
                        '$group': {
                            '_id': '$_u',
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'users',
                            'localField': '_id',
                            'foreignField': '_id',
                            'as': 'user_data',
                            'pipeline': [
                                {
                                    '$lookup': {
                                        'from': 'sys_subscribe',
                                        'localField': '_id',
                                        'foreignField': '_u',
                                        'as': 'magic_mirror_price_qty',
                                        'pipeline': [
                                            {
                                                '$match': {
                                                    '$and': [
                                                        { 'pym.sts': 'settlement' }
                                                    ]
                                                }
                                            },
                                            {
                                                '$project': {
                                                    'prc': { '$sum': '$prc' },
                                                    'qty': { '$sum': 1 }
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    '$lookup': {
                                        'from': 'sys_vouchers',
                                        'as': 'voucher',
                                        'localField': '_id',
                                        'foreignField': '_u',
                                        'pipeline': [
                                            {
                                                '$match': {
                                                    '$and': [
                                                        { 'pym.sts': 'settlement' }
                                                    ]
                                                }
                                            },
                                            {
                                                '$addFields': {
                                                    'qty': { '$sum': 1 }
                                                }
                                            },
                                            {
                                                '$project': {
                                                    'prc': '$mon.amm',
                                                    'qty': '$qty'
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    '$lookup': {
                                        'from': 'sys_doctors',
                                        'as': 'doctor',
                                        'localField': '_id',
                                        'foreignField': '_u',
                                        'pipeline': [
                                            {
                                                '$match': {
                                                    '$and': [
                                                        { 'pym.sts': 'settlement' }
                                                    ]
                                                }
                                            },
                                            {
                                                '$addFields': {
                                                    'qty': { '$sum': 1 }
                                                }
                                            },
                                            {
                                                '$project': {
                                                    'prc': '$pym.amm',
                                                    'qty': '$qty'
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    '$lookup': {
                                        'from': 'sys_payment_glob',
                                        'localField': '_id',
                                        'foreignField': '_u',
                                        'pipeline': [
                                            {
                                                '$match': {
                                                    'pym.sts': 'settlement'
                                                }
                                            },
                                            {
                                                '$lookup': {
                                                    'from': 'sys_payment',
                                                    'localField': '_id',
                                                    'foreignField': '_gd',
                                                    'pipeline': [
                                                        {
                                                            '$match': {
                                                                'pym.sts': 'settlement'
                                                            }
                                                        },
                                                        {
                                                            '$project': {
                                                                'cuts': {
                                                                    '$add': [
                                                                        { '$add': ['$mon.glo', '$mon.gsc'] },
                                                                        { '$add': ['$mon.tlo', '$mon.tsc'] }
                                                                    ]
                                                                }
                                                            }
                                                        }
                                                    ],
                                                    'as': 'paymentx'
                                                }
                                            },
                                            {
                                                '$project': {
                                                    'amount': { '$ifNull': ['$pym.pyd.amm', { '$toInt': '0' }] },
                                                    'cuts': { '$sum': '$paymentx.cuts' }
                                                }
                                            }
                                        ],
                                        'as': 'purcases'
                                    }
                                },
                                {
                                    '$lookup': {
                                        'from': 'sys_payment',
                                        'localField': '_id',
                                        'foreignField': '_u',
                                        'pipeline': [
                                            {
                                                '$match': {
                                                    'pym.sts': 'settlement'
                                                }
                                            },
                                            {
                                                '$count': 'total'
                                            }
                                        ],
                                        'as': 'pym'
                                    }
                                },
                                {
                                    '$addFields': {
                                        'doctor_qty': { '$sum': '$doctor.qty' },
                                        'doctor_prc': { '$sum': '$doctor.prc' },

                                        'voucher_qty': { '$sum': '$voucher.qty' },
                                        'voucher_prc': { '$sum': '$voucher.prc' },

                                        'magic_mirror_qty': { '$sum': '$magic_mirror_price_qty.qty' },
                                        'magic_mirror_prc': { '$sum': '$magic_mirror_price_qty.prc' },

                                        'payment_qty': { '$ifNull': [{ '$sum': '$pym.total' }, { '$toInt': '0' }] },
                                        'payment_prc': { '$ifNull': [{ '$sum': '$purcases.amount' }, { '$toInt': '0' }] },
                                    }
                                },
                                {
                                    '$addFields': {
                                        'total_price': { '$sum': ['$voucher_prc', '$doctor_prc', '$magic_mirror_prc', '$payment_prc'] },
                                        'total_quantity': { '$sum': ['$voucher_qty', '$doctor_qty', '$magic_mirror_qty', '$payment_qty'] },
                                    }
                                },
                                {
                                    '$lookup': {
                                        'from': 'config',
                                        'let': {
                                            'my_price': '$total_price',
                                        },
                                        'pipeline': [
                                            { '$match': { 'type': 'membership' } },
                                            {
                                                '$project': {
                                                    '_id': 0,
                                                    'data': {
                                                        '$let': {
                                                            'vars': {
                                                                'p': {
                                                                    '$filter': {
                                                                        'input': '$data',
                                                                        'cond': { '$lte': ['$$this.minimum', { '$sum': '$$my_price' }] }
                                                                    }
                                                                }
                                                            },
                                                            'in': {
                                                                '$arrayElemAt': ['$$p', { '$indexOfArray': ['$$p.min', { '$max': '$$p.min' }] }]
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ],
                                        'as': 'membership'
                                    }
                                },
                                {
                                    '$unwind': { 'path': '$membership' }
                                },


                                {
                                    '$project': {
                                        'user_avatar': { '$concat': [`${rt_link}profile/self/avatar/`, '$dat.usr'] },
                                        'full_name': {
                                            '$reduce': {
                                                'input': '$dat.fln',
                                                'initialValue': '',
                                                'in': {
                                                    '$concat': [
                                                        '$$value',
                                                        { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                                        '$$this'
                                                    ]
                                                }
                                            }
                                        },
                                        'join_date': {
                                            '$dateToString': {
                                                'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                                'format': '%Y/%m/%d',
                                                'onNull': '2020-01-01'
                                            }
                                        },
                                        'total_price': { '$sum': ['$voucher_prc', '$doctor_prc', '$magic_mirror_prc', '$payment_prc'] },
                                        'total_quantity': { '$sum': ['$voucher_qty', '$doctor_qty', '$magic_mirror_qty', '$payment_qty'] },
                                        'membership': {
                                            'level': '$membership.data.level',
                                            'type': '$membership.data.type'
                                        },
                                        '_id': 0,
                                    }
                                },
                            ],
                        }
                    },
                    {
                        '$unwind': { 'path': '$user_data' }
                    },
                    {
                        '$sort': { 'user_data.total_price': -1 }
                    },
                    {
                        '$match': search_something('user_data.full_name', search_name)
                    },
                ],
                [
                    {
                        '$project': {
                            'user_avatar': '$user_data.user_avatar',
                            'full_name': '$user_data.full_name',
                            'join_date': '$user_data.join_date',
                            'total_price': '$user_data.total_price',
                            'total_quantity': '$user_data.total_quantity',
                            'membership': '$user_data.membership',
                            '_id': 0
                        }
                    }
                ], page, 3, item_limit
            ))

            res.status(200).json(jsonData(coupon_claim))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async coupon_use(req, res, next) {
        try {

            const { store_id, coupon_id } = req.params
            let { page, item_limit, search_all, filter } = req.query

            let store_decrypt = decryptId(store_id, 12)
            let coupon_decrypt = decryptId(coupon_id, 12)

            let filter_category = 0

            if (filter) {
                filter_category = { 'status': filter }
            } else {
                filter_category = {}
            }



            let [coupon_use] = await User_coupon.aggregate(queryPagination(
                [
                    {
                        '$match': {
                            '$and': [
                                { '_s': ObjectID(store_decrypt) },
                                { '_cp': ObjectID(coupon_decrypt) },
                                { '_gd': { '$ne': null } }
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'sys_payment',
                            'localField': '_gd',
                            'foreignField': '_gd',
                            'as': 'payment_data',
                            'pipeline': [
                                {
                                    '$match': { '_s': ObjectID(store_decrypt) }
                                },
                                {
                                    '$lookup': {
                                        'from': 'users',
                                        'as': 'user_data',
                                        'localField': '_u',
                                        'foreignField': '_id',
                                        'pipeline': [
                                            {
                                                '$project': {
                                                    'full_name': {
                                                        '$reduce': {
                                                            'input': '$dat.fln',
                                                            'initialValue': '',
                                                            'in': {
                                                                '$concat': [
                                                                    '$$value',
                                                                    { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                                                    '$$this'
                                                                ]
                                                            }
                                                        }
                                                    },
                                                    'user_avatar': { '$concat': [`${rt_link}profile/self/avatar/`, '$dat.usr'] }
                                                }
                                            }

                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'store_id': {
                                            '$function': {
                                                'body': encrypt,
                                                'args': [{ '$toString': '$_s' }, 12],
                                                'lang': 'js'
                                            }
                                        },
                                        'date_bought': {
                                            '$dateToString': {
                                                'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                                'format': '%Y-%m-%d',
                                                'onNull': '2020-01-01'
                                            }
                                        },
                                        'time_bought': {
                                            '$dateToString': {
                                                'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                                'format': '%H:%M',
                                                'onNull': '2020-01-01'
                                            }
                                        },
                                    }
                                },
                                {
                                    '$project': {
                                        'full_name': { '$ifNull': [{ '$first': '$user_data.full_name' }, '-'] },
                                        'user_avatar': { '$ifNull': [{ '$first': '$user_data.user_avatar' }, '-'] },

                                        'status': switch_status_order,
                                        'id_order': {
                                            '$function': {
                                                'body': encrypt,
                                                'args': [{ '$toString': '$_id' }, 12],
                                                'lang': 'js'
                                            }
                                        },
                                        'date_bought': { '$concat': ['$date_bought', ' ', '$time_bought'] },
                                        'shipping_service': '$shp.chn',
                                        'shipping_id': '$shp.rsi',
                                        'products': {
                                            '$map': {
                                                'input': '$dat',
                                                'in': {
                                                    'image': {
                                                        '$concat': [`${rt_link}store/ip/`, {
                                                            '$function': {
                                                                'body': encrypt,
                                                                'args': [{ '$toString': '$$this._p' }, 12],
                                                                'lang': 'js'
                                                            }
                                                        }, '/0']
                                                    },
                                                    'name': '$$this.pn',
                                                    'quantity': '$$this.qty',
                                                    'total': { '$multiply': ['$$this.qty', '$$this.prc'] },
                                                }
                                            }
                                        },
                                        '_id': 0
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$unwind': { 'path': '$payment_data' }
                    },
                    {
                        '$addFields': {
                            'full_name': '$payment_data.full_name',
                            'id_order': '$payment_data.id_order',
                            'shipping_id': '$payment_data.shipping_id',
                            'status': '$payment_data.status',

                        }
                    },
                    {
                        '$match': {
                            '$or': [
                                search_something('full_name', search_all),
                                search_something('id_order', search_all),
                                search_something('shipping_id', search_all)
                            ]
                        }
                    },
                    {
                        '$match': filter_category
                    }
                ],
                [
                    {
                        '$project': {
                            'full_name': '$payment_data.full_name',
                            'user_avatar': '$payment_data.user_avatar',
                            'status': '$payment_data.status',
                            'id_order': '$payment_data.id_order',
                            'date_bought': '$payment_data.date_bought',
                            'shipping_service': '$payment_data.shipping_service',
                            'shipping_id': '$payment_data.shipping_id',
                            'discount': '$vpc',
                            'products': '$payment_data.products',
                            '_id': 0
                        }
                    }

                ], page, 3, item_limit
            ))

            res.status(200).json(jsonData(coupon_use))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

}

module.exports = {
    SellerController
}