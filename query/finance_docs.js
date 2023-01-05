const { range_day_aggregate } = require("../helper/range_day")
const { percent_aggregate } = require("../helper/percent")
const { mon_fee, mon_fen } = require("../helper/count")


function finance_doctor(time_start, time_end, time_start_double, time_end_double) {
    return (
        [
            {
                '$limit': 1
            },
            {
                '$lookup': {
                    'from': 'sys_doctors',
                    'as': 'dc',
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
                                'netNow': [
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
                                            '_id': 0,
                                            'data': '$mon.fen'
                                        }
                                    }
                                ],
                                'netDouble': [
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
                                            '_id': 0,
                                            'data': '$mon.fen'
                                        }
                                    }
                                ],
                                'grossNow': [
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
                                            '_id': 0,
                                            'data': mon_fee()
                                        }
                                    }
                                ],
                                'grossDouble': [
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
                                            '_id': 0,
                                            'data': mon_fee()
                                        }
                                    }
                                ],
                                'taxNow': [
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
                                            '_id': 0,
                                            'data': { '$add': ['$mon.ppn', '$mon.pph'] }
                                        }
                                    }
                                ],
                                'taxDouble': [
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
                                            '_id': 0,
                                            'data': { '$add': ['$mon.ppn', '$mon.pph'] }
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            '$project': {
                                'netNow': { '$ifNull': [{ '$sum': '$netNow.data' }, { '$toInt': '0' }] },
                                'netDouble': { '$ifNull': [{ '$sum': '$netDouble.data' }, { '$toInt': '0' }] },
                                'grossNow': { '$ifNull': [{ '$sum': '$grossNow.data' }, { '$toInt': '0' }] },
                                'grossDouble': { '$ifNull': [{ '$sum': '$grossDouble.data' }, { '$toInt': '0' }] },
                                'taxNow': { '$ifNull': [{ '$sum': '$taxNow.data' }, { '$toInt': '0' }] },
                                'taxDouble': { '$ifNull': [{ '$sum': '$taxDouble.data' }, { '$toInt': '0' }] },
                            }
                        }
                    ]
                }
            },
            {
                '$addFields': {
                    'netNow': { '$ifNull': [{ '$sum': '$dc.netNow' }, { '$toInt': '0' }] },
                    'netDouble': { '$ifNull': [{ '$sum': '$dc.netDouble' }, { '$toInt': '0' }] },
                    'grossNow': { '$ifNull': [{ '$sum': '$dc.grossNow' }, { '$toInt': '0' }] },
                    'grossDouble': { '$ifNull': [{ '$sum': '$dc.grossDouble' }, { '$toInt': '0' }] },
                    'taxNow': { '$ifNull': [{ '$sum': '$dc.taxNow' }, { '$toInt': '0' }] },
                    'taxDouble': { '$ifNull': [{ '$sum': '$dc.taxDouble' }, { '$toInt': '0' }] },
                }
            },
            {
                '$addFields': {
                    'percent_net': percent_aggregate('$netNow', '$netDouble'),
                    'percent_gross': percent_aggregate('$grossNow', '$grossDouble'),
                    'percent_tax': percent_aggregate('$taxNow', '$taxDouble'),
                    'diff_day': range_day_aggregate(time_start, time_end)

                }
            },
            {
                '$project': {
                    'net_income': '$netNow',
                    'net_percent': '$percent_net',
                    'gross_income': '$grossNow',
                    'gross_percent': '$percent_gross',
                    'tax_income': '$taxNow',
                    'tax_percent': '$percent_tax',
                    'diff_day': '$diff_day',
                    '_id': 0
                }
            }
        ]
    )
}


module.exports = { finance_doctor }