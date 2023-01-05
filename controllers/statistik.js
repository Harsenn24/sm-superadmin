const { date2number } = require("../helper/date2number")
const { encrypt } = require("../helper/enkrip_id")
const { jsonData } = require("../middleware/sucess")
const { Sys_payment, User, Store, Stores_product, Config, Sys_subscribe } = require("../model")
const switchbranch = require("../query/status_branch")
const { top_prod } = require("../query/top_product")
const { top_store } = require("../query/top_seller")
const { total_user } = require("../query/total_user")
const { cartNetIncome } = require("../query/cart_all_income")
const { total_store } = require("../query/total_store")
const { rt_link } = process.env


class StatistikController {
    static async total_net_income(req, res, next) {
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


            const gross_income = await Config.aggregate(cartNetIncome(time_start, time_end, time_start_double, time_end_double))

            res.status(200).json(jsonData(gross_income[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async total_user(req, res, next) {
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

            res.status(200).json(jsonData(total_pengguna[0]))
        } catch (error) {
            console.log(error)
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

            res.status(200).json(jsonData(total_seller[0]))
        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async top_product(req, res, next) {
        try {
            const top_product = await Stores_product.aggregate(top_prod(encrypt, rt_link))

            if (top_product.length === 0) {
                throw { message: 'Data not found' }
            }

            res.status(200).json(jsonData(top_product[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async top_seller(req, res, next) {
        try {
            const top_seller = await Store.aggregate(top_store(encrypt, rt_link))

            if (top_seller.length === 0) {
                throw { message: 'Data not found' }
            }

            res.status(200).json(jsonData(top_seller[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async genderBuyer(req, res, next) {
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

            const productGender = await Config.aggregate(
                [
                    {
                        '$limit': 1
                    },
                    {
                        '$lookup': {
                            'from': 'sys_payment',
                            'as': 'products',
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
                                    '$lookup': {
                                        'from': 'users',
                                        'as': 'us',
                                        'localField': '_u',
                                        'foreignField': '_id',
                                        'pipeline': [
                                            {
                                                '$addFields': {
                                                    'gender': {
                                                        '$cond': {
                                                            'if': { '$eq': ['$dat.sex', 'M'] },
                                                            'then': 'Male',
                                                            'else': {
                                                                '$cond': {
                                                                    'if': { '$eq': ['$dat.sex', 'F'] },
                                                                    'then': 'Female',
                                                                    'else': '-'
                                                                }
                                                            }
                                                        }
                                                    },
                                                }
                                            },
                                        ]
                                    }
                                },
                                {
                                    '$unwind': { 'path': '$us' }
                                },
                                {
                                    '$group': {
                                        '_id': '$_u',
                                        'gender': { '$first': '$us.gender' },
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'sys_vouchers',
                            'as': 'vouchers',
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
                                    '$lookup': {
                                        'from': 'users',
                                        'as': 'us',
                                        'localField': '_u',
                                        'foreignField': '_id',
                                        'pipeline': [
                                            {
                                                '$addFields': {
                                                    'gender': {
                                                        '$cond': {
                                                            'if': { '$eq': ['$dat.sex', 'M'] },
                                                            'then': 'Male',
                                                            'else': {
                                                                '$cond': {
                                                                    'if': { '$eq': ['$dat.sex', 'F'] },
                                                                    'then': 'Female',
                                                                    'else': '-'
                                                                }
                                                            }
                                                        }
                                                    },
                                                }
                                            },
                                        ]
                                    }
                                },
                                {
                                    '$unwind': { 'path': '$us' }
                                },
                                {
                                    '$group': {
                                        '_id': '$_u',
                                        'gender': { '$first': '$us.gender' },
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'sys_doctors',
                            'as': 'doctors',
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
                                            { 'date_id': { '$lte': time_start } },
                                            { 'date_id': { '$gte': time_end } },
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
                                                '$addFields': {
                                                    'gender': {
                                                        '$cond': {
                                                            'if': { '$eq': ['$dat.sex', 'M'] },
                                                            'then': 'Male',
                                                            'else': {
                                                                '$cond': {
                                                                    'if': { '$eq': ['$dat.sex', 'F'] },
                                                                    'then': 'Female',
                                                                    'else': '-'
                                                                }
                                                            }
                                                        }
                                                    },
                                                }
                                            },
                                        ]
                                    }
                                },
                                {
                                    '$unwind': { 'path': '$us' }
                                },
                                {
                                    '$group': {
                                        '_id': '$_u',
                                        'gender': { '$first': '$us.gender' },
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$project': {
                            'data': { '$concatArrays': ['$products', '$vouchers', '$doctors'] },
                            '_id': 0
                        }
                    },
                    {
                        '$unwind': {
                            'path': '$data'
                        }
                    },
                    {
                        '$project': {
                            'gender': '$data.gender',
                            '_id': '$data._id'
                        }
                    }

                ]
            )


            let proGender = {
                female: 0,
                male: 0,
                unknown: 0
            }

            for (let i = 0; i < productGender.length; i++) {
                if (productGender[i].gender === 'Female') { proGender.female += 1 }
                if (productGender[i].gender === 'Male') { proGender.male += 1 }
                if (productGender[i].gender === '-') { proGender.unknown += 1 }
            }

            let total = proGender.female + proGender.male + proGender.unknown

            let percentFemale = (proGender.female / total * 100)
            let percentMale = (proGender.male / total * 100)
            let percentUnknown = (proGender.unknown / total * 100)


            const result = {
                Female: {
                    percent: +percentFemale.toFixed(2),
                    total: proGender.female
                },
                Male: {
                    percent: +percentMale.toFixed(2),
                    total: proGender.male
                },
                Unknown: {
                    percent: +percentUnknown.toFixed(2),
                    total: proGender.unknown
                },
            }


            res.status(200).json(jsonData(result))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }





    static async income_mm(req, res, next) {
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
            const income_mm = await Sys_subscribe.aggregate([
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
                                    'income': {
                                        '$subtract': ['$mon.amm', { '$add': ['$mon.pph', '$mon.ppn', '$mon.fee'] }
                                        ]
                                    }
                                }
                            },
                            {
                                '$group': {
                                    '_id': '$date',
                                    'totalIncome': { '$sum': '$income' },
                                }
                            },
                            {
                                '$project': {
                                    'x': '$_id',
                                    'y': '$totalIncome',
                                    '_id': 0
                                }
                            },
                            {
                                '$sort': { 'x': 1 }
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
                                '$addFields': {
                                    'income': {
                                        '$subtract': ['$mon.amm', { '$add': ['$mon.pph', '$mon.ppn', '$mon.fee'] }
                                        ]
                                    }
                                }
                            },
                            {
                                '$group': {
                                    '_id': '$date',
                                    'totalIncome': { '$sum': '$income' },
                                }
                            },
                            {
                                '$project': {
                                    'x': '$_id',
                                    'y': '$totalIncome',
                                    '_id': 0

                                }
                            }
                        ],

                    }
                },
                {
                    '$addFields': {
                        'data_a': { '$sum': '$data_now.y' },
                        'data_b': { '$sum': '$data_double.y' },
                    }
                },
                {
                    '$addFields': {
                        'percent': {
                            '$round': [{
                                '$multiply': [
                                    {
                                        '$divide': [
                                            { '$subtract': ['$data_a', '$data_b'] },
                                            {
                                                '$cond': {
                                                    'if': { '$lte': ['$data_b', 0] },
                                                    'then': 1,
                                                    'else': '$data_b'
                                                }
                                            }
                                        ]
                                    }, 100
                                ]
                            }, 2]
                        },
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
                        'income': '$data_a',
                        'percent': '$percent',
                        'diff_day': '$diffDays',
                        'statistic': '$data_now',
                        '_id': 0
                    }
                }
            ])
            res.status(200).json(jsonData(income_mm[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async review(req, res, next) {
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

            const tinjauan = await Config.aggregate([
                {
                    '$limit': 1
                },
                {
                    '$lookup': {
                        'from': 'sys_payment',
                        'as': 'pym',
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
                                    'status': switchbranch
                                }
                            },
                            {
                                '$facet': {
                                    'new-order': [
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
                                                'status': 'packed'
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
                                    'new_order': { '$ifNull': [{ '$first': '$new-order.total' }, { '$toInt': '0' }] },
                                    'packed': { '$ifNull': [{ '$first': '$packed.total' }, { '$toInt': '0' }] },
                                }
                            }
                        ]
                    }
                },
                {
                    '$lookup': {
                        'from': 'sys_products_seen',
                        'as': 'prd_seen',
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
                                '$count': 'total'
                            }
                        ]
                    }
                },
                {
                    '$project': {
                        '_id': 0,
                        'visit': { '$ifNull': [{ '$first': '$prd_seen.total' }, { '$toInt': '0' }] },
                        'new_order': { '$ifNull': [{ '$first': '$pym.new_order' }, { '$toInt': '0' }] },
                        'packed': { '$ifNull': [{ '$first': '$pym.packed' }, { '$toInt': '0' }] },
                    }
                }
            ])

            if (tinjauan.length === 0) {
                throw { message: 'Data not found' }
            }
            res.status(200).json(jsonData(tinjauan[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async allNetIncome(req, res, next) {
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

            const allNetIncome = await Config.aggregate(
                [
                    {
                        '$limit': 1
                    },
                    {
                        '$lookup': {
                            'from': 'sys_subscribe',
                            'as': 'magic_mirror',
                            'pipeline': [
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
                                        'income': '$prn'
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
                        '$lookup': {
                            'from': 'sys_payment',
                            'as': 'product',
                            'pipeline': [
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
                                        'income': '$mon.fen'
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
                        '$lookup': {
                            'from': 'sys_vouchers',
                            'as': 'voucher',
                            'pipeline': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { $lte: time_start } },
                                            { 'ep': { $gte: time_end } },
                                            { 'pym.sts': 'settlement' },

                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'income': '$mon.fen'
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
                        '$lookup': {
                            'from': 'sys_doctors',
                            'as': 'doctor',
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
                                            { 'date_id': { $lte: time_start } },
                                            { 'date_id': { $gte: time_end } },
                                            { 'pym.sts': 'settlement' },

                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'income': '$mon.fen'
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
                            'magic_mirror': { '$sum': '$magic_mirror.total_income' },
                            'doctor': { '$sum': '$doctor.total_income' },
                            'voucher': { '$sum': '$voucher.total_income' },
                            'product': { '$sum': '$product.total_income' },
                        }
                    },
                    {
                        '$addFields': {
                            'total': { '$add': ['$magic_mirror', '$doctor', '$voucher', '$product'] }
                        }
                    },
                    {
                        '$addFields': {
                            'percent_magic_mirror': {
                                '$round': [{
                                    '$multiply': [
                                        {
                                            '$divide': ['$magic_mirror',
                                                {
                                                    '$cond': {
                                                        'if': { '$lte': ['$total', 0] },
                                                        'then': 1,
                                                        'else': '$total'
                                                    }
                                                }
                                            ]
                                        }, 100
                                    ]
                                }, 2]
                            },
                            'percent_product': {
                                '$round': [{
                                    '$multiply': [
                                        {
                                            '$divide': ['$product',
                                                {
                                                    '$cond': {
                                                        'if': { '$lte': ['$total', 0] },
                                                        'then': 1,
                                                        'else': '$total'
                                                    }
                                                }
                                            ]
                                        }, 100
                                    ]
                                }, 2]
                            },
                            'percent_voucher': {
                                '$round': [{
                                    '$multiply': [
                                        {
                                            '$divide': ['$voucher',
                                                {
                                                    '$cond': {
                                                        'if': { '$lte': ['$total', 0] },
                                                        'then': 1,
                                                        'else': '$total'
                                                    }
                                                }
                                            ]
                                        }, 100
                                    ]
                                }, 2]
                            },
                            'percent_doctor': {
                                '$round': [{
                                    '$multiply': [
                                        {
                                            '$divide': ['$doctor',
                                                {
                                                    '$cond': {
                                                        'if': { '$lte': ['$total', 0] },
                                                        'then': 1,
                                                        'else': '$total'
                                                    }
                                                }
                                            ]
                                        }, 100
                                    ]
                                }, 2]
                            }
                        }
                    },
                    {
                        '$project': {
                            '_id': 0,
                            'skin_mystery': {
                                'income': '$magic_mirror',
                                'percent': '$percent_magic_mirror'
                            },
                            'product': {
                                'income': '$product',
                                'percent': '$percent_product'
                            },
                            'doctor': {
                                'income': '$doctor',
                                'percent': '$percent_doctor'
                            },
                            'voucher': {
                                'income': '$voucher',
                                'percent': '$percent_voucher'
                            }
                        }
                    }
                ]
            )

            res.status(200).json(jsonData(allNetIncome[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async totalUserMm(req, res, next) {
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

            const totalUserMm = await Sys_subscribe.aggregate(
                [
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
                        '$facet': {
                            'dataNow': [
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
                                        '_id': {
                                            'a': '$date',
                                            'b': '$_u'
                                        },
                                        'totalNow': { '$sum': '$total' }
                                    }
                                },
                                {
                                    '$sort': { '_id.a': 1 }
                                },
                                {
                                    '$group': {
                                        '_id': '$_id.a',
                                        'totalNow': { '$sum': '$totalNow' }
                                    }
                                },
                                {
                                    '$project': {
                                        'x': '$_id',
                                        'y': '$totalNow',
                                        '_id': 0
                                    }
                                },
                                {
                                    '$sort': { 'x': 1 }
                                }

                            ],
                            'dataDouble': [
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
                                        '_id': {
                                            'a': '$date',
                                            'b': '$_u'
                                        },
                                        'totalDouble': { '$sum': '$total' }
                                    }
                                },
                                {
                                    '$project': {
                                        'x': '$_id.a',
                                        'y': '$totalDouble',
                                        '_id': 0
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'data_now': { '$sum': '$dataNow.y' },
                            'data_double': { '$sum': '$dataDouble.y' },
                            'diff_day': {
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
                            'percent': {
                                '$round': [{
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
                                }, 2]
                            },
                        }
                    },
                    {
                        '$project': {
                            'total_user': '$data_now',
                            'percent': '$percent',
                            'diff_day': '$diff_day',
                            'statistic': '$dataNow',
                            '_id': 0
                        }
                    }
                ]
            )

            res.status(200).json(jsonData(totalUserMm[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async yearlyUserMm(req, res, next) {
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

            const yearlyUserMm = await Sys_subscribe.aggregate(
                [
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
                        '$facet': {
                            'dataNow': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start } },
                                            { 'ep': { '$gte': time_end } },
                                            { 'typ': { '$eq': 'yearly' } }
                                        ]
                                    }
                                },
                                {
                                    '$group': {
                                        '_id': {
                                            'a': '$date',
                                            'b': '$_u'
                                        },
                                        'totalNow': { '$sum': '$total' }
                                    }
                                },
                                {
                                    '$sort': { '_id.a': 1 }
                                },
                                {
                                    '$group': {
                                        '_id': '$_id.a',
                                        'totalNow': { '$sum': '$totalNow' }
                                    }
                                },
                                {
                                    '$project': {
                                        'x': '$_id',
                                        'y': '$totalNow',
                                        '_id': 0
                                    }
                                },
                                {
                                    '$sort': { 'x': 1 }
                                }

                            ],
                            'dataDouble': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start_double } },
                                            { 'ep': { '$gte': time_end_double } },
                                            { 'typ': { '$eq': 'yearly' } }
                                        ]
                                    }
                                },
                                {
                                    '$group': {
                                        '_id': {
                                            'a': '$date',
                                            'b': '$_u'
                                        },
                                        'totalDouble': { '$sum': '$total' }
                                    }
                                },
                                {
                                    '$project': {
                                        'x': '$_id.a',
                                        'y': '$totalDouble',
                                        '_id': 0
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'data_now': { '$sum': '$dataNow.y' },
                            'data_double': { '$sum': '$dataDouble.y' },
                            'diff_day': {
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
                            'percent': {
                                '$round': [{
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
                                }, 2]
                            },
                        }
                    },
                    {
                        '$project': {
                            'total_user': '$data_now',
                            'percent': '$percent',
                            'diff_day': '$diff_day',
                            'statistic': '$dataNow',
                            '_id': 0
                        }
                    }
                ]
            )

            res.status(200).json(jsonData(yearlyUserMm[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async monthlyUserMm(req, res, next) {
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

            const monthlyUserMm = await Sys_subscribe.aggregate(
                [
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
                        '$facet': {
                            'dataNow': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start } },
                                            { 'ep': { '$gte': time_end } },
                                            { 'typ': { '$eq': 'monthly' } }
                                        ]
                                    }
                                },
                                {
                                    '$group': {
                                        '_id': {
                                            'a': '$date',
                                            'b': '$_u'
                                        },
                                        'totalNow': { '$sum': '$total' }
                                    }
                                },
                                {
                                    '$sort': { '_id.a': 1 }
                                },
                                {
                                    '$group': {
                                        '_id': '$_id.a',
                                        'totalNow': { '$sum': '$totalNow' }
                                    }
                                },
                                {
                                    '$project': {
                                        'x': '$_id',
                                        'y': '$totalNow',
                                        '_id': 0
                                    }
                                },
                                {
                                    '$sort': { 'x': 1 }
                                }

                            ],
                            'dataDouble': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start_double } },
                                            { 'ep': { '$gte': time_end_double } },
                                            { 'typ': { '$eq': 'monthly' } }
                                        ]
                                    }
                                },
                                {
                                    '$group': {
                                        '_id': {
                                            'a': '$date',
                                            'b': '$_u'
                                        },
                                        'totalDouble': { '$sum': '$total' }
                                    }
                                },
                                {
                                    '$project': {
                                        'x': '$_id.a',
                                        'y': '$totalDouble',
                                        '_id': 0
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'data_now': { '$sum': '$dataNow.y' },
                            'data_double': { '$sum': '$dataDouble.y' },
                            'diff_day': {
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
                            'percent': {
                                '$round': [{
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
                                }, 2]
                            },
                        }
                    },
                    {
                        '$project': {
                            'total_user': '$data_now',
                            'percent': '$percent',
                            'diff_day': '$diff_day',
                            'statistic': '$dataNow',
                            '_id': 0
                        }
                    }
                ]
            )

            res.status(200).json(jsonData(monthlyUserMm[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async userFreeMm(req, res, next) {
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

            const userFreeMm = await User.aggregate(
                [
                    {
                        '$lookup': {
                            'as': 'mm',
                            'from': 'sys_subscribe',
                            'localField': '_id',
                            'foreignField': '_u',
                            'pipeline': [
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
                                                '$count': 'total'
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
                                                '$count': 'total'
                                            }
                                        ],
                                        'time': [
                                            {
                                                '$project': {
                                                    'ep': '$ep'
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    '$project': {
                                        'dataNow': {
                                            '$cond': {
                                                'if': { '$gte': [{ '$size': '$data_now' }, 1] },
                                                'then': { '$toInt': '0' },
                                                'else': { '$toInt': '1' },
                                            }
                                        },
                                        'dataDouble': {
                                            '$cond': {
                                                'if': { '$gte': [{ '$size': '$data_double' }, 1] },
                                                'then': { '$toInt': '0' },
                                                'else': { '$toInt': '1' },
                                            }
                                        },
                                        'time_update': { '$first': '$time.ep' }
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$unwind': { 'path': '$mm' }
                    },
                    {
                        '$match': {
                            '$and': [
                                { 'mm.time_update': { '$lte': time_start } },
                                { 'mm.time_update': { '$gte': time_end } },
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'dateUpdate': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$mm.time_update', 1000] } },
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            }
                        }
                    },
                    {
                        '$facet': {
                            'statistic': [
                                {
                                    '$group': {
                                        '_id': '$dateUpdate',
                                        'total': { '$sum': '$mm.dataNow' }
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
                            'data': [
                                {
                                    '$project': {
                                        'total_now': { '$sum': '$mm.dataNow' },
                                        'total_double': { '$sum': '$mm.dataDouble' },
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'now': { '$sum': '$data.total_now' },
                            'double': { '$sum': '$data.total_double' },
                        }
                    },
                    {
                        '$addFields': {
                            'percent': {
                                '$round': [{
                                    '$multiply': [
                                        {
                                            '$divide': [
                                                { '$subtract': ['$now', '$double'] },
                                                {
                                                    '$cond': {
                                                        'if': { '$lte': ['$double', 0] },
                                                        'then': 1,
                                                        'else': '$double'
                                                    }
                                                }
                                            ]
                                        }, 100
                                    ]
                                }, 2]
                            },
                            'diff_day': {
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
                        },
                    },
                    {
                        '$project': {
                            '_id': 0,
                            'total_user': '$now',
                            'percent': '$percent',
                            'diff_day': '$diff_day',
                            'statistic': '$statistic'
                        }
                    }
                ]
            )

            res.status(200).json(jsonData(userFreeMm[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async incomeMmDaily(req, res, next) {
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

            const incomeMmDaily = await Sys_subscribe.aggregate(
                [
                    {
                        '$addFields': {
                            'date': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'income': '$prn'
                        }
                    },
                    {
                        '$facet': {
                            'dataNow': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start } },
                                            { 'ep': { '$gte': time_end } },
                                            { 'typ': 'daily' },
                                        ]
                                    }
                                },
                                {
                                    '$group': {
                                        '_id': '$date',
                                        'income': { '$sum': '$income' }
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
                            'dataDouble': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start_double } },
                                            { 'ep': { '$gte': time_end_double } },
                                            { 'typ': 'daily' },
                                        ]
                                    }
                                },
                                {
                                    '$group': {
                                        '_id': '$date',
                                        'income': { '$sum': '$income' }
                                    }
                                },
                                {
                                    '$project': {
                                        'x': '$_id',
                                        'y': '$income',
                                        '_id': 0
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'total_now': { '$sum': '$dataNow.y' },
                            'total_double': { '$sum': '$dataDouble.y' },
                        }
                    },
                    {
                        '$addFields': {
                            'percent': {
                                '$round': [{
                                    '$multiply': [
                                        {
                                            '$divide': [
                                                { '$subtract': ['$total_now', '$total_double'] },
                                                {
                                                    '$cond': {
                                                        'if': { '$lte': ['$total_double', 0] },
                                                        'then': 1,
                                                        'else': '$total_double'
                                                    }
                                                }
                                            ]
                                        }, 100
                                    ]
                                }, 2]
                            },
                            'diff_day': {
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
                            'income': '$total_now',
                            'percent': '$percent',
                            'diff_day': '$diff_day',
                            'statistic': '$dataNow',
                            '_id': 0
                        }
                    }
                ]
            )

            res.status(200).json(jsonData(incomeMmDaily[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async incomeMmMonthly(req, res, next) {
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

            const incomeMmMonthly = await Sys_subscribe.aggregate(
                [
                    {
                        '$addFields': {
                            'date': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'income': '$prn'
                        }
                    },
                    {
                        '$facet': {
                            'dataNow': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start } },
                                            { 'ep': { '$gte': time_end } },
                                            { 'typ': 'monthly' },
                                        ]
                                    }
                                },
                                {
                                    '$group': {
                                        '_id': '$date',
                                        'income': { '$sum': '$income' }
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
                            'dataDouble': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start_double } },
                                            { 'ep': { '$gte': time_end_double } },
                                            { 'typ': 'monthly' },
                                        ]
                                    }
                                },
                                {
                                    '$group': {
                                        '_id': '$date',
                                        'income': { '$sum': '$income' }
                                    }
                                },
                                {
                                    '$project': {
                                        'x': '$_id',
                                        'y': '$income',
                                        '_id': 0
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'total_now': { '$sum': '$dataNow.y' },
                            'total_double': { '$sum': '$dataDouble.y' },
                        }
                    },
                    {
                        '$addFields': {
                            'percent': {
                                '$round': [{
                                    '$multiply': [
                                        {
                                            '$divide': [
                                                { '$subtract': ['$total_now', '$total_double'] },
                                                {
                                                    '$cond': {
                                                        'if': { '$lte': ['$total_double', 0] },
                                                        'then': 1,
                                                        'else': '$total_double'
                                                    }
                                                }
                                            ]
                                        }, 100
                                    ]
                                }, 2]
                            },
                            'diff_day': {
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
                            'income': '$total_now',
                            'percent': '$percent',
                            'diff_day': '$diff_day',
                            'statistic': '$dataNow',
                            '_id': 0
                        }
                    }
                ]
            )

            res.status(200).json(jsonData(incomeMmMonthly[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async incomeMmYearly(req, res, next) {
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

            const incomeMmYearly = await Sys_subscribe.aggregate(
                [
                    {
                        '$addFields': {
                            'date': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'income': '$prn'
                        }
                    },
                    {
                        '$facet': {
                            'dataNow': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start } },
                                            { 'ep': { '$gte': time_end } },
                                            { 'typ': 'yearly' },
                                        ]
                                    }
                                },
                                {
                                    '$group': {
                                        '_id': '$date',
                                        'income': { '$sum': '$income' }
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
                            'dataDouble': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start_double } },
                                            { 'ep': { '$gte': time_end_double } },
                                            { 'typ': 'yearly' },
                                        ]
                                    }
                                },
                                {
                                    '$group': {
                                        '_id': '$date',
                                        'income': { '$sum': '$income' }
                                    }
                                },
                                {
                                    '$project': {
                                        'x': '$_id',
                                        'y': '$income',
                                        '_id': 0
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'total_now': { '$sum': '$dataNow.y' },
                            'total_double': { '$sum': '$dataDouble.y' },
                        }
                    },
                    {
                        '$addFields': {
                            'percent': {
                                '$round': [{
                                    '$multiply': [
                                        {
                                            '$divide': [
                                                { '$subtract': ['$total_now', '$total_double'] },
                                                {
                                                    '$cond': {
                                                        'if': { '$lte': ['$total_double', 0] },
                                                        'then': 1,
                                                        'else': '$total_double'
                                                    }
                                                }
                                            ]
                                        }, 100
                                    ]
                                }, 2]
                            },
                            'diff_day': {
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
                            'income': '$total_now',
                            'percent': '$percent',
                            'diff_day': '$diff_day',
                            'statistic': '$dataNow',
                            '_id': 0
                        }
                    }
                ]
            )

            res.status(200).json(jsonData(incomeMmYearly[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async userGender(req, res, next) {
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

            const userGender = await Sys_subscribe.aggregate(
                [
                    {
                        '$lookup': {
                            'from': 'users',
                            'as': 'us',
                            'localField': '_u',
                            'foreignField': '_id',
                            'pipeline': [
                                {
                                    '$project': {
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
                                        }
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$unwind': { 'path': '$us' }
                    },
                    {
                        '$addFields': {
                            'gender': '$us.gender'
                        }
                    },
                    {
                        '$facet': {
                            'Male': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start } },
                                            { 'ep': { '$gte': time_end } },
                                            { 'gender': { '$eq': 'Male' } },
                                        ]
                                    }
                                },
                                {
                                    '$group': {
                                        '_id': '$_u',
                                    }
                                },
                                {
                                    '$count': 'total'
                                }
                            ],
                            'Female': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start } },
                                            { 'ep': { '$gte': time_end } },
                                            { 'gender': { '$eq': 'Female' } },
                                        ]
                                    }
                                },
                                {
                                    '$group': {
                                        '_id': '$_u',
                                    }
                                },
                                {
                                    '$count': 'total'
                                }
                            ],
                            'unknown': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start } },
                                            { 'ep': { '$gte': time_end } },
                                            { 'gender': { '$eq': '-' } },
                                        ]
                                    }
                                },
                                {
                                    '$group': {
                                        '_id': '$_u',
                                    }
                                },
                                {
                                    '$count': 'total'
                                }
                            ]
                        }
                    },
                    {
                        '$project': {
                            'male': {
                                '$cond': {
                                    'if': { '$eq': [{ '$size': '$Male' }, 0] },
                                    'then': { '$toInt': '0' },
                                    'else': { '$first': '$Male.total' }
                                }
                            },
                            'female': {
                                '$cond': {
                                    'if': { '$eq': [{ '$size': '$Female' }, 0] },
                                    'then': { '$toInt': '0' },
                                    'else': { '$first': '$Female.total' }
                                }
                            },
                            'unknown': {
                                '$cond': {
                                    'if': { '$eq': [{ '$size': '$unknown' }, 0] },
                                    'then': { '$toInt': '0' },
                                    'else': { '$first': '$unknown.total' }
                                }
                            }
                        }
                    },
                    {
                        '$addFields': {
                            'total': { '$add': ['$male', '$female', '$unknown'] }
                        }
                    },
                    {
                        '$addFields': {
                            'percent_male': {
                                '$round': [{
                                    '$multiply': [
                                        {
                                            '$divide': [
                                                '$male',
                                                {
                                                    '$cond': {
                                                        'if': { '$lte': ['$total', 0] },
                                                        'then': 1,
                                                        'else': '$total'
                                                    }
                                                }
                                            ]
                                        }, 100
                                    ]
                                }, 2]
                            },
                            'percent_female': {
                                '$round': [{
                                    '$multiply': [
                                        {
                                            '$divide': [
                                                '$female',
                                                {
                                                    '$cond': {
                                                        'if': { '$lte': ['$total', 0] },
                                                        'then': 1,
                                                        'else': '$total'
                                                    }
                                                }
                                            ]
                                        }, 100
                                    ]
                                }, 2]
                            },
                            'percent_unknown': {
                                '$round': [{
                                    '$multiply': [
                                        {
                                            '$divide': [
                                                '$unknown',
                                                {
                                                    '$cond': {
                                                        'if': { '$lte': ['$total', 0] },
                                                        'then': 1,
                                                        'else': '$total'
                                                    }
                                                }
                                            ]
                                        }, 100
                                    ]
                                }, 2]
                            }
                        }
                    },
                    {
                        '$project': {
                            'male': {
                                'total': '$male',
                                'percent': '$percent_male'
                            },
                            'female': {
                                'total': '$female',
                                'percent': '$percent_female'
                            },
                            'unknown': {
                                'total': '$unknown',
                                'percent': '$percent_unknown'
                            }
                        }
                    }
                ]
            )

            res.status(200).json(jsonData(userGender[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async userAverage(req, res, next) {
        try {
            const { tab, filter_gender, filter_age, time_start, time_end } = req.query

            let time_a = date2number(time_start)
            let time_b = date2number(time_end)

            let findByType = 0
            let findByGender = 0
            let findByAge = 0
            let findByDate = 0
            let labelType = 0

            if (tab) {
                findByType = { 'typ': tab }
                labelType = tab
            } else {
                findByType = {}
                labelType = 'All'
            }

            if (filter_gender) {
                findByGender = { 'us.gender': filter_gender }
            } else {
                findByGender = {}
            }

            if (filter_age) {
                findByAge = { 'us.age': +filter_age }
            } else {
                findByAge = {}
            }

            if (time_start && !time_end) {
                throw { message: 'End Date is required' }
            }
            if (!time_start && time_end) {
                throw { message: 'Start Date is required' }
            }
            if (time_start && time_end) {
                findByDate = {
                    '$and': [
                        { 'eps': { '$lte': time_a } },
                        { 'eps': { '$gte': time_b } },
                    ]
                }
            } else {
                findByDate = {}
            }

            const usingAverage = await Sys_subscribe.aggregate(
                [
                    {
                        '$lookup': {
                            'from': 'sys_scans_glob',
                            'foreignField': '_u',
                            'localField': '_u',
                            'as': 'scan_glob',
                            'let': {
                                's_date': '$eps',
                                'e_date': '$epe'
                            },
                            'pipeline': [
                                {
                                    '$match': {
                                        '$expr': {
                                            '$and': [
                                                { '$gte': ['$ep', '$$s_date'] },
                                                { '$lte': ['$ep', '$$e_date'] },
                                            ]
                                        }
                                    }
                                },
                                {
                                    '$count': 'totaldata'
                                }
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'users',
                            'as': 'us',
                            'foreignField': '_id',
                            'localField': '_u',
                            'pipeline': [
                                {
                                    '$project': {
                                        'gender': {
                                            '$cond': {
                                                'if': { '$eq': ['$dat.sex', 'M'] },
                                                'then': 'Male',
                                                'else': {
                                                    '$cond': {
                                                        'if': { '$eq': ['$dat', 'F'] },
                                                        'then': 'Female',
                                                        'else': '-'
                                                    }
                                                }
                                            }
                                        },
                                        'age': {
                                            '$dateDiff': {
                                                'startDate': {
                                                    '$toDate': {
                                                        '$multiply': ['$dat.bdy', 1000]
                                                    }
                                                },
                                                'endDate': {
                                                    '$toDate': {
                                                        '$multiply': [date2number(''), 1000]
                                                    }
                                                },
                                                'unit': 'year'
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
                        '$match': {
                            '$expr': {
                                '$and': [
                                    { '$gte': [{ '$size': '$scan_glob' }, 1] },
                                ]
                            }
                        }
                    },
                    {
                        '$match': findByDate
                    },
                    {
                        '$match': {
                            '$and': [findByType, findByGender, findByAge]
                        }
                    },
                    {
                        '$unwind': { 'path': '$scan_glob' }
                    },
                    {
                        '$addFields': {
                            'date': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$eps', 1000] } },
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                        }
                    },
                    {
                        '$facet': {
                            'statistic': [
                                {
                                    '$group': {
                                        '_id': '$date',
                                        'total': { '$sum': '$scan_glob.totaldata' },
                                    }
                                },
                                {
                                    '$project': {
                                        '_id': 0,
                                        'x': '$_id',
                                        'y': '$total',
                                        'label': labelType
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
                            'total': { '$sum': '$statistic.y' },
                            'statistic': '$statistic',
                        }
                    }
                ]
            )

            res.status(200).json(jsonData(usingAverage[0]))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async userAverageFree(req, res, next) {
        try {
            let { time_start, time_end, filter_gender, filter_age } = req.query
            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }

            time_start = date2number(time_start)
            time_end = date2number(time_end)

            let findByGender = 0
            let findByAge = 0

            if (filter_gender) {
                findByGender = { 'us.gender': filter_gender }
            } else {
                findByGender = {}
            }

            if (filter_age) {
                findByAge = { 'us.age': +filter_age }
            } else {
                findByAge = {}
            }

            const userAverageFree = await Config.aggregate(
                [
                    {
                        '$limit': 1
                    },
                    {
                        '$lookup': {
                            'from': 'sys_scans_glob',
                            'as': 'scan',
                            'pipeline': [
                                {
                                    '$lookup': {
                                        'from': 'sys_subscribe',
                                        'as': 'magic_mirror',
                                        'foreignField': '_u',
                                        'localField': '_u',
                                        'pipeline': [
                                            {
                                                '$project': {
                                                    '_id': 1
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    '$lookup': {
                                        'from': 'users',
                                        'as': 'us',
                                        'foreignField': '_id',
                                        'localField': '_u',
                                        'pipeline': [
                                            {
                                                '$project': {
                                                    'gender': {
                                                        '$cond': {
                                                            'if': { '$eq': ['$dat.sex', 'M'] },
                                                            'then': 'Male',
                                                            'else': {
                                                                '$cond': {
                                                                    'if': { '$eq': ['$dat', 'F'] },
                                                                    'then': 'Female',
                                                                    'else': '-'
                                                                }
                                                            }
                                                        }
                                                    },
                                                    'age': {
                                                        '$dateDiff': {
                                                            'startDate': {
                                                                '$toDate': {
                                                                    '$multiply': ['$dat.bdy', 1000]
                                                                }
                                                            },
                                                            'endDate': {
                                                                '$toDate': {
                                                                    '$multiply': [date2number(''), 1000]
                                                                }
                                                            },
                                                            'unit': 'year'
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
                                    '$match': {
                                        '$and': [findByGender, findByAge]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'status': {
                                            '$cond': {
                                                'if': { '$gte': [{ '$size': '$magic_mirror' }, 1] },
                                                'then': true,
                                                'else': false
                                            }
                                        },
                                        'total': { '$sum': 1 },
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
                                    '$match': {
                                        '$and': [
                                            { 'status': false },
                                            { 'ep': { $lte: time_start } },
                                            { 'ep': { $gte: time_end } }
                                        ]
                                    }
                                },
                                {
                                    '$facet': {
                                        'statistic': [
                                            {
                                                '$group': {
                                                    '_id': '$date',
                                                    'total': { '$sum': '$total' }
                                                }
                                            },
                                            {
                                                '$project': {
                                                    'x': '$_id',
                                                    'y': '$total',
                                                    '_id': 0,
                                                    'label': 'free'
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
                                        'total': { '$sum': '$statistic.y' },
                                        'statistic': '$statistic',
                                        '_id': 0
                                    }
                                }

                            ]
                        }
                    },
                ]
            )

            res.status(200).json(jsonData(userAverageFree[0].scan[0]))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async buyerAgeChart(req, res, next) {
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

            const buyerAgeChart = await Sys_payment.aggregate(
                [
                    {
                        '$match': {
                            '$and': [
                                { 'ep': { '$lte': time_start } },
                                { 'ep': { '$gte': time_end } }
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
                            'user_age': [
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

            res.status(200).json(jsonData(buyerAgeChart[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async mmAgeChart(req, res, next) {
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

            const mmAgeChart = await Sys_subscribe.aggregate(
                [
                    {
                        '$match': {
                            '$and': [
                                { 'ep': { '$lte': time_start } },
                                { 'ep': { '$gte': time_end } }
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
                            'user_age': [
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

            res.status(200).json(jsonData(mmAgeChart[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async userNew(req, res, next) {
        try {
            let { time_start, time_end, tab } = req.query
            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }

            time_start = date2number(time_start)
            time_end = date2number(time_end)

            const userNew = await Sys_subscribe.aggregate(
                [
                    {
                        '$match': {
                            '$and': [
                                { 'ep': { $lte: time_start } },
                                { 'ep': { $gte: time_end } }
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
                            'jumlah': { '$sum': 1 }
                        }
                    },
                    {
                        '$facet': {
                            'yearly': [
                                {
                                    '$match': { 'typ': 'yearly' }
                                },
                                {
                                    '$group': {
                                        '_id': '$date',
                                        'total': { '$sum': '$jumlah' }
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
                            'monthly': [
                                {
                                    '$match': { 'typ': 'monthly' }
                                },
                                {
                                    '$group': {
                                        '_id': '$date',
                                        'total': { '$sum': '$jumlah' }
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
                            'daily': [
                                {
                                    '$match': { 'typ': 'daily' }
                                },
                                {
                                    '$group': {
                                        '_id': '$date',
                                        'total': { '$sum': '$jumlah' }
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
                            ]
                        }
                    }
                ]
            )


            const yearly = userNew[0].yearly
            const monthly = userNew[0].monthly
            const daily = userNew[0].daily


            const free = await User.aggregate(
                [
                    {
                        '$lookup': {
                            'from': 'sys_subscribe',
                            'as': 'magic_mirror',
                            'localField': '_id',
                            'foreignField': '_u',
                            'pipeline': [
                                {
                                    '$project': {
                                        'total': 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'status': {
                                '$cond': {
                                    'if': { '$gte': [{ '$size': '$magic_mirror' }, 1] },
                                    'then': true,
                                    'else': false
                                }
                            },
                            'total': { '$sum': 1 },
                            'date': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$epu', 1000] } },
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                        }
                    },
                    {
                        '$match': {
                            '$and': [
                                { 'status': false },
                                { 'epu': { $lte: time_start } },
                                { 'epu': { $gte: time_end } }
                            ]
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
                            'x': '$_id',
                            'y': '$total',
                            '_id': 0
                        }
                    },
                    {
                        '$sort': { 'x': 1 }
                    }
                ]
            )

            if (tab === 'yearly') { res.status(200).json(jsonData(yearly)) }
            if (tab === 'monthly') { res.status(200).json(jsonData(monthly)) }
            if (tab === 'daily') { res.status(200).json(jsonData(daily)) }
            if (tab === 'free') { res.status(200).json(jsonData(free)) }

            res.status(200).json(jsonData(yearly))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }




}

module.exports = StatistikController