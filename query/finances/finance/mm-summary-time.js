const { ObjectID } = require("bson")
const { filter_map } = require("../../../helper/filter_map")

function summary_source_time(idDecrypt, type, time) {

    let store_field = 0
    let local_field = 0


    for (let i = 0; i < type.length; i++) {
        if (type[i] === 'member-onsite' || type[i] === 'member-offline') {
            store_field = { '_s': ObjectID(idDecrypt) }
            local_field = '_s'
        } else {
            store_field = { 'cld._s': ObjectID(idDecrypt) }
            local_field = 'cld._s'
        }
    }

    let query = (
        [
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
                        { 'src': { '$in': type } },
                        { 'month_year': time }
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
                                'price_netto': '$prn'
                            }
                        }
                    ],
                    'bulanan': [
                        {
                            '$match': { 'typ': 'monthly' }
                        },
                        {
                            '$project': {
                                'price_netto': '$prn'
                            }
                        }
                    ],
                    'tahunan': [
                        {
                            '$match': { 'typ': 'yearly' }
                        },
                        {
                            '$project': {
                                'price_netto': '$prn'
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
                '$lookup': {
                    'from': 'config',
                    'as': 'static_price',
                    'pipeline': [
                        {
                            '$match': {
                                '$and': [
                                    { 'type': 'subscribe' },
                                    { 'subtype': 'prices' },
                                ]
                            }
                        },
                        {
                            '$project': {
                                'harian': filter_map('$data', 'daily', '$$this.type', '$$this.price'),
                                'bulanan': filter_map('$data', 'monthly', '$$this.type', '$$this.price'),
                                'tahunan': filter_map('$data', 'yearly', '$$this.type', '$$this.price'),
                            }
                        }
                    ]
                }
            },

            {
                '$project': {
                    'daily': {
                        'income': { '$sum': '$harian.price_netto' },
                        'subs': { '$ifNull': [{ '$first': '$static_price.harian' }, '-'] }
                    },
                    'monthly': {
                        'income': { '$sum': '$bulanan.price_netto' },
                        'subs': { '$ifNull': [{ '$first': '$static_price.bulanan' }, '-'] }

                    },
                    'yearly': {
                        'income': { '$sum': '$tahunan.price_netto' },
                        'subs': { '$ifNull': [{ '$first': '$static_price.tahunan' }, '-'] }
                    },
                    'store_name': { '$ifNull': [{ '$first': '$store_name.name' }, '-'] }
                }
            }
        ]
    )
    return query
}

module.exports = { summary_source_time }