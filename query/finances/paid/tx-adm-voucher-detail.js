const { ObjectID } = require("bson");
let id_doc = 0
const { rt_link } = process.env

function detail_payment(store_id, payment_id_decrypt, payment_id_encrypt, doctor_id, type, total_order) {

    if (doctor_id === null) {
        id_doc = {}
    } else {
        id_doc = { '_d': ObjectID(doctor_id) }
    }

    return ([
        {
            '$match': {
                '$and': [
                    { '_s': ObjectID(store_id) },
                    { '_id': ObjectID(payment_id_decrypt) },
                    { 'pym.sts': 'settlement' },
                ]
            }
        },
        {
            '$match': id_doc
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
            '$lookup': {
                'from': 'cfg_payment_list',
                'localField': 'pym.chn',
                'foreignField': 'code',
                'as': 'bl',
                'pipeline': [
                    {
                        '$addFields': {
                            'methods': {
                                '$concat': ['$bank', " ", '$title']
                            }
                        }
                    }
                ]
            }
        },
        {
            '$addFields': {
                'date_bought': {
                    '$dateToString': {
                        'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                        'format': '%Y-%m-%d',
                        'onNull': '2020-01-01'
                    }
                },
                'time_bought': {
                    '$dateToString': {
                        'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                        'format': '%H:%M',
                        'onNull': '2020-01-01'
                    }
                },
            }
        },
        {
            '$project': {
                'fullName': { '$ifNull': [{ '$first': '$data_user.fullName' }, '-'] },
                'user_avatar': { '$ifNull': [{ '$first': '$data_user.user_avatar' }, '-'] },
                'id_user': { '$toString': '$_u' },
                'invoice': '$inv',
                'payment': {
                    'id_order': payment_id_encrypt,
                    'payment_method': { '$ifNull': [{ '$first': '$bl.methods' }, '-'] },
                    'date_bought': { '$concat': ['$date_bought', ' ', '$time_bought'] },
                    'type': type
                },
                'tax': {
                    'total_order': total_order,
                    'total_tax': { '$add': ['$mon.ppn', '$mon.pph'] },
                    'ppn': '$mon.ppn',
                    'pph': '$mon.pph'
                },
                '_id': 0
            }
        }
    ])
}


module.exports = { detail_payment }