const { encrypt } = require("../../../helper/enkrip_id")
const { queryPagination } = require("../../../helper/pagination")
const { search_something } = require("../../../helper/search_regex")

function tax_magicmirror_public(rt_link, search_user, page, item_limit, type, time) {
    let query = queryPagination(
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
                        { 'typ': type },
                        { 'month_year': time }
                    ]
                }
            },
            {
                '$lookup': {
                    'from': 'users',
                    'foreignField': '_id',
                    'localField': '_u',
                    'pipeline': [
                        {
                            '$addFields': {
                                'full_name': {
                                    '$reduce': {
                                        'input': '$dat.fln',
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
                                'user_avatar': { '$concat': [`${rt_link}profile/self/avatar/`, '$dat.usr'] }

                            }
                        }
                    ],
                    'as': 'data_user'
                }
            },
            {
                '$addFields': {
                    'full_name': { '$ifNull': [{ '$first': '$data_user.full_name' }, '-'] },
                    'user_avatar': { '$ifNull': [{ '$first': '$data_user.user_avatar' }, '-'] },
                    'id_payment': {
                        '$function': {
                            'body': encrypt,
                            'args': [{ '$toString': '$_id' }, 12],
                            'lang': 'js'
                        }
                    }
                }
            },
            {
                '$match': search_something('full_name', search_user)
            },
            {
                '$sort': { '_id': -1 }
            }
        ],
        [
            {
                '$project': {
                    'id_payment': '$id_payment',
                    'full_name': '$full_name',
                    'user_avatar': '$user_avatar',
                    'type': {
                        '$cond': {
                            'if': { '$eq': ['$typ', 'daily'] },
                            'then': '1 Hari',
                            'else': {
                                '$cond': {
                                    'if': { '$eq': ['$typ', 'monthly'] },
                                    'then': '1 Bulan',
                                    'else': {
                                        '$cond': {
                                            'if': { '$eq': ['$typ', 'yearly'] },
                                            'then': '1 Tahun',
                                            'else': '-'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    'price': '$prc',
                    'ppn': '$mon.ppn',
                    '_id': 0
                }
            },
        ], page, 3, item_limit
    )

    return query
}

module.exports = { tax_magicmirror_public }