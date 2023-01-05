const { encrypt } = require("../../../helper/enkrip_id")
const { queryPagination } = require("../../../helper/pagination")
const { search_something } = require("../../../helper/search_regex")

function public_list(search_name, rt_link, page, item_limit) {

    
    const query = queryPagination(
        [
            {
                '$match': {
                    '$and': [
                        { 'src': 'apps' },
                        { 'pym.sts': 'settlement' },

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
                                'fullName': {
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
                    'fullName': { '$ifNull': [{ '$first': '$data_user.fullName' }, '-'] },
                    'user_avatar': { '$ifNull': [{ '$first': '$data_user.user_avatar' }, '-'] },
                    'date_bought': {
                        '$dateToString': {
                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                            'format': '%Y-%m-%d',
                            'onNull': '2020-01-01'
                        }
                    },
                    'start_periode': {
                        '$dateToString': {
                            'date': { '$toDate': { '$multiply': ['$eps', 1000] } },
                            'format': '%Y-%m-%d',
                            'onNull': '2020-01-01'
                        }
                    },
                    'end_periode': {
                        '$dateToString': {
                            'date': { '$toDate': { '$multiply': ['$epe', 1000] } },
                            'format': '%Y-%m-%d',
                            'onNull': '2020-01-01'
                        }
                    },
                }
            },
            {
                '$sort': { '_id': -1 }
            },
            {
                '$match': search_something('fullName', search_name)
            }
        ],
        [
            {
                '$project': {
                    'full_name': '$fullName',
                    'user_avatar': '$user_avatar',
                    'price': '$prc',
                    'date_bought': '$date_bought',
                    'start_periode': '$start_periode',
                    'end_periode': '$end_periode',
                    'type': '$typ',
                    '_id': {
                        '$function': {
                            'body': encrypt,
                            'args': [{ '$toString': '$_id' }, 12],
                            'lang': 'js'
                        }
                    }
                }
            }
        ], page, 3, item_limit
    )

    return query
}

module.exports = public_list