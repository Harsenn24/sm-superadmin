const { queryPagination } = require("../../../helper/pagination")
const { search_something } = require("../../../helper/search_regex")


function buyer_table(time_start, time_end, page, item_limit, search_id, rt_link) {
    let query = queryPagination(
        [
            {
                '$match': {
                    '$and': [
                        { 'ep': { '$lte': time_start } },
                        { 'ep': { '$gte': time_end } },
                        { 'pym.sts': 'settlement' },
                        { 'shp.sts': 'settlement' },
                    ]
                }
            },
            {
                '$lookup': {
                    'from': 'users',
                    'as': 'data_user',
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
                                'profil_pict': { '$concat': [`${rt_link}profile/self/avatar/`, '$dat.usr'] },

                            }
                        },
                    ]
                }
            },
            {
                '$addFields': {
                    'full_name': { '$ifNull': [{ '$first': '$data_user.full_name' }, '-'] },
                    'profil_pict': { '$ifNull': [{ '$first': '$data_user.profil_pict' }, '-'] },
                    'id_payment': {
                        '$function': {
                            'body': encrypt,
                            'args': [{ '$toString': '$_id' }, 12],
                            'lang': 'js'
                        }
                    },
                    'ship': '$mon.shp',

                }
            },
            {
                '$match': search_something('id_payment', search_id)
            },
            {
                '$sort': { '_id': -1 }
            }
        ],
        [
            {
                '$project': {
                    'profil_pict': '$profil_pict',
                    'name': '$full_name',
                    'total_shippment': '$ship',
                    '_id': '$id_payment'
                }
            }
        ], page, 3, item_limit
    )

    return query
}

module.exports = { buyer_table }