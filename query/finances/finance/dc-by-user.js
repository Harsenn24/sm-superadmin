const { ObjectID } = require("bson")
const { mon_fee } = require("../../../helper/count")
const { queryPagination } = require("../../../helper/pagination")
const { search_something } = require("../../../helper/search_regex")

function list_doctor_by_user(idDecryptStore, idDecryptDoctor, page, item_limit, time, search_user, rt_link) {
    const query = queryPagination(
        [
            {
                '$addFields': {
                    'date_id': { '$toDecimal': { '$toDate': '$_id' } }
                }
            },
            {
                '$addFields': {
                    'date_id': { '$round': [{ '$divide': ['$date_id', 1000] }, 4] },
                }
            },
            {
                '$addFields': {
                    'date': {
                        '$dateToString': {
                            'date': { '$toDate': { '$multiply': ['$date_id', 1000] } },
                            'format': '%m-%Y',
                            'onNull': '2020-01-01'
                        }
                    }
                }
            },
            {
                '$match': {
                    '$and': [
                        { '_d': ObjectID(idDecryptDoctor) },
                        { '_s': ObjectID(idDecryptStore) },
                        { 'date': time },
                        { 'pym.sts': 'settlement' }
                    ]
                }
            },
            {
                '$lookup': {
                    'from': 'users',
                    'as': 'us',
                    'foreignField': '_id',
                    'localField': '_u',
                    'pipeline': [
                        {
                            '$addFields': {
                                'username': '$dat.usr',
                            }
                        },
                        {
                            '$project': {
                                'fullname': {
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
                                'user_avatar': { '$concat': [`${rt_link}profile/self/avatar/`, '$username'] },
                                '_id': 0
                            }
                        },

                    ]
                }
            },
            {
                '$lookup': {
                    'from': 'cfg_payment_list',
                    'foreignField': 'code',
                    'localField': 'pym.chn',
                    'as': 'mt',
                    'pipeline': [
                        {
                            '$project': {
                                'methods': { '$concat': ['$title', ' ', '$bank'] }
                            }
                        }
                    ]
                }
            },
            {
                '$unwind': {
                    'path': '$us'
                }
            },
            {
                '$addFields': {
                    'fullname': '$us.fullname',
                    'user_avatar': '$us.user_avatar',
                    'payment_method': { '$ifNull': [{ '$first': '$mt.methods' }, '-'] },

                }
            },
            {
                '$match': search_something('fullname', search_user)
            },
        ],
        [
            {
                '$project': {
                    'fullname': '$fullname',
                    'user_avatar': '$user_avatar',
                    'consult_price': '$mon.amm', // consult_price
                    'payment_fee': '$mon.pym', // payment_fee
                    'total_sale': '$mon.tot', // total pembayaran
                    '_id': 0,
                    'total_income': '$mon.fen',
                    'admin_fee': mon_fee(),
                    'pph': '$mon.pph',
                    'ppn': '$mon.ppn',
                    'payment_method': '$payment_method',
                }
            }
        ], page, 3, item_limit
    )

    return query
}

module.exports = { list_doctor_by_user }