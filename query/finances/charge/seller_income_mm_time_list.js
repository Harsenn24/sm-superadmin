const { ObjectID } = require("bson")
const { queryPagination } = require("../../../helper/pagination")
const { search_something } = require("../../../helper/search_regex")

function seller_income_mm_time_list(idDecrypt, page, item_limit, search_user, month_year, rt_link) {
    let query = queryPagination(
        [
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
                '$lookup': {
                    'from': 'users',
                    'as': 'user_data',
                    'localField': '_u',
                    'foreignField': '_id',
                    'pipeline': [
                        {
                            '$project': {
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
                    ]
                }
            },
            {
                '$addFields': {
                    'full_name': { '$ifNull': [{ '$first': '$user_data.full_name' }, '-'] },
                }
            },
            {
                $sort: { '_id': -1 }
            },
            {
                $match: search_something('full_name', search_user)
            }
        ],
        [
            {
                '$project': {
                    'full_name': '$full_name',
                    'user_avatar': { '$ifNull': [{ '$first': '$user_data.user_avatar' }, '-'] },
                    'price': '$prc',
                    'package_type': '$typ',
                    'must_be_paid': '$mon.clm',
                    '_id': {
                        '$function': {
                            'body': encrypt,
                            'args': [{ '$toString': '$_id' }, 12],
                            'lang': 'js'
                        }
                    },
                    'invoice': '$inv'
                }
            }
        ], page, 3, item_limit
    )

    return query
}

module.exports = { seller_income_mm_time_list }