function tax_public_summary(time) {


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

                }
            },
            {
                '$project': {
                    'daily': {
                        'income': { '$sum': '$harian.price_netto' },
                        'ppn': { '$sum': '$harian.ppn' }
                    },
                    'monthly': {
                        'income': { '$sum': '$bulanan.price_netto' },
                        'ppn': { '$sum': '$bulanan.ppn' }

                    },
                    'yearly': {
                        'income': { '$sum': '$tahunan.price_netto' },
                        'ppn': { '$sum': '$tahunan.ppn' }

                    },
                }
            }
        ]
    )
    return query
}

module.exports = { tax_public_summary }