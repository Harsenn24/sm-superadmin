const { mon_fee } = require("../../../helper/count")
const { encrypt } = require("../../../helper/enkrip_id")
const { ObjectID } = require("bson")

function tax_com_by_docs(storeDecrypt, doctorDecrypt, rt_link) {
    let query = [
        {
            '$match': {
                '$and': [
                    { '_s': ObjectID(storeDecrypt) },
                    { '_d': ObjectID(doctorDecrypt) },
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
                '_id': {
                    'a': storeDecrypt,
                    'b': doctorDecrypt
                },
                'ppn': { '$sum': '$mon.ppn' },
                'pph': { '$sum': '$mon.pph' },
                'fee': { '$sum': mon_fee() },
                'doctor_name': { '$first': '$doctor_name' },
                'doctor_image': { '$first': '$doctor_image' },
            }
        },
        {
            '$project': {
                'ppn': '$ppn',
                'pph': '$pph',
                'fee': '$fee',
                'doctor_name': '$doctor_name',
                'doctor_image': '$doctor_image',
                '_id': 0
            }
        }
    ]

    return query
}

module.exports = { tax_com_by_docs }