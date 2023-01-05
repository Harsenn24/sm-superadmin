const { ObjectID } = require("bson")

function tax_magicmirror_summary(idDecrypt, source) {

    let foreign_field = 0
    let local_field = 0

    for (let i = 0; i < source.length; i++) {
        if (source[i] === 'member-onsite' || source[i] === 'member-offline') {
            foreign_field = { '_s': ObjectID(idDecrypt) }
            local_field = '_s'
        } else {
            foreign_field = { 'cld._s': ObjectID(idDecrypt) }
            local_field = 'cld._s'

        }
    }


    let query = [
        {
            '$match': {
                '$and': [
                    foreign_field,
                    { 'pym.sts': 'settlement' },
                    { 'src': { '$in': source } }
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
                            'price_netto': '$prn',
                            'ppn': '$mon.ppn'
                        }
                    }
                ],
                'bulanan': [
                    {
                        '$match': { 'typ': 'monthly' }
                    },
                    {
                        '$project': {
                            'price_netto': '$prn',
                            'ppn': '$mon.ppn'

                        }
                    }
                ],
                'tahunan': [
                    {
                        '$match': { 'typ': 'yearly' }
                    },
                    {
                        '$project': {
                            'price_netto': '$prn',
                            'ppn': '$mon.ppn'

                        }
                    }
                ],
                'store_name': [
                    {
                        '$lookup': {
                            'from': 'stores',
                            'localField': local_field,
                            'foreignField': '_id',
                            'as': 'st',
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
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$project': {
                            'name': { '$ifNull': [{ '$first': '$st.store_name' }, '-'] }
                        }
                    }
                ]
            }
        },
        {
            '$project': {
                'daily': {
                    'income': { '$sum': '$harian.price_netto' },
                    'ppn': { '$sum': '$harian.ppn' },
                },
                'monthly': {
                    'income': { '$sum': '$bulanan.price_netto' },
                    'ppn': { '$sum': '$bulanan.ppn' },

                },
                'yearly': {
                    'income': { '$sum': '$tahunan.price_netto' },
                    'ppn': { '$sum': '$tahunan.ppn' },
                },
                'store_name': { '$ifNull': [{ '$first': '$store_name.name' }, '-'] }
            }
        }
    ]

    return query
}

module.exports = { tax_magicmirror_summary }