const { filter_map } = require("../../../helper/filter_map")

function public_summary(time) {


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
                        { 'pym.sts': 'settlement' },
                        { 'src': 'apps' },
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
                }
            }
        ]
    )
    return query
}

module.exports = public_summary