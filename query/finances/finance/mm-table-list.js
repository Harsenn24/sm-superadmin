const { encrypt } = require("../../../helper/enkrip_id")
const { queryPagination } = require("../../../helper/pagination")
const { search_something } = require("../../../helper/search_regex")


function table_list(search_store, type, rt_link, page, item_limit) {

    let foreign_field = 0

    for (let i = 0; i < type.length; i++) {
        if(type[i] === 'member-onsite' || type[i] === 'member-offline'){
            foreign_field = '_s'
        } else {
            foreign_field = 'cld._s'
        }
        
    }
    const query = queryPagination(
        [

            {
                '$lookup': {
                    'from': 'sys_subscribe',
                    'foreignField': foreign_field,
                    'localField': '_id',
                    'pipeline': [
                        {
                            '$match': {
                                '$and': [
                                    { 'src': { '$in': type } },
                                    { 'pym.sts': 'settlement' }
                                ]
                            }
                        },
                        {
                            '$addFields': {
                                'total_amount': '$prc',
                                'total_income': '$prn',
                            }
                        }
                    ],
                    'as': 'data_subs'
                }
            },
            {
                '$addFields': {
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
                    'store_image': {
                        '$concat': [`${rt_link}store/i/`, {
                            '$toString': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            },
                        }]
                    },
                    'store_id': {
                        '$function': {
                            'body': encrypt,
                            'args': [{ '$toString': '$_id' }, 12],
                            'lang': 'js'
                        }
                    },
                }
            },
            {
                '$addFields': {
                    'total_amount': { '$ifNull': [{ '$sum': '$data_subs.total_amount' }, { '$toInt': '0' }] },
                    'total_income': { '$ifNull': [{ '$sum': '$data_subs.total_income' }, { '$toInt': '0' }] },
                }
            },
            {
                '$sort': { 'total_income': -1 }
            },
            {
                '$match': {
                    '$and': [
                        search_something('store_name', search_store),
                        { 'total_amount': { $gte: 1 } },
                        { 'total_income': { $gte: 1 } },
                    ]
                }
            }
        ],
        [
            {
                '$project': {
                    'store_name': '$store_name',
                    'store_image': '$store_image',
                    'total_amount': '$total_amount',
                    'total_income': '$total_income',
                    'store_id': '$store_id',
                    '_id': 0
                }
            }
        ], page, 3, item_limit
    )

    return query
}

module.exports = table_list