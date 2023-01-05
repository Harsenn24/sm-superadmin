const { ObjectID } = require("bson")

function tax_magicmirror_monthyear_summary(idDecrypt, time, source) {

    let store_field = 0

    for (let i = 0; i < source.length; i++) {
        if (source[i] === 'member-onsite' || source[i] === 'member-offline') {
            store_field = { '_s': ObjectID(idDecrypt) }
        } else {
            store_field = { 'cld._s': ObjectID(idDecrypt) }
        }

    }

    let query = [
        {
            '$addFields': {
                'month_year': {
                    '$dateToString': {
                        'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                        'format': '%m-%Y',
                        'onNull': '2020-01'
                    }
                },
            }
        },
        {
            '$match': {
                '$and': [
                    store_field,
                    { 'pym.sts': 'settlement' },
                    { 'src': { '$in': source } },
                    { 'month_year': time },

                ]
            }
        },
        {
            '$facet': {
                'harian': [
                    {
                        '$match': { 'typ': 'daily' }
                    },
                    {
                        '$project': {
                            'income': '$prn',
                            'ppn': '$mon.ppn',
                            'commission': '$mon.clm',
                        }
                    }
                ],
                'bulanan': [
                    {
                        '$match': { 'typ': 'monthly' }
                    },
                    {
                        '$project': {
                            'income': '$prn',
                            'ppn': '$mon.ppn',
                            'commission': '$mon.clm',
                        }
                    }
                ],
                'tahunan': [
                    {
                        '$match': { 'typ': 'yearly' }
                    },
                    {
                        '$project': {
                            'income': '$prn',
                            'ppn': '$mon.ppn',
                            'commission': '$mon.clm',
                        }
                    }
                ]
            }
        },
        {
            '$project': {
                'daily': {
                    'income': { '$ifNull': [{ '$sum': '$harian.income' }, { '$toInt': '0' }] },
                    'ppn': { '$ifNull': [{ '$sum': '$harian.ppn' }, { '$toInt': '0' }] },
                    'commission': { '$ifNull': [{ '$sum': '$harian.commission' }, { '$toInt': '0' }] },
                },
                'monthly': {
                    'income': { '$ifNull': [{ '$sum': '$bulanan.income' }, { '$toInt': '0' }] },
                    'ppn': { '$ifNull': [{ '$sum': '$bulanan.ppn' }, { '$toInt': '0' }] },
                    'commission': { '$ifNull': [{ '$sum': '$bulanan.commission' }, { '$toInt': '0' }] },
                },
                'yearly': {
                    'income': { '$ifNull': [{ '$sum': '$tahunan.income' }, { '$toInt': '0' }] },
                    'ppn': { '$ifNull': [{ '$sum': '$tahunan.ppn' }, { '$toInt': '0' }] },
                    'commission': { '$ifNull': [{ '$sum': '$tahunan.commission' }, { '$toInt': '0' }] },
                }
            }
        }
    ]

    return query
}

module.exports = { tax_magicmirror_monthyear_summary }