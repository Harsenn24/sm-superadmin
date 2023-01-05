const { date2number } = require("../helper/date2number")
const { encrypt } = require("../helper/enkrip_id")
const { jsonData } = require("../middleware/sucess")
const { User, Config, Stores_product, Store, Sys_products_seen, Doctor_chat, Sys_subscribe } = require("../model")
const { gross_income_query } = require("../query/all_income")
const { total_user } = require("../query/total_user")
const { total_store } = require("../query/total_store")
const { cartNetIncome } = require("../query/cart_all_income")
const { rt_link } = process.env

class DashboardController {
    static async net_income(req, res, next) {
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

            const gross_income = await Config.aggregate(gross_income_query(time_start, time_end, time_start_double, time_end_double))

            res.status(200).json(jsonData(gross_income[0]))
        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async netIncomeChart(req, res, next) {
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


            const netIncomeChart = await Config.aggregate(cartNetIncome(time_start, time_end, time_start_double, time_end_double))

            if (netIncomeChart.length === 0) { throw { message: 'Data not found' } }

            res.status(200).json(jsonData(netIncomeChart[0]))
        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async total_pengguna(req, res, next) {
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

            const total_pengguna = await User.aggregate(total_user(time_start, time_end, time_start_double, time_end_double))

            if (total_pengguna.length === 0) {
                throw { message: 'Data not found' }
            }
            res.status(200).json(jsonData(total_pengguna[0]))
        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async user_mm(req, res, next) {
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

            const totalUserMm = await Sys_subscribe.aggregate([
                {
                    '$match': {
                        '$and': [
                            { 'ep': { '$lte': time_start } },
                            { 'ep': { '$gte': time_end } },
                            { 'pym.sts': 'settlement' }
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
                        'totalPeople': { '$sum': 1 }
                    }
                },
                {
                    '$group': {
                        '_id': '$date',
                        'total': { '$sum': '$totalPeople' }
                    }
                },
                {
                    '$project': {
                        'x': '$_id',
                        'y': '$total',
                        'label': 'user_magic_mirror',
                        '_id': 0
                    }
                },
                {
                    '$sort': { 'x': 1 }
                }
            ])


            res.status(200).json(jsonData(totalUserMm))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async product_seen(req, res) {
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

            const user_activity = await Sys_products_seen.aggregate([

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

            ])
            res.status(200).json(jsonData(user_activity))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async total_consul(req, res, next) {
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


            const total_consul = await Doctor_chat.aggregate([
                {
                    '$sort': { '_id': -1 }
                },
                {
                    '$match': {
                        '$and': [
                            { 'ep': { '$lte': time_start } },
                            { 'ep': { '$gte': time_end } },
                            { 'end': false }
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
                        'label': 'Konsultasi'
                    }
                },
                {
                    '$sort': { 'x': 1 }
                }
            ])

            res.status(200).json(jsonData(total_consul))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async total_seller(req, res, next) {
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

            const total_seller = await Store.aggregate(total_store(time_start, time_end, time_start_double, time_end_double))

            if (total_seller.length === 0) {
                throw { message: 'Data not found' }
            }
            res.status(200).json(jsonData(total_seller[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }



    static async peringkatProduk(req, res, next) {
        try {
            const peringkatProduk = await Stores_product.aggregate([
                {
                    '$match': { 'det.del': false }
                },
                {
                    '$lookup': {
                        'from': 'stores',
                        'foreignField': '_id',
                        'localField': '_s',
                        'as': 'stores',
                        'pipeline': [
                            {
                                '$addFields': {
                                    'store_id': {
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
                                    '_id': 0,
                                    'storeName': '$det.nms',
                                    'store_image': { '$concat': [`${rt_link}store/i/`, { '$toString': '$store_id' }] },
                                }
                            }
                        ]
                    }
                },
                {
                    '$lookup': {
                        'from': 'sys_payment',
                        'foreignField': 'dat._p',
                        'localField': '_id',
                        'let': {
                            'store_id': '$_s',
                            'product_id': '$_id'
                        },
                        'as': 'pym',
                        'pipeline': [
                            {
                                '$match': {
                                    '$and': [
                                        { 'pym.sts': 'settlement' },
                                        { 'shp.sts': 'settlement' },
                                    ]
                                },
                            },
                            {
                                '$project': {
                                    'total_trx': {
                                        '$round': [
                                            {
                                                '$sum': {
                                                    '$filter': {
                                                        'input': {
                                                            '$map': {
                                                                'input': '$dat',
                                                                'in': {
                                                                    '$cond': {
                                                                        'if': { '$eq': ['$$this._p', '$$product_id'] },
                                                                        'then': {
                                                                            '$subtract': [{ '$sum': '$$this.qty' }, 0],
                                                                        },
                                                                        'else': null
                                                                    }
                                                                }
                                                            },
                                                        },
                                                        'cond': [
                                                            { $ne: ['$$this', null] },
                                                        ]

                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        ]
                    }
                },
                {
                    '$project': {
                        'sales_qty': { '$sum': '$pym.total_trx' },
                        '_id': 0,
                        'store_name': { '$first': '$stores.storeName' },
                        'store_image': { '$first': '$stores.store_image' },
                        'product_name': '$det.nms',
                        'product_image': {
                            '$concat': [`${rt_link}store/ip/`, {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            }, '/0']
                        },
                    }
                },
                {
                    '$sort': { 'sales_qty': -1 }
                },
                {
                    '$limit': 10
                }
            ])
            res.status(200).json(jsonData(peringkatProduk))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async peringkatSeller(req, res, next) {
        try {
            const peringkatSeller = await Store.aggregate([
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
                    '$lookup': {
                        'from': 'sys_payment',
                        'localField': '_id',
                        'foreignField': '_s',
                        'as': 'pym',
                        'pipeline': [
                            // {
                            //     '$match': { 'pym.sts': { '$nin': ['failed'] } },
                            // },
                            {
                                '$match': {
                                    '$and': [
                                        { 'pym.sts': 'settlement' },
                                        { 'shp.sts': 'settlement' },
                                    ]
                                }
                            },
                            {
                                '$project': {
                                    'total': '$mon.tot'
                                }
                            }
                        ]
                    }
                },
                {
                    '$project': {
                        'store_image': { '$concat': [`${rt_link}store/i/`, { '$toString': '$store_id' }] },
                        'store_name': '$det.nms',
                        'total_trx': { '$ifNull': [{ '$sum': '$pym.total' }, { '$toInt': '0' }] },
                        '_id': 0
                    }
                },
                {
                    '$sort': { 'total_trx': -1 }
                },
                {
                    '$limit': 10
                }
            ])
            res.status(200).json(jsonData(peringkatSeller))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async peringkatUser(req, res) {
        try {
            const peringkatUser = await User.aggregate([
                {
                    '$lookup': {
                        'from': 'sys_subscribe',
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
                                '$project': {
                                    'prc': '$prc',
                                }
                            }
                        ],
                        'as': 'magic_mirror'
                    }
                },
                {
                    '$lookup': {
                        'from': 'sys_vouchers',
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
                                '$project': {
                                    'prc': '$mon.amm',
                                }
                            }
                        ],
                        'as': 'voucher'
                    }
                },
                {
                    '$lookup': {
                        'from': 'sys_doctors',
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
                                '$project': {
                                    'prc': '$pym.amm',
                                }
                            }
                        ],
                        'as': 'doctor'
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
                    '$addFields': {
                        'magic_mirror_prc': { '$sum': '$magic_mirror.prc' },
                        'voucher_prc': { '$sum': '$voucher.prc' },
                        'payment_prc': { '$ifNull': [{ '$sum': '$purcases.amount' }, { '$toInt': '0' }] },
                        'doctor_prc': { '$sum': '$doctor.prc' },
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
                    '$addFields': {
                        'total_trx': {
                            '$add': ['$magic_mirror_prc', '$voucher_prc', '$payment_prc', '$doctor_prc']
                        }
                    }
                },
                {
                    '$project': {
                        '_id': 0,
                        'name': '$name',
                        'total_trx': { '$round': '$total_trx' },
                        'user_avatar': { '$concat': [`${rt_link}profile/self/avatar/`, '$dat.usr'] }
                    }
                },
                {
                    '$sort': { 'total_trx': -1 }
                },
                {
                    '$limit': 10
                }

            ])
            res.status(200).json(jsonData(peringkatUser))
        } catch (error) {
            console.log(error);
        }
    }

    static async categoryIncome(req, res, next) {
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

            const categoryIncome = await Config.aggregate([
                {
                    '$limit': 1
                },
                {
                    '$lookup': {
                        'from': 'sys_subscribe',
                        'as': 'magicMirror',
                        'pipeline': [
                            {
                                '$sort': { 'id': -1 }
                            },
                            {
                                '$facet': {
                                    'labaNow': [
                                        {
                                            '$match': {
                                                '$and': [
                                                    { 'ep': { $lte: time_start } },
                                                    { 'ep': { $gte: time_end } },
                                                    { 'pym.sts': 'settlement' }
                                                ]
                                            }
                                        },
                                        {
                                            '$addFields': {
                                                // 'labaSatuan': {
                                                //     '$subtract': [
                                                //         '$mon.amm', { '$add': ['$mon.pph', '$mon.ppn', '$mon.fee'] }
                                                //     ]
                                                // }
                                                'labaSatuan': '$prc'

                                            }
                                        },
                                        {
                                            '$project': {
                                                'laba': { '$sum': '$labaSatuan' },
                                                '_id': 0
                                            }
                                        }
                                    ],
                                    'labaDouble': [
                                        {
                                            '$match': {
                                                '$and': [
                                                    { 'ep': { $lte: time_start_double } },
                                                    { 'ep': { $gte: time_end_double } },
                                                    { 'pym.sts': 'settlement' }

                                                ]
                                            }
                                        },
                                        {
                                            '$addFields': {
                                                // 'labaSatuan': {
                                                //     '$subtract': [
                                                //         '$mon.amm', { '$add': ['$mon.pph', '$mon.ppn', '$mon.fee'] }
                                                //     ]
                                                // }
                                                'labaSatuan': '$prc'
                                            }
                                        },
                                        {
                                            '$project': {
                                                'laba': { '$sum': '$labaSatuan' },
                                                '_id': 0
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                '$addFields': {
                                    'mm_now': { '$ifNull': [{ '$sum': '$labaNow.laba' }, { '$toInt': '0' }] },
                                    'mm_double': { '$ifNull': [{ '$sum': '$labaDouble.laba' }, { '$toInt': '0' }] },
                                }
                            },
                            {
                                '$addFields': {
                                    'mm_percent': {
                                        '$multiply': [
                                            {
                                                '$divide': [
                                                    { '$subtract': ['$mm_now', '$mm_double'] },
                                                    {
                                                        '$cond': {
                                                            'if': { '$lte': ['$mm_double', 0] },
                                                            'then': 1,
                                                            'else': '$mm_double'
                                                        }
                                                    }
                                                ]
                                            }, 100
                                        ]
                                    }
                                }
                            }

                        ]
                    }
                },
                {
                    '$lookup': {
                        'from': 'sys_payment',
                        'as': 'payment',
                        'pipeline': [
                            {
                                '$sort': { 'id': -1 }
                            },
                            {
                                '$facet': {
                                    'pay_now': [
                                        {
                                            '$match': {
                                                '$and': [
                                                    { 'ep': { $lte: time_start } },
                                                    { 'ep': { $gte: time_end } },
                                                    { 'pym.sts': 'settlement' },
                                                    { 'shp.sts': 'settlement' }

                                                ]
                                            }
                                        },
                                        {
                                            '$addFields': {
                                                // 'labaSatuan': { '$subtract': ['$mon.fee', { '$add': ['$mon.pph', '$mon.ppn'] }] }
                                                'labaSatuan': '$mon.fee'

                                            }
                                        },
                                        {
                                            '$project': {
                                                'laba': { '$sum': '$labaSatuan' },
                                                '_id': 0

                                            }
                                        }
                                    ],
                                    'pay_double': [
                                        {
                                            '$match': {
                                                '$and': [
                                                    { 'ep': { $lte: time_start_double } },
                                                    { 'ep': { $gte: time_end_double } },
                                                    { 'pym.sts': 'settlement' },
                                                    { 'shp.sts': 'settlement' }
                                                ]
                                            }
                                        },
                                        {
                                            '$addFields': {
                                                // 'labaSatuan': { '$subtract': ['$mon.fee', { '$add': ['$mon.pph', '$mon.ppn'] }] }
                                                'labaSatuan': '$mon.fee'

                                            }
                                        },
                                        {
                                            '$project': {
                                                'laba': { '$sum': '$labaSatuan' },
                                                '_id': 0

                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                '$addFields': {
                                    'pay_now': { '$ifNull': [{ '$sum': '$pay_now.laba' }, { '$toInt': '0' }] },
                                    'pay_double': { '$ifNull': [{ '$sum': '$pay_double.laba' }, { '$toInt': '0' }] },
                                }
                            },
                            {
                                '$addFields': {
                                    'pay_percent': {
                                        '$multiply': [
                                            {
                                                '$divide': [
                                                    { '$subtract': ['$pay_now', '$pay_double'] },
                                                    {
                                                        '$cond': {
                                                            'if': { '$lte': ['$pay_double', 0] },
                                                            'then': 1,
                                                            'else': '$pay_double'
                                                        }
                                                    }
                                                ]
                                            }, 100
                                        ]
                                    }
                                }
                            }
                        ]
                    }
                },
                {
                    '$lookup': {
                        'from': 'sys_vouchers',
                        'as': 'voucher',
                        'pipeline': [
                            {
                                '$sort': { 'id': -1 }
                            },
                            {
                                '$facet': {
                                    'vch_now': [
                                        {
                                            '$match': {
                                                '$and': [
                                                    { 'ep': { $lte: time_start } },
                                                    { 'ep': { $gte: time_end } },
                                                    { 'pym.sts': 'settlement' }
                                                ]
                                            }
                                        },
                                        {
                                            '$addFields': {
                                                // 'labaSatuan': { '$subtract': ['$mon.fee', { '$add': ['$mon.pph', '$mon.ppn'] }] }
                                                'labaSatuan': '$mon.fee'
                                            }
                                        },
                                        {
                                            '$project': {
                                                'laba': { '$sum': '$labaSatuan' },
                                                '_id': 0

                                            }
                                        }
                                    ],
                                    'vch_double': [
                                        {
                                            '$match': {
                                                '$and': [
                                                    { 'ep': { $lte: time_start_double } },
                                                    { 'ep': { $gte: time_end_double } },
                                                    { 'pym.sts': 'settlement' }

                                                ]
                                            }
                                        },
                                        {
                                            '$addFields': {
                                                // 'labaSatuan': { '$subtract': ['$mon.fee', { '$add': ['$mon.pph', '$mon.ppn'] }] }
                                                'labaSatuan': '$mon.fee'

                                            }
                                        },
                                        {
                                            '$project': {
                                                'laba': { '$sum': '$labaSatuan' },
                                                '_id': 0

                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                '$addFields': {
                                    'vch_now': { '$ifNull': [{ '$sum': '$vch_now.laba' }, { '$toInt': '0' }] },
                                    'vch_double': { '$ifNull': [{ '$sum': '$vch_double.laba' }, { '$toInt': '0' }] },
                                }
                            },
                            {
                                '$addFields': {
                                    'vch_percent': {
                                        '$multiply': [
                                            {
                                                '$divide': [
                                                    { '$subtract': ['$vch_now', '$vch_double'] },
                                                    {
                                                        '$cond': {
                                                            'if': { '$lte': ['$vch_double', 0] },
                                                            'then': 1,
                                                            'else': '$vch_double'
                                                        }
                                                    }
                                                ]
                                            }, 100
                                        ]
                                    }
                                }
                            }
                        ]
                    }
                },
                {
                    '$lookup': {
                        'from': 'sys_doctors',
                        'as': 'doctor',
                        'pipeline': [
                            {
                                '$sort': { 'id': -1 }
                            },
                            {
                                '$facet': {
                                    'dc_now': [
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
                                                    { 'date_id': { $lte: time_start } },
                                                    { 'date_id': { $gte: time_end } },
                                                    { 'pym.sts': 'settlement' }
                                                ]
                                            }
                                        },
                                        {
                                            '$addFields': {
                                                'labaSatuan': '$mon.fee'
                                            }
                                        },
                                        {
                                            '$project': {
                                                'laba': { '$sum': '$labaSatuan' },
                                                '_id': 0

                                            }
                                        }
                                    ],
                                    'dc_double': [
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
                                                    { 'date_id': { $lte: time_start_double } },
                                                    { 'date_id': { $gte: time_end_double } },
                                                    { 'pym.sts': 'settlement' }
                                                ]
                                            }
                                        },
                                        {
                                            '$addFields': {
                                                'labaSatuan': '$mon.fee'
                                            }
                                        },
                                        {
                                            '$project': {
                                                'laba': { '$sum': '$labaSatuan' },
                                                '_id': 0

                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                '$addFields': {
                                    'dc_now': { '$ifNull': [{ '$sum': '$dc_now.laba' }, { '$toInt': '0' }] },
                                    'dc_double': { '$ifNull': [{ '$sum': '$dc_double.laba' }, { '$toInt': '0' }] },
                                }
                            },
                            {
                                '$addFields': {
                                    'dc_percent': {
                                        '$multiply': [
                                            {
                                                '$divide': [
                                                    { '$subtract': ['$dc_now', '$dc_double'] },
                                                    {
                                                        '$cond': {
                                                            'if': { '$lte': ['$dc_double', 0] },
                                                            'then': 1,
                                                            'else': '$dc_double'
                                                        }
                                                    }
                                                ]
                                            }, 100
                                        ]
                                    }
                                }
                            }
                        ]
                    }
                },
                {
                    '$addFields': {
                        'magic_mirror': { '$first': '$magicMirror.mm_now' },
                        'doctor': { '$first': '$doctor.dc_now' },
                        'admin': {
                            '$add': [{ '$first': '$payment.pay_now' }, { '$first': '$voucher.vch_now' }],
                        }
                    }
                },
                {
                    '$addFields': {
                        'totalCategory': { '$add': ['$magic_mirror', '$doctor', '$admin'] }
                    }
                },
                {
                    '$project': {
                        'doctor': {
                            'income': '$doctor',
                            'percent': {
                                '$round': [{
                                    '$multiply': [{
                                        '$divide': ['$doctor', {
                                            '$cond': {
                                                'if': { '$lte': ['$totalCategory', 0] },
                                                'then': 1,
                                                'else': '$totalCategory'
                                            }
                                        }]
                                    }, 100]
                                }, 2]
                            }
                        },
                        'admin': {
                            'income': '$admin',
                            'percent': {
                                '$round': [{
                                    '$multiply': [{
                                        '$divide': ['$admin', {
                                            '$cond': {
                                                'if': { '$lte': ['$totalCategory', 0] },
                                                'then': 1,
                                                'else': '$totalCategory'
                                            }
                                        }]
                                    }, 100]
                                }, 2]
                            }
                        },
                        'magic_mirror': {
                            'income': '$magic_mirror',
                            'percent': {
                                '$round': [{
                                    '$multiply': [{
                                        '$divide': ['$magic_mirror', {
                                            '$cond': {
                                                'if': { '$lte': ['$totalCategory', 0] },
                                                'then': 1,
                                                'else': '$totalCategory'
                                            }
                                        }]
                                    }, 100]
                                }, 2]
                            }
                        },
                        '_id': 0
                    }
                }
            ])

            if (categoryIncome.length === 0) { throw { message: 'Data not found' } }

            res.status(200).json(jsonData(categoryIncome[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async magic_mirror_percentage(req, res, next) {
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

            const magic_mirror_percentage = await User.aggregate(
                [

                    {
                        '$lookup': {
                            'from': 'sys_subscribe',
                            'localField': '_id',
                            'foreignField': '_u',
                            'as': 'm_mirror',
                            'pipeline': [
                                {
                                    '$project': {
                                        'total': { '$sum': 1 }
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'subscribe': {
                                '$cond': {
                                    'if': { '$gte': [{ '$size': '$m_mirror' }, 1] },
                                    'then': true,
                                    'else': false
                                }
                            },
                        }
                    },
                    {
                        '$facet': {
                            'user_subs': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'subscribe': true },
                                            { 'dat.act': true },
                                            { 'ep': { '$lte': time_start } },
                                            { 'ep': { '$gte': time_end } },
                                        ]
                                    }
                                },
                                {
                                    '$count': 'total'
                                }
                            ],
                            'user_not_subs': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'subscribe': false },
                                            { 'dat.act': true },
                                            { 'ep': { '$lte': time_start } },
                                            { 'ep': { '$gte': time_end } },
                                        ]
                                    }
                                },
                                {
                                    '$count': 'total'
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'user_subs': { '$ifNull': [{ '$first': '$user_subs.total' }, { '$toInt': '0' }] },
                            'user_not_subs': { '$ifNull': [{ '$first': '$user_not_subs.total' }, { '$toInt': '0' }] },
                        }
                    },
                    {
                        '$addFields': {
                            'total_user': { '$add': ['$user_subs', '$user_not_subs'] },
                            'percent_subs': {
                                '$round': [
                                    {
                                        '$divide': [
                                            { '$multiply': ['$user_subs', 100] },
                                            { '$add': ['$user_subs', '$user_not_subs'] }
                                        ]
                                    },
                                    2
                                ]
                            },
                        }
                    },
                    {
                        '$project': {
                            'user_subscribe': {
                                'total': '$user_subs',
                                'percent': '$percent_subs'
                            },
                            'total_user': '$total_user',
                            '_id': 0
                        }
                    }
                ]
            )

            res.status(200).json(jsonData(magic_mirror_percentage[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async statistic_seller(req, res, next) {
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

            const statistic_seller = await Store.aggregate(
                [

                    {
                        '$facet': {
                            'store_active': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start } },
                                            { 'ep': { '$gte': time_end } },
                                            { 'det.act': true },
                                            { 'epj': null }
                                        ]
                                    }
                                },
                                {
                                    '$count': 'total'
                                }
                            ],
                            'store_inactive': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start } },
                                            { 'ep': { '$gte': time_end } },
                                            { 'det.act': false },
                                            { 'epj': { '$ne': null } }
                                        ]
                                    }
                                },
                                {
                                    '$count': 'total'
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'store_active': { '$ifNull': [{ '$first': '$store_active.total' }, { '$toInt': '0' }] },
                            'store_inactive': { '$ifNull': [{ '$first': '$store_inactive.total' }, { '$toInt': '0' }] },
                        }
                    },
                    {
                        '$addFields': {
                            'percent_store_active': {
                                '$round': [
                                    {
                                        '$divide': [
                                            { '$multiply': ['$store_active', 100] },
                                            { '$add': ['$store_active', '$store_inactive'] }
                                        ]
                                    },
                                    2
                                ]
                            },
                            'percent_store_inactive': {
                                '$round': [
                                    {
                                        '$divide': [
                                            { '$multiply': ['$store_inactive', 100] },
                                            { '$add': ['$store_active', '$store_inactive'] }
                                        ]
                                    },
                                    2
                                ]
                            }
                        }
                    },
                    {
                        '$project': {
                            'storeActive': {
                                'total': '$store_active',
                                'percent': '$percent_store_active'
                            },
                            'StoreInactive': {
                                'total': '$store_inactive',
                                'percent': '$percent_store_inactive'
                            },
                            '_id': 0
                        }
                    }
                ]
            )

            res.status(200).json(jsonData(statistic_seller[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }
}

module.exports = { DashboardController }