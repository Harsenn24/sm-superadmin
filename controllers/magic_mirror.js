const { date2number } = require("../helper/date2number")
const { decrypt } = require("../helper/enkrip_id")
const { queryPagination } = require("../helper/pagination")
const { jsonData } = require("../middleware/sucess")
const { Sys_subscribe, Config, User } = require("../model")

class MagicMirrorController {
    static async total_Income(req, res, next) {
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
            const total_income = await Sys_subscribe.aggregate([
                {
                    '$sort': { '_id': -1 }
                },
                {
                    '$match': {
                        '$and': [
                            { 'pym.sts': 'settlement' }
                        ]
                    }
                },
                {
                    '$facet': {
                        'incomeCurrentWeek': [
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
                                    'data': '$prc',
                                    '_id': 0
                                }
                            }
                        ],
                        'incomeLastWeek': [
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
                                    'data': '$prc',
                                    '_id': 0
                                }
                            }
                        ]
                    }
                },
                {
                    '$addFields': {
                        'incomeCurrentWeek': { '$sum': '$incomeCurrentWeek.data' },
                        'percentage': {
                            '$multiply': [
                                {
                                    '$divide': [
                                        { '$subtract': [{ '$sum': '$incomeCurrentWeek.data' }, { '$sum': '$incomeLastWeek.data' }] },
                                        {
                                            '$cond': {
                                                'if': { '$lte': [{ '$sum': '$incomeLastWeek.data' }, 0] },
                                                'then': { '$sum': '$incomeCurrentWeek.data' },
                                                'else': { '$sum': '$incomeLastWeek.data' }
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
                        'incomeCurrentWeek': '$incomeCurrentWeek',
                        'percentage': '$percentage'
                    }
                }
            ])

            if (total_income.length === 0) {
                throw { message: 'Data not found' }
            }

            res.status(200).json(jsonData(total_income[0]))
        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async total_customer(req, res, next) {
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
            const total_customer = await Sys_subscribe.aggregate([
                {
                    '$sort': { '_id': -1 }
                },
                {
                    '$match': {
                        '$and': [
                            { 'pym.sts': 'settlement' },
                            { 'ep': { '$lte': time_start } },
                            { 'ep': { '$gte': time_end_double } }
                        ]
                    }
                },
                {
                    '$facet': {
                        'thisWeek': [
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
                        'lastWeek': [
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
                        ]
                    }
                },
                {
                    '$addFields': {
                        'thisWeek': { '$ifNull': [{ '$first': '$thisWeek.data' }, 0] },
                        'lastWeek': { '$ifNull': [{ '$first': '$lastWeek.data' }, 0] },
                    }
                },
                {
                    '$addFields': {
                        'percentage': {
                            '$multiply': [
                                {
                                    '$divide': [
                                        { '$subtract': ['$thisWeek', '$lastWeek'] },
                                        {
                                            '$cond': {
                                                'if': { '$lte': ['$lastWeek', 0] },
                                                'then': '$thisWeek',
                                                'else': '$lastWeek'
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
                        'totalCustomer': '$thisWeek',
                        'percentage': '$percentage'
                    }
                }
            ])

            if (total_customer.length === 0) {
                throw { message: 'Data not found' }
            }

            res.status(200).json(jsonData(total_customer[0]))
        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async monthly_customer(req, res, next) {
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

            const monthly_customer = await Sys_subscribe.aggregate([
                {
                    '$sort': { '_id': -1 }
                },
                {
                    '$match': {
                        '$and': [
                            { 'pym.sts': 'settlement' },
                            { 'typ': 'monthly' },
                            { 'epe': { gt: date2number('') } }
                        ]
                    }
                },
                {
                    '$facet': {
                        'thisWeek': [
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
                        'lastWeek': [
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
                    }
                },
                {
                    '$addFields': {
                        'thisWeek': { '$ifNull': [{ '$first': '$thisWeek.data' }, 0] },
                        'lastWeek': { '$ifNull': [{ '$first': '$lastWeek.data' }, 0] },
                    }
                },
                {
                    '$addFields': {
                        'percentage': {
                            '$multiply': [
                                {
                                    '$divide': [
                                        { '$subtract': ['$thisWeek', '$lastWeek'] },
                                        {
                                            '$cond': {
                                                'if': { '$lte': ['$lastWeek', 0] },
                                                'then': 1,
                                                'else': '$lastWeek'
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
                        'totalCustomer': '$thisWeek',
                        'percentage': '$percentage'
                    }
                }
            ])

            if (monthly_customer.length === 0) {
                throw { message: 'Data not found' }
            }

            res.status(200).json(jsonData(monthly_customer[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async yearly_customer(req, res, next) {
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

            const yearly_customer = await Sys_subscribe.aggregate([
                {
                    '$sort': { '_id': -1 }
                },
                {
                    '$match': {
                        '$and': [
                            { 'pym.sts': 'settlement' },
                            { 'typ': 'yearly' },
                            { 'epe': { gt: date2number('') } }
                        ]
                    }
                },
                {
                    '$facet': {
                        'thisWeek': [
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
                        'lastWeek': [
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
                    }
                },
                {
                    '$addFields': {
                        'thisWeek': { '$ifNull': [{ '$first': '$thisWeek.data' }, 0] },
                        'lastWeek': { '$ifNull': [{ '$first': '$lastWeek.data' }, 0] },
                    }
                },
                {
                    '$addFields': {
                        'percentage': {
                            '$round': [{
                                '$multiply': [
                                    {
                                        '$divide': [
                                            { '$subtract': ['$thisWeek', '$lastWeek'] },
                                            {
                                                '$cond': {
                                                    'if': { '$lte': ['$lastWeek', 0] },
                                                    'then': 1,
                                                    'else': '$lastWeek'
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
                        'totalCustomer': '$thisWeek',
                        'percentage': '$percentage'
                    }
                }
            ])

            if (yearly_customer.length === 0) {
                throw { message: 'Data not found' }
            }

            res.status(200).json(jsonData(yearly_customer[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async free_Customer(req, res) {
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
            const free_Customer = await Config.aggregate([
                {
                    '$limit': 1
                },
                {
                    '$lookup': {
                        'from': 'users',
                        'as': 'users',
                        'pipeline': [
                            {
                                '$facet': {
                                    'thisWeekUser': [
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
                                    'lastWeekUser': [
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
                                    ]
                                }
                            },
                            {
                                '$project': {
                                    'thisWeekUser': { '$ifNull': [{ '$first': '$thisWeekUser.data' }, 0] },
                                    'lastWeekUser': { '$ifNull': [{ '$first': '$lastWeekUser.data' }, 0] },
                                }
                            }
                        ],
                    }
                },
                {
                    '$lookup': {
                        'from': 'sys_subscribe',
                        'as': 'sys_subscribe',
                        'pipeline': [
                            {
                                '$sort': { '_id': -1 }
                            },
                            {
                                '$match': {
                                    '$and': [
                                        { 'pym.sts': 'settlement' },
                                        { 'epe': { '$gt': date2number('') } },
                                    ]
                                }
                            },
                            {
                                '$facet': {
                                    'thisWeek': [
                                        {
                                            '$match': {
                                                '$and': [
                                                    { 'ep': { '$lte': time_start } },
                                                    { 'ep': { '$gte': time_end } }
                                                ]
                                            }
                                        },
                                        {
                                            '$group': {
                                                '_id': '$_u'
                                            },
                                        },
                                        {
                                            '$count': 'data'
                                        }
                                    ],
                                    'lastWeek': [
                                        {
                                            '$match': {
                                                '$and': [
                                                    { 'ep': { '$lte': time_start_double } },
                                                    { 'ep': { '$gte': time_end_double } }
                                                ]
                                            }
                                        },
                                        {
                                            '$group': {
                                                '_id': '$_u'
                                            },
                                        },
                                        {
                                            '$count': 'data'
                                        }
                                    ]
                                }
                            },
                            {
                                '$project': {
                                    'thisWeek': { '$ifNull': [{ '$first': '$thisWeek.data' }, 0] },
                                    'lastWeek': { '$ifNull': [{ '$first': '$lastWeek.data' }, 0] },
                                }
                            }
                        ]
                    }
                },
                {
                    '$addFields': {
                        'userThisWeek': { '$ifNull': [{ '$first': '$users.thisWeekUser' }, 0] },
                        'userLastWeek': { '$ifNull': [{ '$first': '$users.lastWeekUser' }, 0] },
                        'sysThisWeek': { '$ifNull': [{ '$first': '$sys_subscribe.thisWeek' }, 0] },
                        'sysLastWeek': { '$ifNull': [{ '$first': '$sys_subscribe.lastWeek' }, 0] },
                    }
                },
                {
                    '$addFields': {
                        'percentage': {
                            '$round': [{
                                '$multiply': [
                                    {
                                        '$divide': [
                                            { '$subtract': [{ '$subtract': ['$userThisWeek', '$sysThisWeek'] }, { '$subtract': ['$userLastWeek', '$sysLastWeek'] }] },
                                            {
                                                '$cond': {
                                                    'if': { '$lte': [{ '$subtract': ['$userLastWeek', '$sysLastWeek'] }, 0] },
                                                    'then': { '$subtract': ['$userThisWeek', '$sysThisWeek'] },
                                                    'else': { '$subtract': ['$userLastWeek', '$sysLastWeek'] }
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
                        'userFreeThisWeek': { '$subtract': ['$userThisWeek', '$sysThisWeek'] },
                        'percentage': '$percentage',
                        '_id': 0
                    }
                }
            ])

            if (free_Customer.length === 0) {
                throw { message: 'Data not found' }
            }

            res.status(200).json(jsonData(free_Customer[0]))
        } catch (error) {
            console.log(error)
        }
    }

    static async list_magicMirror(req, res) {
        try {

            const list_magicMirror = await User.aggregate(queryPagination(
                [
                    {
                        '$sort': { '_id': -1 }
                    },
                    {
                        '$lookup': {
                            'from': 'sys_subscribe',
                            'as': 'sys_subscribe',
                            'localField': '_id',
                            'foreignField': '_u',
                            'pipeline': [
                                {
                                    '$sort': { '_id': -1 }
                                },
                                {
                                    '$facet': {
                                        'jml_pemakaian': [
                                            {
                                                '$match': { 'pym.sts': 'settlement' }
                                            },
                                            {
                                                '$count': 'data'
                                            }
                                        ],
                                        'tipePeriode': [
                                            {
                                                '$match': {
                                                    '$and': [
                                                        { 'pym.sts': 'settlement' },
                                                        { 'epe': { '$ne': null } },
                                                        { 'epe': { '$gte': date2number('') } },
                                                    ]
                                                }

                                            },
                                            {
                                                '$project': {
                                                    'type': '$typ',
                                                    'startDate': { '$toDate': { '$multiply': ['$eps', 1000] } },
                                                    'endDate': { '$toDate': { '$multiply': ['$epe', 1000] } },
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    '$project': {
                                        'jml_pemakaian': {
                                            '$cond': {
                                                'if': { '$eq': ['$jml_pemakaian', []] },
                                                'then': '0',
                                                'else': { '$first': '$jml_pemakaian.data' }
                                            }
                                        },
                                        'type': {
                                            '$cond': {
                                                'if': { '$eq': ['$tipePeriode', []] },
                                                'then': '0',
                                                'else': { '$first': '$tipePeriode.type' }
                                            }
                                        },
                                        'startDate': {
                                            '$cond': {
                                                'if': { '$eq': ['$tipePeriode', []] },
                                                'then': '0',
                                                'else': { '$first': '$tipePeriode.startDate' }
                                            }
                                        },
                                        'endDate': {
                                            '$cond': {
                                                'if': { '$eq': ['$tipePeriode', []] },
                                                'then': '0',
                                                'else': { '$first': '$tipePeriode.endDate' }
                                            }
                                        },
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
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
                            'email': {
                                '$function': {
                                    'body': decrypt,
                                    'args': [{ '$toString': '$dat.eml.val' }, 8],
                                    'lang': 'js'
                                }
                            },
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
                            'birthDate': new Date('$dat.bdy' * 1000),
                            'type': {
                                '$cond': {
                                    'if': { '$eq': [{ '$first': '$sys_subscribe.type' }, 'yearly'] },
                                    'then': '1 Tahun',
                                    'else': {
                                        '$cond': {
                                            'if': { '$eq': [{ '$first': '$sys_subscribe.type' }, 'monthly'] },
                                            'then': '1 Bulan',
                                            'else': 'Gratis'
                                        }
                                    }
                                }
                            },
                            'startDate': { '$first': '$sys_subscribe.startDate' },
                            'endDate': { '$first': '$sys_subscribe.endDate' },
                            'jml_pemakaian': { '$first': '$sys_subscribe.jml_pemakaian' },

                        }
                    }
                ],
                [
                    {
                        '$project': {
                            'fullName': '$fullName',
                            'email': '$email',
                            'sex': '$sex',
                            'age': '$birthDate',
                            'startDate': '$startDate',
                            'endDate': '$endDate',
                            'type': '$type',
                            'total_use': '$jml_pemakaian',
                            '_id': 0
                        }
                    }
                ], 1, 3, 6
            )
            )

            if (list_magicMirror.length === 0) {
                throw { message: 'Data not found' }
            }
            
            res.status(200).json(jsonData(list_magicMirror[0]))
        } catch (error) {
            console.log(error);
        }
    }
}

module.exports = MagicMirrorController