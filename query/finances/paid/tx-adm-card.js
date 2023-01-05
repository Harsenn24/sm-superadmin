const { ObjectID } = require("bson")
const { mon_fee } = require("../../../helper/count")

function tax_admin_card() {
    let query = [
        {
            '$match': { '_id': ObjectID(idDecrypt) }
        },
        {
            '$lookup': {
                'from': 'sys_vouchers',
                'as': 'vch',
                'localField': '_id',
                'foreignField': '_s',
                'pipeline': [
                    {
                        '$match': { 'pym.sts': 'settlement' }
                    },
                    {
                        '$facet': {
                            'total': [
                                {
                                    '$project': {
                                        'fee': mon_fee(),
                                        'pph': '$mon.pph',
                                        'ppn': { '$toInt': '0' },
                                    }
                                }
                            ],
                        }
                    },
                    {
                        '$project': {
                            'totalFee': { '$ifNull': [{ '$sum': '$total.fee' }, { '$toInt': '0' }] },
                            'totalPPH': { '$ifNull': [{ '$sum': '$total.pph' }, { '$toInt': '0' }] },
                            'totalPPN': { '$ifNull': [{ '$sum': '$total.ppn' }, { '$toInt': '0' }] },
                            '_id': 0,
                        }
                    }
                ]
            }
        },
        {
            '$lookup': {
                'from': 'sys_payment',
                'as': 'pym',
                'localField': '_id',
                'foreignField': '_s',
                'pipeline': [
                    {
                        '$match': {
                            '$and': [
                                { 'pym.sts': 'settlement' },
                                { 'shp.sts': 'settlement' },
                            ]
                        }
                    },
                    {
                        '$facet': {
                            'total': [
                                {
                                    '$project': {
                                        'fee': mon_fee(),
                                        'pph': '$mon.pph',
                                        'ppn': '$mon.ppn',
                                    }
                                }
                            ],
                        }
                    },
                    {
                        '$project': {
                            'totalFee': { '$ifNull': [{ '$sum': '$total.fee' }, { '$toInt': '0' }] },
                            'totalPPH': { '$ifNull': [{ '$sum': '$total.pph' }, { '$toInt': '0' }] },
                            'totalPPN': { '$ifNull': [{ '$sum': '$total.ppn' }, { '$toInt': '0' }] },
                            '_id': 0,
                        }
                    }
                ]
            }
        },
        {
            '$project': {
                '_id': 0,
                'voucher': {
                    'fee': { '$first': '$vch.totalFee' },
                    'pph': { '$first': '$vch.totalPPH' },
                    'ppn': { '$first': '$vch.totalPPN' },
                },
                'payment': {
                    'fee': { '$first': '$pym.totalFee' },
                    'pph': { '$first': '$pym.totalPPH' },
                    'ppn': { '$first': '$pym.totalPPN' },
                },
            }
        }
    ]

    return query
}

module.exports = { tax_admin_card }