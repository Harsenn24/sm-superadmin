const { ObjectID } = require("bson")
const { encrypt } = require("../../../helper/enkrip_id")
const { queryPagination } = require("../../../helper/pagination")
const { search_something } = require("../../../helper/search_regex")
const rt_link = process.env.rt_link


function user_list_mm(type, idDecrypt, search_user, page, item_limit, time) {

    let store_field = 0

    for (let i = 0; i < type.length; i++) {
        if (type[i] === 'member-onsite' || type[i] === 'member-offline') {
            store_field = { '_s': ObjectID(idDecrypt) }
        } else if (type[i] === 'apps') {
            store_field = {}
        } else {
            store_field = { 'cld._s': ObjectID(idDecrypt) }
        }

    }
    const query = queryPagination(
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
                                'user_avatar': { '$concat': [`${rt_link}profile/self/avatar/`, '$dat.usr'] },
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
                '$sort': { 'date_bought': -1 }
            },
            {
                '$match': search_something('fullName', search_user)
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
                    },
                }
            }
        ], page, 3, item_limit
    )

    return query
}

module.exports = user_list_mm