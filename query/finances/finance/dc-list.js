const { ObjectID } = require("bson")
const { encrypt } = require("../../../helper/enkrip_id")
const { queryPagination } = require("../../../helper/pagination")
const { search_something } = require("../../../helper/search_regex")

function doctor_list(idDecrypt, page, item_limit, search_doctor, time, rt_link) {
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
                        { '_s': ObjectID(idDecrypt) },
                        { 'date': time },
                        { 'pym.sts': 'settlement' },
                    ]
                }
            },
            {
                '$lookup': {
                    'from': 'doctors',
                    'as': 'dc',
                    'foreignField': '_id',
                    'localField': '_d',
                    'pipeline': [
                        {
                            '$addFields': {
                                'doctor_id': {
                                    '$function': {
                                        'body': encrypt,
                                        'args': [{ '$toString': '$_id' }, 12],
                                        'lang': 'js'
                                    }
                                },

                            }
                        },
                        {
                            '$project': {
                                'doctor_name': {
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
                                'doctor_image': { '$concat': [`${rt_link}doctor/chat/embed/avatar/`, { '$toString': '$doctor_id' }] },
                                '_id': '$doctor_id',
                            }
                        },

                    ]
                }
            },
            {
                '$unwind': {
                    'path': '$dc'
                }
            },
            {
                '$addFields': {
                    'doctor_name': '$dc.doctor_name',
                    'doctor_image': '$dc.doctor_image',
                    'doctor_id': '$dc._id'
                }
            },
            {
                '$group': {
                    '_id': '$doctor_id',
                    'doctor_name': { '$first': '$doctor_name' },
                    'doctor_image': { '$first': '$doctor_image' },
                    'selling_accu': { '$sum': '$mon.tot' },
                    'income_accu': { '$sum': '$mon.fen' },
                }
            },
            {
                '$match': search_something('doctor_name', search_doctor)
            },
        ],
        [
            {
                '$project': {
                    'doctor_name': '$doctor_name',
                    'doctor_image': '$doctor_image',
                    'selling_accu': '$selling_accu',
                    'income_accu': '$income_accu'
                }
            }
        ], page, 3, item_limit
    )

    return query
}

module.exports = { doctor_list }