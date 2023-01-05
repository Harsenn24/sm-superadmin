const { mon_fee } = require("../../../helper/count")

function summary_tax(time_start, time_end) {
    let query = [
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
                                { 'ep': { '$lte': time_start } },
                                { 'ep': { '$gte': time_end } },
                                { 'pym.sts': 'settlement' }
                            ]
                        }
                    },
                    {
                        '$facet': {
                            'fee': [
                                {
                                    '$project': {
                                        'total': '$prn'
                                    }
                                }
                            ],
                            'ppn': [
                                {
                                    '$project': {
                                        'total': '$mon.ppn'
                                    }
                                }
                            ],
                            'pph': [
                                {
                                    '$project': {
                                        'total': '$mon.pph'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$project': {
                            'fee': { '$sum': '$fee.total' },
                            'pph': { '$sum': '$pph.total' },
                            'ppn': { '$sum': '$ppn.total' },
                            '_id': 0
                        }
                    }
                ]
            },
        },
        {
            '$unwind': { 'path': '$magic_mirror' }
        },
        {
            '$lookup': {
                'from': 'sys_payment',
                'as': 'adminProd',
                'pipeline': [
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
                        '$facet': {
                            'fee': [
                                {
                                    '$project': {
                                        'total': mon_fee()
                                    }
                                }
                            ],
                            'ppn': [
                                {
                                    '$project': {
                                        'total': '$mon.ppn'
                                    }
                                }
                            ],
                            'pph': [
                                {
                                    '$project': {
                                        'total': '$mon.pph'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$project': {
                            'fee': { '$sum': '$fee.total' },
                            'pph': { '$sum': '$pph.total' },
                            'ppn': { '$sum': '$ppn.total' },
                            '_id': 0
                        }
                    }
                ]
            },
        },
        {
            '$unwind': { 'path': '$adminProd' }
        },
        {
            '$lookup': {
                'from': 'sys_vouchers',
                'as': 'adminVoucher',
                'pipeline': [
                    {
                        '$match': {
                            '$and': [
                                { 'ep': { '$lte': time_start } },
                                { 'ep': { '$gte': time_end } },
                                { 'pym.sts': 'settlement' },

                            ]
                        }
                    },
                    {
                        '$facet': {
                            'fee': [
                                {
                                    '$project': {
                                        'total': mon_fee()
                                    }
                                }
                            ],
                            'ppn': [
                                {
                                    '$project': {
                                        'total': 0
                                    }
                                }
                            ],
                            'pph': [
                                {
                                    '$project': {
                                        'total': '$mon.pph'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$project': {
                            'fee': { '$sum': '$fee.total' },
                            'pph': { '$sum': '$pph.total' },
                            'ppn': { '$sum': '$ppn.total' },
                            '_id': 0
                        }
                    }
                ]
            },
        },
        {
            '$unwind': { 'path': '$adminVoucher' }
        },
        {
            '$lookup': {
                'from': 'sys_doctors',
                'as': 'commission',
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
                                { 'pym.sts': 'settlement' },

                            ]
                        }
                    },
                    {
                        '$facet': {
                            'fee': [
                                {
                                    '$project': {
                                        'total': mon_fee()
                                    }
                                }
                            ],
                            'ppn': [
                                {
                                    '$project': {
                                        'total': '$mon.ppn'
                                    }
                                }
                            ],
                            'pph': [
                                {
                                    '$project': {
                                        'total': '$mon.pph'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$project': {
                            'fee': { '$sum': '$fee.total' },
                            'pph': { '$sum': '$pph.total' },
                            'ppn': { '$sum': '$ppn.total' },
                            '_id': 0
                        }
                    }
                ]
            },
        },
        {
            '$unwind': { 'path': '$commission' }
        },
        {
            '$project': {
                'magic_mirror': '$magic_mirror',
                'commission': '$commission',
                'admin': {
                    'fee': { '$add': ['$adminProd.fee', '$adminVoucher.fee'] },
                    'pph': { '$add': ['$adminProd.pph', '$adminVoucher.pph'] },
                    'ppn': { '$add': ['$adminProd.ppn', '$adminVoucher.ppn'] },
                },
                '_id': 0
            }
        }
    ]

    return query
}

module.exports = { summary_tax }