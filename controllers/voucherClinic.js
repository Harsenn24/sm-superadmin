const { jsonData } = require("../middleware/sucess")
const { Stores_clinic, StoreVoucher, Sys_voucher } = require("../model")
const { date2number } = require("../helper/date2number")

class VoucherController {
    static async total_clinic(req, res) {
        try {
            let { time_start, time_end, time_start_double, time_end_double } = req.query
            time_start = date2number(time_start)
            time_end = date2number(time_end)
            time_start_double = date2number(time_start_double)
            time_end_double = date2number(time_end_double)

            const total_clinic = await Stores_clinic.aggregate([
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
                        'total_a': [
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
                        'total_b': [
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
                        'total_a': { '$sum': '$total_a.count_result' },
                        'total_b': { '$sum': '$total_b.count_result' },
                    }
                },
                {
                    '$addFields': {
                        'percent': {
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
                        }
                    }
                },
                {
                    '$project': {
                        'total_clinic': '$total_a',
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
            res.status(200).json(jsonData(total_clinic[0]))

        } catch (error) {
            console.log(error);
        }
    }

    static async voucher_active(req, res) {
        try {
            let { time_start, time_end, time_start_double, time_end_double } = req.query
            time_start = date2number(time_start)
            time_end = date2number(time_end)
            time_start_double = date2number(time_start_double)
            time_end_double = date2number(time_end_double)
            const voucher_active = await StoreVoucher.aggregate([
                {
                    '$match': {
                        '$and': [
                            { 'ep': { '$lte': time_start } },
                            { 'ep': { '$gte': time_end_double } }
                        ]
                    }
                },
                {
                    '$addFields': {
                        'is_active': {
                            '$cond': {
                                'if': { '$lte': [date2number(), '$epe'] },
                                'then': { '$toBool': true },
                                'else': { '$toBool': false }
                            }
                        }
                    }
                },
                {
                    '$match': {
                        'is_active': true
                    }
                },
                {
                    '$facet': {
                        'total_a': [
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
                        'total_b': [
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
                        'total_a': { '$sum': '$total_a.count_result' },
                        'total_b': { '$sum': '$total_b.count_result' },
                    }
                },
                {
                    '$addFields': {
                        'percent': {
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
                        }
                    }
                },
                {
                    '$project': {
                        'total_voucher_active': '$total_a',
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
            res.status(200).json(jsonData(voucher_active[0]))

        } catch (error) {
            console.log(error);
        }
    }

    static async voucher_sale(req, res) {
        try {
            let { time_start, time_end, time_start_double, time_end_double } = req.query
            time_start = date2number(time_start)
            time_end = date2number(time_end)
            time_start_double = date2number(time_start_double)
            time_end_double = date2number(time_end_double)
            const voucher_sale = await Sys_voucher.aggregate([
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
                        'total_a': [
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
                        'total_b': [
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
                        'total_a': { '$sum': '$total_a.count_result' },
                        'total_b': { '$sum': '$total_b.count_result' },
                    }
                },
                {
                    '$addFields': {
                        'percent': {
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
                        }
                    }
                },
                {
                    '$project': {
                        'total_voucher_sale': '$total_a',
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
            res.status(200).json(jsonData(voucher_sale[0]))

        } catch (error) {
            console.log(error);
        }
    }

}

module.exports = VoucherController