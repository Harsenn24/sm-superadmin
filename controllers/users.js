const { ObjectID } = require("bson")
const { date2number } = require("../helper/date2number")
const { decrypt, encrypt, decryptId } = require("../helper/enkrip_id")
const { queryPagination } = require("../helper/pagination")
const switchbranch = require("../query/status_branch")
const { jsonData } = require("../middleware/sucess")
const { User, Sys_payment, Doctor_chat, UserCart, Sys_subscribe, Config } = require("../model")
const { rt_link, path_gallery_magic_mirror, path_gallery_magic_mirror_error, file_error_magic_mirror } = process.env
const { get_day } = require("../helper/getDay")

class PenggunaController {
    static async userStatus(req, res, next) {
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

            const total_user = await User.aggregate([
                {
                    '$match': {
                        '$and': [
                            { 'ep': { '$lte': time_start } },
                            { 'ep': { '$gte': time_end } }
                        ]
                    }
                },
                {
                    '$facet': {
                        'user_a': [
                            {
                                '$match': {
                                    '$and': [
                                        { 'ep': { '$lte': time_start } },
                                        { 'ep': { '$gte': time_end } }
                                    ]
                                }
                            },
                            { '$count': 'count_result' }
                        ],
                        'user_b': [
                            {
                                '$match': {
                                    '$and': [
                                        { 'ep': { '$lte': time_start_double } },
                                        { 'ep': { '$gte': time_end_double } }
                                    ]
                                }
                            },
                            { '$count': 'count_result' }
                        ]
                    }
                },
                {
                    '$addFields': {
                        'total_a': { '$ifNull': [{ '$toInt': { '$first': '$user_a.count_result' } }, { '$toInt': '0' }] },
                        'total_b': { '$ifNull': [{ '$toInt': { '$first': '$user_b.count_result' } }, { '$toInt': '0' }] },
                    }
                },
                {
                    '$addFields': {
                        'percent': {
                            '$round': [{
                                '$multiply': [
                                    {
                                        '$divide': [
                                            { '$subtract': ['$total_a', '$total_b'] },
                                            {
                                                '$cond': {
                                                    'if': { '$lte': ['$total_b', 0] },
                                                    'then': 1,
                                                    'else': '$total_b'
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
                        'total_user': '$total_a',
                        'percent': '$percent',
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
                        '_id': 0
                    }
                }
            ])

            const user_new = await Sys_payment.aggregate([
                {
                    '$match': {
                        '$and': [
                            { 'ep': { '$lte': time_start } },
                            { 'ep': { '$gte': time_end } }
                        ]
                    }
                },
                {
                    '$facet': {
                        'user_a': [
                            {
                                '$match': {
                                    '$and': [
                                        { 'ep': { '$lte': time_start } },
                                        { 'ep': { '$gte': time_end } },
                                        {
                                            '$or': [
                                                { 'dat': { '$size': 1 } },
                                                { 'dat': { '$size': 0 } },
                                            ]
                                        },


                                    ]
                                }
                            },
                            { '$count': 'count_result' }
                        ],
                        'user_b': [
                            {
                                '$match': {
                                    '$and': [
                                        { 'ep': { '$lte': time_start_double } },
                                        { 'ep': { '$gte': time_end_double } },
                                        {
                                            '$or': [
                                                { 'dat': { '$size': 1 } },
                                                { 'dat': { '$size': 0 } },
                                            ]
                                        },


                                    ]
                                }
                            },
                            { '$count': 'count_result' }
                        ]
                    }
                },
                {
                    '$addFields': {
                        'total_a': { '$ifNull': [{ '$first': '$user_a.count_result' }, 0] },
                        'total_b': { '$ifNull': [{ '$first': '$user_b.count_result' }, 0] },
                    }
                },
                {
                    '$addFields': {
                        'percent': {
                            '$round': [{
                                '$multiply': [
                                    {
                                        '$divide': [
                                            { '$subtract': ['$total_a', '$total_b'] },
                                            {
                                                '$cond': {
                                                    'if': { '$lte': ['$total_b', 0] },
                                                    'then': 1,
                                                    'else': '$total_b'
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
                        'total_user_new': '$total_a',
                        'diff_percent': '$percent',
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
                        '_id': 0
                    }
                }
            ])

            const user_active = await User.aggregate([
                {
                    '$sort': { '_id': -1 }
                },
                {
                    '$match': {
                        '$and': [
                            { 'ep': { '$lte': time_start } },
                            { 'ep': { '$gte': time_end_double } }
                        ]
                    }
                },
                {
                    '$match': {
                        'dat.act': true
                    }
                },
                {
                    '$facet': {
                        'user_a': [
                            {
                                '$match': {
                                    '$and': [
                                        { 'ep': { '$lte': time_start } },
                                        { 'ep': { '$gte': time_end } }
                                    ]
                                }
                            },
                            { '$count': 'count_result' }
                        ],
                        'user_b': [
                            {
                                '$match': {
                                    '$and': [
                                        { 'ep': { '$lte': time_start_double } },
                                        { 'ep': { '$gte': time_end_double } }
                                    ]
                                }
                            },
                            { '$count': 'count_result' }
                        ]
                    }
                },
                {
                    '$addFields': {
                        'total_a': { '$ifNull': [{ '$first': '$user_a.count_result' }, 0] },
                        'total_b': { '$ifNull': [{ '$first': '$user_b.count_result' }, 0] },
                    }
                },
                {
                    '$addFields': {
                        'percent': {
                            '$round': [{
                                '$multiply': [
                                    {
                                        '$divide': [
                                            { '$subtract': ['$total_a', '$total_b'] },
                                            {
                                                '$cond': {
                                                    'if': { '$lte': ['$total_b', 0] },
                                                    'then': 1,
                                                    'else': '$total_b'
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
                        'total_user_active': '$total_a',
                        'diff_percent': '$percent',
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
                        '_id': 0
                    }
                }
            ])

            const user_delete = await User.aggregate([
                {
                    '$sort': { '_id': -1 }
                },
                {
                    '$match': {
                        'dat.act': false
                    }
                },
                {
                    '$facet': {
                        'user_a': [
                            {
                                '$match': {
                                    '$and': [
                                        { 'ep': { '$lte': time_start } },
                                        { 'ep': { '$gte': time_end } }
                                    ]
                                }
                            },
                            { '$count': 'count_result' }
                        ],
                        'user_b': [
                            {
                                '$match': {
                                    '$and': [
                                        { 'ep': { '$lte': time_start_double } },
                                        { 'ep': { '$gte': time_end_double } }
                                    ]
                                }
                            },
                            { '$count': 'count_result' }
                        ]
                    }
                },
                {
                    '$addFields': {
                        'total_a': { '$ifNull': [{ '$first': '$user_a.count_result' }, 0] },
                        'total_b': { '$ifNull': [{ '$first': '$user_b.count_result' }, 0] },
                    }
                },
                {
                    '$addFields': {
                        'percent': {
                            '$round': [{
                                '$multiply': [
                                    {
                                        '$divide': [
                                            { '$subtract': ['$total_a', '$total_b'] },
                                            {
                                                '$cond': {
                                                    'if': { '$lte': ['$total_b', 0] },
                                                    'then': 1,
                                                    'else': '$total_b'
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
                        'total_user_active': '$total_a',
                        'diff_percent': '$percent',
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
                        '_id': 0
                    }
                }
            ])

            if (total_user.length === 0) {
                throw { message: 'Data not found' }
            }
            if (user_new.length === 0) {
                throw { message: 'Data not found' }
            }
            if (user_active.length === 0) {
                throw { message: 'Data not found' }
            }
            if (user_delete.length === 0) {
                throw { message: 'Data not found' }
            }

            const result = {
                userTotal: total_user[0],
                userNew: user_new[0],
                userActive: user_active[0],
                userDelete: user_delete[0],
            }
            res.status(200).json(jsonData(result))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async list_user(req, res, next) {
        try {
            let { time_start, time_end, page, item_limit, search_name, statusType } = req.query

            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }

            time_start = date2number(time_start)
            time_end = date2number(time_end)

            let filterName = 0

            if (search_name) {
                filterName = {
                    'user': {
                        '$regex': search_name,
                        '$options': 'i'
                    }
                }
            } else {
                filterName = {}
            }


            let filterStatus = 0

            if (statusType) {
                filterStatus = { 'status': statusType }
            } else {
                filterStatus = {}
            }


            const list_user = await User.aggregate(queryPagination(
                [
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
                            'payment_qty': { '$ifNull': [{ '$sum': '$pym.total' }, { '$toInt': '0' }] },
                            'payment_prc': { '$ifNull': [{ '$sum': '$purcases.amount' }, { '$toInt': '0' }] },
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'sys_subscribe',
                            'localField': '_id',
                            'foreignField': '_u',
                            'pipeline': [
                                {
                                    '$match': {
                                        '$and': [
                                            // { 'ep': { '$lte': time_start } },
                                            // { 'ep': { '$gte': time_end } },
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
                                        'prc': '$prc',
                                        'qty': '$qty'
                                    }
                                }
                            ],
                            'as': 'magic_mirror'
                        }
                    },
                    {
                        '$addFields': {
                            'magic_mirror_qty': { '$sum': '$magic_mirror.qty' },
                            'magic_mirror_prc': { '$sum': '$magic_mirror.prc' },
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'sys_doctors',
                            'localField': '_id',
                            'foreignField': '_u',
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
                                            // { 'date_id': { '$lte': time_start } },
                                            // { 'date_id': { '$gte': time_end } },
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
                            ],
                            'as': 'doctor'
                        }
                    },
                    {
                        '$addFields': {
                            'doctor_qty': { '$sum': '$doctor.qty' },
                            'doctor_prc': { '$sum': '$doctor.prc' },
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
                                            // { 'ep': { '$lte': time_start } },
                                            // { 'ep': { '$gte': time_end } },
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
                            ],
                            'as': 'voucher'
                        }
                    },
                    {
                        '$addFields': {
                            'voucher_qty': { '$sum': '$voucher.qty' },
                            'voucher_prc': { '$sum': '$voucher.prc' },
                        }
                    },
                    {
                        '$addFields': {
                            'total_price': { '$sum': ['$voucher_prc', '$doctor_prc', '$magic_mirror_prc', '$payment_prc'] },
                            'total_quantity': { '$sum': ['$voucher_qty', '$doctor_qty', '$magic_mirror_qty', '$payment_qty'] },
                        }
                    },
                    {
                        '$addFields': {
                            'user': {
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
                            'join': { '$toDate': { '$multiply': ['$ep', 1000] } },
                            'idEncrypt': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            },
                            'status': {
                                '$cond': {
                                    'if': { '$eq': ['$dat.eml.act', true] },
                                    'then': 'Active',
                                    'else': 'Inactive'
                                }
                            },
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
                        '$match': { '$and': [filterName, filterStatus] }
                    },
                    {
                        '$sort': {
                            'total_price': -1,
                            'total_quantity': -1,
                        }
                    },
                ],
                [
                    {
                        '$project': {
                            '_id': '$idEncrypt',
                            'user': '$user',
                            'join': '$join',
                            'total_qty': '$total_quantity',
                            'total_price': { '$round': ['$total_price'] },
                            'membership': {
                                'level': '$membership.data.level',
                                'type': '$membership.data.type'
                            },
                            'status': '$status',
                            'user_avatar': { '$concat': [`${rt_link}profile/self/avatar/`, '$dat.usr'] }
                        }
                    },
                ], page, 3, item_limit
            ))

            res.status(200).json(jsonData(list_user[0]))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async detailUser(req, res, next) {
        try {
            const { _id } = req.params

            const idDecrypt = decryptId(_id, 12)


            const detailUser = await User.aggregate([
                {
                    '$match': {
                        '_id': ObjectID(idDecrypt)
                    }
                },
                {
                    '$lookup': {
                        'from': 'sys_subscribe',
                        'localField': '_id',
                        'foreignField': '_u',
                        'as': 'magic_mirror_date',
                        'pipeline': [
                            {
                                '$match': {
                                    '$and': [
                                        { 'epe': { '$lte': date2number('') } },
                                        { 'eps': { '$gte': date2number('') } },
                                    ]
                                }
                            },
                            {
                                '$project': {
                                    'startDate': { '$toDate': { '$multiply': ['$eps', 1000] } },
                                    'endDate': { '$toDate': { '$multiply': ['$epe', 1000] } },
                                }
                            }
                        ]
                    }
                },
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
                                        // { 'ep': { '$lte': time_start } },
                                        // { 'ep': { '$gte': time_end } },
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
                    '$addFields': {
                        'magic_mirror_qty': { '$sum': '$magic_mirror_price_qty.qty' },
                        'magic_mirror_prc': { '$sum': '$magic_mirror_price_qty.prc' },
                        'magic_mirror_start_date': { '$first': '$magic_mirror_date.startDate' },
                        'magic_mirror_end_date': { '$first': '$magic_mirror_date.endDate' },
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
                        'payment_qty': { '$ifNull': [{ '$sum': '$pym.total' }, { '$toInt': '0' }] },
                        'payment_prc': { '$ifNull': [{ '$sum': '$purcases.amount' }, { '$toInt': '0' }] },
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
                                        // { 'ep': { '$lte': time_start } },
                                        // { 'ep': { '$gte': time_end } },
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
                    '$addFields': {
                        'voucher_qty': { '$sum': '$voucher.qty' },
                        'voucher_prc': { '$sum': '$voucher.prc' },
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
                                        // { 'date_id': { '$lte': time_start } },
                                        // { 'date_id': { '$gte': time_end } },
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
                    '$addFields': {
                        'doctor_qty': { '$sum': '$doctor.qty' },
                        'doctor_prc': { '$sum': '$doctor.prc' },
                    }
                },
                {
                    '$lookup': {
                        'from': 'users_address',
                        'localField': '_id',
                        'foreignField': '_u',
                        'as': 'users_address',
                        'pipeline': [
                            {
                                '$project': {
                                    'address': { '$concat': ['$shp.cc', ' ', '$shp.cn', ', ', '$shp.pn', ', ', '$shp.sn', ', ', '$shp.an', ', ', '$shp.zip'] },
                                    '_id': 0,
                                    'status': '$man',
                                    'province': '$shp.pn',
                                }
                            }
                        ]
                    }
                },
                {
                    '$lookup': {
                        'from': 'users_cart',
                        'localField': '_id',
                        'foreignField': '_u',
                        'as': 'users_cart',
                        'pipeline': [
                            {
                                '$project': {
                                    'kantongin': { '$sum': '$dat.qty' }
                                }
                            }
                        ]
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
                    '$addFields': {
                        'sex': {
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
                        'email': {
                            '$function': {
                                'body': decrypt,
                                'args': [{ '$toString': '$dat.eml.val' }, 8],
                                'lang': 'js'
                            }
                        },
                        'phone': {
                            '$function': {
                                'body': decrypt,
                                'args': [{ '$ifNull': [{ '$toString': '$dat.phn.val' }, '-'] }, 8],
                                'lang': 'js'
                            }
                        },
                        'fullName': {
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
                        'birthdate': {
                            '$dateToString': {
                                'date': { '$toDate': { '$multiply': ['$dat.bdy', 1000] } },
                                'format': '%Y/%m/%d',
                                'onNull': '2020-01-01'
                            }
                        },
                        'address': '$users_address',
                        'cart': { '$sum': '$users_cart.kantongin' },
                        'province': {
                            '$first': {
                                '$filter': {
                                    'input': {
                                        '$map': {
                                            'input': '$users_address',
                                            'in': {
                                                '$cond': {
                                                    'if': { '$eq': ['$$this.status', true] },
                                                    'then': '$$this.province',
                                                    'else': []
                                                }
                                            }
                                        }
                                    },
                                    'cond': {
                                        '$ne': ['$$this', []]
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    '$project': {
                        'fullName': '$fullName',
                        '_id': 0,
                        'sex': '$sex',
                        'magic_mirror': {
                            'startDate': {
                                '$dateToString': {
                                    'date': '$magic_mirror_start_date',
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'endDate': {
                                '$dateToString': {
                                    'date': '$magic_mirror_end_date',
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                        },
                        'total_trx': { '$round': ['$total_price'] },
                        'email': '$email',
                        'phone': '$phone',
                        'birthdate': '$birthdate',
                        'address': '$users_address',
                        'cart': '$cart',
                        'bought': '$payment_qty',
                        'membership': {
                            'level': '$membership.data.level',
                            'type': '$membership.data.type'
                        },
                        'user_avatar': { '$concat': [`${rt_link}profile/self/avatar/`, '$dat.usr'] },
                        'province': '$province'
                    }
                }
            ])

            res.status(200).json(jsonData(detailUser[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async userCart(req, res, next) {
        try {
            const { _id } = req.params

            const idDecrypt = decryptId(_id, 12)


            const kantongin = await User.aggregate([
                {
                    '$match': { '_id': ObjectID(idDecrypt) }
                },
                {
                    '$lookup': {
                        'from': 'users_cart',
                        'localField': '_id',
                        'foreignField': '_u',
                        'as': 'my_cart',
                        'pipeline': [
                            {
                                '$unwind': { 'path': '$dat' }
                            },
                            {
                                '$lookup': {
                                    'from': 'stores',
                                    'localField': '_s',
                                    'foreignField': '_id',
                                    'as': 'stores',
                                    'pipeline': [
                                        {
                                            '$project': {
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
                                                '_id': 0
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                '$lookup': {
                                    'from': 'stores_products',
                                    'localField': 'dat._p',
                                    'foreignField': '_id',
                                    'as': 'product',
                                    'pipeline': [
                                        {
                                            '$project': {
                                                'name': '$det.nms',
                                                'image': {
                                                    '$concat': [`${rt_link}store/ip/`, {
                                                        '$function': {
                                                            'body': encrypt,
                                                            'args': [{ '$toString': '$_id' }, 12],
                                                            'lang': 'js'
                                                        }
                                                    }, '/0']
                                                },
                                                '_id': 0
                                            }
                                        },


                                    ]
                                }
                            },
                            {
                                '$unwind': {
                                    'path': '$stores',
                                }
                            },
                            {
                                '$unwind': {
                                    'path': '$product',
                                }
                            },
                            {
                                '$set': {
                                    'product.price': '$dat.prc',
                                    'product.qty': '$dat.qty',

                                }
                            },
                            {
                                '$group': {
                                    '_id': '$_s',
                                    'store_name': { '$first': '$stores.store_name' },
                                    'cart': { '$push': '$product' }
                                }
                            },
                            {
                                '$project': {
                                    'store_name': '$store_name',
                                    'store_name': '$store_name',
                                    'cart': '$cart',
                                    'total': { '$sum': '$cart.qty' },
                                    '_id': 0
                                }
                            },
                        ]
                    }
                },
                {
                    '$project': {
                        'total_cart': { '$sum': '$my_cart.total' },
                        'list': '$my_cart',
                        '_id': 0
                    }
                },

            ])

            let dataresult = kantongin[0]

            let result = dataresult.list.map(el => {
                el.cart.map(x => {
                    delete x.qty
                    return x
                })

                el.carts = el.cart.slice(0, 3)
                delete el.cart
                delete el.total

                return el
            })

            const finalResult = {
                total: dataresult.total_cart,
                list: result.slice(0, 5)
            }

            res.status(200).json(jsonData(finalResult))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async bought(req, res, next) {
        try {
            const { _id } = req.params

            const idDecrypt = decryptId(_id, 12)

            const bought = await User.aggregate(
                [
                    {
                        '$match': { '_id': ObjectID(idDecrypt) }
                    },
                    {
                        '$lookup': {
                            'from': 'sys_payment',
                            'localField': '_id',
                            'foreignField': '_u',
                            'as': 'payment',
                            'pipeline': [
                                {
                                    '$unwind': { 'path': '$dat' }
                                },
                                {
                                    '$addFields': {
                                        'prod': {
                                            'name': '$dat.pn',
                                            'price': '$dat.prc',
                                            'qty': '$dat.qty',
                                            'image': {
                                                '$concat': [`${rt_link}store/ip/`, {
                                                    '$function': {
                                                        'body': encrypt,
                                                        'args': [{ '$toString': '$dat._p' }, 12],
                                                        'lang': 'js'
                                                    }
                                                }, '/0']
                                            },
                                        }
                                    }
                                },
                                {
                                    '$group': {
                                        '_id': '$_s',
                                        'store_name': { '$first': '$sn' },
                                        'product': { '$push': '$prod' }
                                    }
                                },

                                {
                                    '$project': {
                                        '_id': 0,
                                        'store_name': '$store_name',
                                        'bought': '$product',
                                        'total': { '$sum': '$product.qty' }
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$project': {
                            'total': { '$sum': '$payment.total' },
                            'list': '$payment',
                            '_id': 0
                        }
                    }
                ]
            )

            let dataresult = bought[0]

            let result = dataresult.list.map(el => {
                el.bought.map(x => {
                    delete x.qty
                    return x
                })

                el.boughts = el.bought.slice(0, 3)

                el.sub_total = 0

                el.boughts.map(x => {
                    el.sub_total += x.price
                    return x
                })

                delete el.bought
                delete el.total

                return el
            })

            const finalResult = {
                total: dataresult.total,
                list: result.slice(0, 5)
            }


            res.status(200).json(jsonData(finalResult))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }




    static async history_magic_mirror(req, res, next) {
        try {
            const { _id } = req.params
            const idDecrypt = decryptId(_id, 12)

            let { page, item_limit, time_start, time_end } = req.query

            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }

            time_start = date2number(time_start)
            time_end = date2number(time_end)

            const history_magic_mirror = await Sys_subscribe.aggregate(queryPagination(
                [
                    {
                        '$match': {
                            '$and': [
                                { '_u': ObjectID(idDecrypt) },
                                { 'ep': { '$lte': time_start } },
                                { 'ep': { '$gte': time_end } },
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'sys_scans_glob',
                            'foreignField': '_u',
                            'localField': '_u',
                            'as': 'scan_glob',
                            'pipeline': [
                                {
                                    '$match': { 'suc': true }
                                },
                                {
                                    '$count': 'totaldata'
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'startDate': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$eps', 1000] } },
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'endDate': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$epe', 1000] } },
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'startTime': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$eps', 1000] } },
                                    'format': '%H:%M',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'endTime': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$epe', 1000] } },
                                    'format': '%H:%M',
                                    'onNull': '2020-01-01'
                                }
                            }
                        }
                    }
                ],
                [
                    {
                        '$project': {
                            'type': '$typ',
                            'status': {
                                '$cond': {
                                    'if': { '$eq': ['$dat.sex', 'M'] },
                                    'then': 'Male',
                                    'else': {
                                        '$cond': {
                                            'if': { '$gt': ['$epe', date2number()] },
                                            'then': 'Aktif',
                                            'else': 'Berakhir'
                                        }
                                    }
                                }
                            },
                            'voucher': { '$ifNull': ['$cod', '-'] },
                            'startDate': { '$concat': ['$startDate', ' ', '$startTime'] },
                            'endDate': { '$concat': ['$endDate', ' ', '$startTime'] },
                            '_id': 0,
                            'total_used': { '$ifNull': [{ '$first': '$scan_glob.totaldata' }, { '$toInt': '0' }] }
                        }
                    }
                ], page, 3, item_limit
            ))

            res.status(200).json(jsonData(history_magic_mirror[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async historyChatDoc(req, res, next) {
        try {
            const { _id } = req.params
            const idDecrypt = decryptId(_id, 12)
            const { search_doctor, search_id_order, page, item_limit } = req.query

            let filterName = 0

            if (search_doctor) {
                filterName = {
                    'doctor_name': {
                        '$regex': search_doctor,
                        '$options': 'i'
                    }
                }
            } else {
                filterName = {}
            }


            let filterIdOrder = 0

            if (search_id_order) {
                filterIdOrder = {
                    'encrypt_id': {
                        '$regex': search_id_order,
                        '$options': 'i'
                    }
                }
            } else {
                filterIdOrder = {}
            }


            const historyChatDoc = await Doctor_chat.aggregate(queryPagination(
                [
                    {
                        '$match': {
                            '$and': [
                                { '_u': ObjectID(idDecrypt) },
                                { 'end': true }
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'doctors',
                            'localField': '_d',
                            'foreignField': '_id',
                            'as': 'doctors',
                            'pipeline': [
                                {
                                    '$lookup': {
                                        'from': 'stores',
                                        'localField': '_s',
                                        'foreignField': '_id',
                                        'as': 'st',
                                        'pipeline': [
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
                                                    'storeName': '$det.nms',
                                                    'store_image': { '$concat': [`${rt_link}store/i/`, { '$toString': '$store_id' }] },
                                                    '_id': 0
                                                }
                                            }
                                        ]
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
                                    }
                                },
                                {
                                    '$project': {
                                        'doctorName': {
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
                                        'storeName': { '$ifNull': [{ '$first': '$st.storeName' }, { '$toInt': '0' }] },
                                        'store_image': { '$ifNull': [{ '$first': '$st.store_image' }, { '$toInt': '0' }] },
                                        'doctor_avatar': { '$concat': [`${rt_link}doctor/chat/embed/avatar/`, '$doctor_id'] },
                                        'specialist' : '$doc.fld'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'date_consul': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$eps', 1000] } },
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'time_consul': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$eps', 1000] } },
                                    'format': '%H:%M',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'doctor_name': { '$ifNull': [{ '$first': '$doctors.doctorName' }, '-'] },
                            'doctor_avatar': { '$ifNull': [{ '$first': '$doctors.doctor_avatar' }, '-'] },
                            'store_name': { '$ifNull': [{ '$first': '$doctors.storeName' }, '-'] },
                            'store_image': { '$ifNull': [{ '$first': '$doctors.store_image' }, '-'] },
                            'spec': { '$ifNull': [{ '$first': '$doctors.specialist' }, '-'] },

                        }
                    },
                    {
                        '$lookup': {
                            'from': 'sys_doctors',
                            'localField': '_id',
                            'foreignField': '_id',
                            'as': 'pymDoc',
                            'pipeline': [
                                {
                                    '$project': {
                                        'price': '$mon.amm'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'encrypt_id': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            },
                        }
                    },
                    {
                        '$match': { '$and': [filterName, filterIdOrder] }
                    }
                ],
                [
                    {
                        '$project': {
                            '_id': 0,
                            'time_consul': { '$concat': ['$date_consul', ' ', '$time_consul'] },
                            'doctor_name': '$doctor_name',
                            'doctor_avatar': '$doctor_avatar',
                            'doctor_specialist' : '$spec',
                            'store_name': '$store_name',
                            'store_image': '$store_image',
                            'price': { '$ifNull': [{ '$first': '$pymDoc.price' }, { '$toInt': '0' }] },
                            'id_order': { '$toUpper': '$encrypt_id' },
                        }
                    },
                ], page, 3, item_limit
            ))

            res.status(200).json(jsonData(historyChatDoc[0]))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async allcart(req, res, next) {
        try {
            const { _id } = req.params
            const idDecrypt = decryptId(_id, 12)
            const { search, page, item_limit } = req.query

            let filterSeller = 0
            let filterProduct = 0

            if (search) {
                filterSeller = {
                    'store_name': {
                        '$regex': search,
                        '$options': 'i'
                    }
                }

                filterProduct = {
                    'cart.name': {
                        '$regex': search,
                        '$options': 'i'
                    }
                }
            } else {
                filterSeller = {}
                filterProduct = {}
            }

            const allcart = await UserCart.aggregate(queryPagination(
                [
                    {
                        '$match': { '_u': ObjectID(idDecrypt) }
                    },
                    {
                        '$unwind': { 'path': '$dat' }
                    },
                    {
                        '$lookup': {
                            'from': 'stores_products',
                            'localField': 'dat._p',
                            'foreignField': '_id',
                            'as': 'product',
                            'pipeline': [
                                {
                                    '$project': {
                                        'name': '$det.nms',
                                        'image': {
                                            '$concat': [`${rt_link}store/ip/`, {
                                                '$function': {
                                                    'body': encrypt,
                                                    'args': [{ '$toString': '$_id' }, 12],
                                                    'lang': 'js'
                                                }
                                            }, '/0']
                                        },
                                        '_id': 0
                                    }
                                },

                            ]
                        },
                    },
                    {
                        '$unwind': { 'path': '$product' }
                    },

                    {
                        '$set': {
                            'product.price': '$dat.prc'
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'stores',
                            'localField': '_s',
                            'foreignField': '_id',
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
                                        },
                                    }
                                },
                                {
                                    '$project': {
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
                                        'store_image': { '$concat': [`${rt_link}store/i/`, { '$toString': '$store_id' }] },
                                        '_id': 0
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$unwind': {
                            'path': '$stores',
                        }
                    },
                    {
                        '$group': {
                            '_id': '$_s',
                            'store_name': { '$first': '$stores.store_name' },
                            'store_image': { '$first': '$stores.store_image' },
                            'cart': { '$push': '$product' }
                        }
                    },
                    {
                        '$match': { '$or': [filterProduct, filterSeller] }
                    }
                ],
                [
                    {
                        '$project': {
                            'store_name': '$store_name',
                            'store_image': '$store_image',
                            'cart': '$cart',
                            '_id': 0
                        }
                    },
                ], page, 3, item_limit
            ))

            res.status(200).json(jsonData(allcart[0]))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async countBought(req, res, next) {
        try {
            const { _id } = req.params
            const idDecrypt = decryptId(_id, 12)

            let { time_start, time_end } = req.query

            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }

            time_start = date2number(time_start)
            time_end = date2number(time_end)

            const countBought = await Sys_payment.aggregate(
                [
                    {
                        '$match': {
                            '$and': [
                                { 'ep': { '$lte': time_start } },
                                { 'ep': { '$gte': time_end } },
                                { '_u': ObjectID(idDecrypt) }
                            ]
                        }
                    },
                    {
                        '$facet': {
                            'total': [
                                {
                                    '$addFields': {
                                        'totalqty': { '$sum': '$dat.qty' }
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$project': {
                            'total_bought': { '$sum': '$total.totalqty' }
                        }
                    }
                ]
            )

            res.status(200).json(jsonData(countBought[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async allBought(req, res, next) {
        try {
            const { _id } = req.params
            const idDecrypt = decryptId(_id, 12)

            let { page, item_limit, tab, search, time_start, time_end } = req.query

            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }

            time_start = date2number(time_start)
            time_end = date2number(time_end)

            let status = 0

            if (tab) {
                status = { 'status': tab }
            } else {
                status = {}
            }


            let filterSeller = 0
            let filterProduct = 0

            if (search) {
                filterSeller = {
                    'store_name': {
                        '$regex': search,
                        '$options': 'i'
                    }
                }

                filterProduct = {
                    'product.name': {
                        '$regex': search,
                        '$options': 'i'
                    }
                }
            } else {
                filterSeller = {}
                filterProduct = {}
            }

            const allBought = await Sys_payment.aggregate(queryPagination(
                [
                    {
                        '$match': {
                            '$and': [
                                { 'ep': { '$lte': time_start } },
                                { 'ep': { '$gte': time_end } },
                                { '_u': ObjectID(idDecrypt) }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'status': switchbranch,
                            'order_id': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            },
                            'product': {
                                '$map': {
                                    'input': '$dat',
                                    'in': {
                                        'name': '$$this.pn',
                                        'quantity': '$$this.qty',
                                        'price': '$$this.prc',
                                        'image': {
                                            '$concat': [`${rt_link}store/ip/`, {
                                                '$function': {
                                                    'body': encrypt,
                                                    'args': [{ '$toString': '$$this._p' }, 12],
                                                    'lang': 'js'
                                                }
                                            }, '/0']
                                        },
                                    }
                                }
                            }
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'stores',
                            'localField': '_s',
                            'foreignField': '_id',
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
                                        },
                                    }
                                },
                                {
                                    '$project': {
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
                                        'store_image': { '$concat': [`${rt_link}store/i/`, { '$toString': '$store_id' }] },
                                        '_id': 0
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$unwind': {
                            'path': '$stores',
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'cfg_payment_list',
                            'foreignField': 'code',
                            'localField': 'pym.chn',
                            'as': 'mt',
                            'pipeline': [
                                {
                                    '$project': {
                                        'methods': { '$concat': ['$title', ' ', '$bank'] }
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'payment_methods': { '$ifNull': [{ '$first': '$mt.methods' }, '-'] },
                            'total_price': { '$sum': '$product.price' },
                            'order_date': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'dateString': { '$toDate': { '$multiply': ['$ep', 1000] } }
                        }
                    },
                    {
                        '$addFields': {
                            'date': {
                                '$function': {
                                    'body': get_day,
                                    'args': ['$dateString'],
                                    'lang': 'js'
                                }
                            },

                        }
                    },
                    {
                        '$match': {
                            '$and': [status]
                        }
                    },
                    {
                        '$match': {
                            '$or': [filterProduct, filterSeller]
                        }
                    }
                ],
                [
                    {
                        '$project': {
                            'order_id': { '$toUpper': '$order_id' },
                            '_id': 0,
                            'store_image': '$stores.store_image',
                            'store_name': '$stores.store_name',
                            'status': '$status',
                            'order_date': { '$concat': ['$date', ' ', '$order_date'] },
                            'shippment_service': '$shp.chn',
                            'resi': '$shp.rsi',
                            'payment_methods': '$payment_methods',
                            'total_price': '$total_price',
                            'product': '$product'
                        }
                    }
                ], page, 3, item_limit
            ))
            res.status(200).json(jsonData(allBought[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async getHistoryScanMm(req, res, next) {
        try {
            const { item_token_user, item_ep } = req.query
            const userDecrypt = decryptId(item_token_user, 12)

            let changeDate = new Date(Number(item_ep) * 1000)

            let date = {
                year: changeDate.getFullYear().toString(),
                month: (changeDate.getUTCMonth() + 1).toString(),
                day: changeDate.getDate().toString()
            }

            if (date.month.length < 2) {
                date.month = `0${date.month}`
            }

            if (date.day.length < 2) {
                date.day = `0${date.day}`
            }

            let dateGallery = `${date.year}/${date.month}/${date.day}`


            res.sendFile(`${userDecrypt}-${item_ep}.jpg`, { root: `${path_gallery_magic_mirror}${dateGallery}` }, (err => {
                if (err) {
                    res.sendFile(file_error_magic_mirror, { root: path_gallery_magic_mirror_error })
                } else {
                    console.log('Sent:', `${userDecrypt}-${item_ep}.jpg`)
                }
            }))


        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async getListHistory(req, res, next) {
        try {
            const { _id } = req.params
            const idDecrypt = decryptId(_id, 12)


            const getListHistory = await Config.aggregate(
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
                                    '$match': { '_u': ObjectID(idDecrypt) }
                                },
                                {
                                    '$addFields': {
                                        'item_date': {
                                            '$dateToString': {
                                                'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                                'format': '%Y/%m/%d',
                                                'onNull': '2020/01/01'
                                            }
                                        },
                                        'item_time': {
                                            '$dateToString': {
                                                'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                                'format': '%H:%M',
                                                'onNull': '2020/01/01'
                                            }
                                        },
                                        'id_encrypt': {
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
                                        'item_token_user': _id,
                                        'item_token_scan': '$id_encrypt',
                                        'item_ep': '$ep',
                                        'item_date_time': { '$concat': ['$item_date', ' ', '$item_time'] }
                                    }
                                },
                            ]
                        }
                    }
                ]
            )

            res.status(200).json(jsonData(getListHistory[0].scan))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }
}



module.exports = PenggunaController