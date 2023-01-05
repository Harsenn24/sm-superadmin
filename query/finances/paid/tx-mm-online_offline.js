const { encrypt } = require("../../../helper/enkrip_id")
const { queryPagination } = require("../../../helper/pagination")
const { search_something } = require("../../../helper/search_regex")

function tax_magicmirror_online_offline(page, item_limit, search_store, rt_link, source) {
    let foreign_field = 0

    for (let i = 0; i < source.length; i++) {
        if(source[i] === 'member-offline' || source[i] === 'member-onsite') { 
            foreign_field = '_s'
        } else {
            foreign_field = 'cld._s'
        }
        
    }

    let query = queryPagination(
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
                                    { 'src': { '$in': source } },
                                    { 'pym.sts': 'settlement' }
                                ]
                            }
                        },
                        {
                            '$addFields': {
                                'total_ppn': '$mon.ppn',
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
                    'total_ppn': { '$ifNull': [{ '$sum': '$data_subs.total_ppn' }, { '$toInt': '0' }] },
                    'total_income': { '$ifNull': [{ '$sum': '$data_subs.total_income' }, { '$toInt': '0' }] },
                }
            },
            {
                '$match': search_something('store_name', search_store)
            },
            {
                '$sort': { 'total_income': -1 }
            }
        ],
        [
            {
                '$project': {
                    'store_name': '$store_name',
                    'store_image': '$store_image',
                    'total_ppn': '$total_ppn',
                    'total_income': '$total_income',
                    'store_id': '$store_id',
                    '_id': 0,
                }
            },
        ], page, 3, item_limit
    )

    return query
}

module.exports = { tax_magicmirror_online_offline }