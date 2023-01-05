const { filter_map } = require("../../../helper/filter_map")
const { ObjectID } = require("bson")


function seller_income_card(idDecrypt, month_year) {
    let query = [
        {
            $match: {
                $and: [
                    { 'src': 'member-online' },
                    { 'pym.sts': 'settlement' },
                    { 'cld._s': ObjectID(idDecrypt) }
                ]
            }
        },
        {
            $addFields: {
                'date': {
                    '$dateToString': {
                        'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                        'format': '%m-%Y',
                        'onNull': '2020-01-01'
                    }
                },
            }
        },
        {
            $match: { 'date': month_year }
        },
        {
            $facet: {
                'harian': [
                    {
                        $match: { 'typ': 'daily' },
                    },
                    {
                        $project: {
                            income: '$mon.clm'
                        }
                    }
                ],
                'bulanan': [
                    {
                        $match: { 'typ': 'monthly' },
                    },
                    {
                        $project: {
                            income: '$mon.clm'
                        }
                    }
                ],
                'tahunan': [
                    {
                        $match: { 'typ': 'yearly' },
                    },
                    {
                        $project: {
                            income: '$mon.clm'
                        }
                    }
                ],
                'config': [
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
                        $project: {
                            default_daily: { '$ifNull': [{ '$first': '$static_price.harian' }, '-'] },
                            default_monthly: { '$ifNull': [{ '$first': '$static_price.bulanan' }, '-'] },
                            default_yearly: { '$ifNull': [{ '$first': '$static_price.tahunan' }, '-'] },
                        }
                    }
                ]
            }
        },
        {
            $project: {
                daily: { '$sum': '$harian.income' },
                monthly: { '$sum': '$bulanan.income' },
                yearly: { '$sum': '$tahunan.income' },
                default_daily: { '$ifNull': [{ '$first': '$config.default_daily' }, '-'] },
                default_monthly: { '$ifNull': [{ '$first': '$config.default_monthly' }, '-'] },
                default_yearly: { '$ifNull': [{ '$first': '$config.default_yearly' }, '-'] },
            }
        }
    ]

    return query
}

module.exports = { seller_income_card }