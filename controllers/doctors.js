const { encrypt } = require("../helper/enkrip_id");
const { jsonData } = require("../middleware/sucess")
const { Store, Doctor, Doctor_chat } = require("../model")
const { rt_link } = process.env
const { ObjectID } = require("bson")
const { date2number } = require("../helper/date2number")



class DoctorController {
    static async prod_personal(req, res) {
        try {
            const prod_personal = await Store.aggregate([
                {
                    '$sort': { '_id': -1 }
                },
                {
                    '$addFields': {
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
                    '$project': {
                        '_id': 0,
                        'store_id': '$store_id',
                        'store_name': '$det.nms',
                        'store_image': { '$concat': [`${rt_link}store/i/`, { '$toString': '$store_id' }] }
                    }
                }
            ])

            res.status(200).json(prod_personal)
        } catch (error) {
            console.log(error);
        }
    }

    static async consul_inside_store(req, res) {
        try {
            const { id } = req.params
            const consul_inside_store = await Store.aggregate([
                {
                    '$sort': { '_id': -1 }
                },
                {
                    '$match': { '_id': ObjectID(id) }
                },
                {
                    '$lookup': {
                        'from': 'doctors',
                        'localField': '_id',
                        'foreignField': '_s',
                        'as': 'st',
                        'pipeline': [
                            {
                                '$sort': { '_id': -1 }
                            },
                            {
                                '$lookup': {
                                    'from': 'doctors_chats',
                                    'localField': '_id',
                                    'foreignField': '_d',
                                    'as': 'dc',
                                    'pipeline': [
                                        {
                                            '$sort': { '_id': -1 }
                                        },
                                        {
                                            '$match': {
                                                'end': true
                                            }
                                        },
                                        {
                                            '$facet': {
                                                'consul': [
                                                    {
                                                        '$count': 'total'
                                                    }
                                                ],
                                                'score': [
                                                    {
                                                        '$count': 'totalData'
                                                    },
                                                    {
                                                        '$addFields': {
                                                            'totalScore': { '$sum': { '$ifNull': ['$scr', { '$toInt': '0' }] } }
                                                        }
                                                    },
                                                ]
                                            }
                                        },
                                        {
                                            '$addFields': {
                                                'totalConsul': { '$ifNull': [{ '$first': '$consul.total' }, { '$toInt': '0' }] },
                                                'totalData': { '$ifNull': [{ '$first': '$score.totalData' }, { '$toInt': '0' }] },
                                                'totalScore': { '$ifNull': [{ '$first': '$score.totalScore' }, { '$toInt': '0' }] },
                                            }
                                        },
                                        {
                                            '$addFields': {
                                                'rating': {
                                                    '$divide': ['$totalScore', {
                                                        '$cond': {
                                                            'if': { '$lte': ['$totalData', 0] },
                                                            'then': 1,
                                                            'else': '$totalData'
                                                        }
                                                    }]
                                                }
                                            }
                                        },
                                    ]
                                }
                            },
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
                                    '_id': 0,
                                    'doctor_rating': { '$ifNull': [{ '$first': '$dc.rating' }, { '$toInt': '0' }] },
                                    'doctor_consultation': { '$ifNull': [{ '$first': '$dc.totalConsul' }, { '$toInt': '0' }] },
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
                                    'doctor_speciality': '$doc.fld',
                                    'has_promo': { '$ifNull': ['$dyn.hsp', "-"] },
                                    'doctor_price': { '$ifNull': ['$dyn.prc', "-"] },
                                }
                            }
                        ]
                    }
                },
                {
                    '$project': {
                        '_id': 0,
                        'data': '$st'
                    }
                }
            ])
            res.send(consul_inside_store)
        } catch (error) {
            console.log(error);
        }
    }

    static async doctor_detail(req, res) {
        try {
            const { id } = req.params
            const doctor_detail = await Doctor.aggregate([
                {
                    '$sort': { '_id': -1 }
                },
                {
                    '$match': { '_id': ObjectID(id) }
                },
                {
                    '$lookup': {
                        'from': 'stores',
                        'localField': '_s',
                        'foreignField': '_id',
                        'as': 'st',
                        'pipeline': [
                            {
                                '$sort': { '_id': -1 }
                            },
                            {
                                '$project': {
                                    'clinicName': '$det.nms'
                                }
                            }
                        ]
                    }
                },
                {
                    '$lookup': {
                        'from': 'doctors_chats',
                        'localField': '_id',
                        'foreignField': '_d',
                        'as': 'dc',
                        'pipeline': [
                            {
                                '$sort': { '_id': -1 }
                            },
                            {
                                '$match': {
                                    'end': true
                                }
                            },
                            {
                                '$facet': {
                                    'consul': [
                                        {
                                            '$count': 'total'
                                        }
                                    ],
                                    'score': [
                                        {
                                            '$count': 'totalData'
                                        },
                                        {
                                            '$addFields': {
                                                'totalScore': { '$sum': { '$ifNull': ['$scr', { '$toInt': '0' }] } }
                                            }
                                        },
                                    ]
                                }
                            },
                            {
                                '$addFields': {
                                    'totalConsul': { '$ifNull': [{ '$first': '$consul.total' }, { '$toInt': '0' }] },
                                    'totalData': { '$ifNull': [{ '$first': '$score.totalData' }, { '$toInt': '0' }] },
                                    'totalScore': { '$ifNull': [{ '$first': '$score.totalScore' }, { '$toInt': '0' }] },
                                }
                            },
                            {
                                '$addFields': {
                                    'rating': {
                                        '$divide': ['$totalScore', {
                                            '$cond': {
                                                'if': { '$lte': ['$totalData', 0] },
                                                'then': 1,
                                                'else': '$totalData'
                                            }
                                        }]
                                    }
                                }
                            },
                        ]
                    }
                },
                {
                    '$addFields': {
                        'clinicName': { '$ifNull': [{ '$first': '$st.clinicName' }, { '$toInt': '0' }] },
                        'doctor_rating': { '$ifNull': [{ '$first': '$dc.rating' }, { '$toInt': '0' }] },
                        'doctor_speciality': { '$ifNull': [{ '$first': '$dc.totalConsul' }, { '$toInt': '0' }] },
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
                        '_id': 0,
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
                        'doctor_speciality': '$doctor_speciality',
                        'doctor_practic': '$clinicName',
                        'doctor_rating': '$doctor_rating',
                        'doctor_image': { '$concat': [`${rt_link}doctor/chat/embed/avatar/`, { '$toString': '$doctor_id' }] },
                        'doctor_price': { '$ifNull': ['$dyn.prc', "-"] },
                        'certification': {
                            'str_number': '$doc.str.num'
                        }
                    }
                }
            ])
            res.send(doctor_detail)
        } catch (error) {
            console.log(error);
        }
    }

    static async doctorProfile_wc(req, res) {
        try {
            const { id } = req.params
            const doctorProfile_wc = await Doctor_chat.aggregate([
                {
                    '$sort': { '_id': -1 }
                },
                {
                    '$match': { '_id': ObjectID(id) }
                },
                {
                    '$lookup': {
                        'from': 'doctors',
                        'localField': '_d',
                        'foreignField': '_id',
                        'as': 'dc',
                        'pipeline': [
                            {
                                '$sort': { '_id': -1 }
                            },
                            {
                                '$lookup': {
                                    'from': 'stores',
                                    'localField': '_s',
                                    'foreignField': '_id',
                                    'as': 'dc',
                                    'pipeline': [
                                        {
                                            '$sort': { '_id': -1 }
                                        },
                                        {
                                            '$project': {
                                                '_id': 0,
                                                'storeName': '$det.nms'
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                '$addFields': {
                                    'storeName': { '$ifNull': [{ '$first': '$dc.storeName' }, '-'] },

                                }
                            },
                            {
                                '$lookup': {
                                    'from': 'doctors_chats',
                                    'localField': '_id',
                                    'foreignField': '_d',
                                    'as': 'dc',
                                    'pipeline': [
                                        {
                                            '$sort': { '_id': -1 }
                                        },
                                        {
                                            '$match': {
                                                'end': true
                                            }
                                        },
                                        {
                                            '$facet': {
                                                'consul': [
                                                    {
                                                        '$count': 'total'
                                                    }
                                                ],
                                                'score': [
                                                    {
                                                        '$count': 'totalData'
                                                    },
                                                    {
                                                        '$addFields': {
                                                            'totalScore': { '$sum': { '$ifNull': ['$scr', { '$toInt': '0' }] } }
                                                        }
                                                    },
                                                ]
                                            }
                                        },
                                        {
                                            '$addFields': {
                                                'totalConsul': { '$ifNull': [{ '$first': '$consul.total' }, { '$toInt': '0' }] },
                                                'totalData': { '$ifNull': [{ '$first': '$score.totalData' }, { '$toInt': '0' }] },
                                                'totalScore': { '$ifNull': [{ '$first': '$score.totalScore' }, { '$toInt': '0' }] },
                                            }
                                        },
                                        {
                                            '$addFields': {
                                                'rating': {
                                                    '$divide': ['$totalScore', {
                                                        '$cond': {
                                                            'if': { '$lte': ['$totalData', 0] },
                                                            'then': 1,
                                                            'else': '$totalData'
                                                        }
                                                    }]
                                                }
                                            }
                                        },
                                    ]
                                }
                            },
                            {
                                '$addFields': {
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
                                    'doctor_speciality': '$doc.fld',
                                    'doctor_rating': { '$ifNull': [{ '$first': '$dc.rating' }, { '$toInt': '0' }] },
                                    'doctor_consultation': { '$ifNull': [{ '$first': '$dc.totalConsul' }, { '$toInt': '0' }] },
                                    'certification': {
                                        'gender': {
                                            '$cond': {
                                                'if': { '$eq': ['$dat.sex', 'M'] },
                                                'then': 'Male',
                                                'else': {
                                                    '$cond': {
                                                        'if': { '$eq': ['$dat.sex', 'F'] },
                                                        'then': 'Female',
                                                        'else': '-'
                                                    }
                                                }
                                            }
                                        },
                                        'str_number': '$doc.str.num',
                                        'sip_number': '$doc.sip.num',
                                    }
                                }
                            }
                        ]
                    }
                },
                {
                    '$lookup': {
                        'from': 'sys_chats_consult',
                        'localField': '_id',
                        'foreignField': '_cd',
                        'as': 'scc',
                        'pipeline': [
                            {
                                '$sort': { '_id': -1 }
                            },
                            {
                                '$match': {
                                    'fle.typ': {
                                        '$in': ['document', 'image']
                                    }
                                }
                            },
                            {
                                '$count': 'total'
                            }
                        ]
                    }
                },
                {
                    '$addFields': {
                        'media': { '$ifNull': [{ '$first': '$scc.total' }, { '$toInt': '0' }] }
                    }
                },
                {
                    '$project': {
                        '_id': 0,
                        'doctor_practic': { '$ifNull': [{ '$first': '$dc.storeName' }, '-'] },
                        'doctor_name': { '$ifNull': [{ '$first': '$dc.doctor_name' }, '-'] },
                        'doctor_speciality': { '$ifNull': [{ '$first': '$dc.doctor_speciality' }, '-'] },
                        'doctor_rating': { '$ifNull': [{ '$first': '$dc.doctor_rating' }, '-'] },
                        'doctor_consultation': { '$ifNull': [{ '$first': '$dc.doctor_consultation' }, '-'] },
                        'certification': { '$ifNull': [{ '$first': '$dc.certification' }, '-'] },
                        'info': {
                            'media': '$media'
                        }
                    }
                }
            ])
            res.send(doctorProfile_wc)
        } catch (error) {
            console.log(error);
        }
    }

    static async doctor_so(req, res) {
        try {
            const doctor_so = await Doctor.aggregate([
                {
                    '$sort': { '_id': -1 }
                },
                {
                    '$lookup': {
                        'from': 'doctors_chats',
                        'localField': '_id',
                        'foreignField': '_d',
                        'as': 'dc',
                        'pipeline': [
                            {
                                '$sort': { '_id': -1 }
                            },
                            {
                                '$match': {
                                    'end': true
                                }
                            },
                            {
                                '$facet': {
                                    'consul': [
                                        {
                                            '$count': 'total'
                                        }
                                    ],
                                    'score': [
                                        {
                                            '$count': 'totalData'
                                        },
                                        {
                                            '$addFields': {
                                                'totalScore': { '$sum': { '$ifNull': ['$scr', { '$toInt': '0' }] } }
                                            }
                                        },
                                    ]
                                }
                            },
                            {
                                '$addFields': {
                                    'totalConsul': { '$ifNull': [{ '$first': '$consul.total' }, { '$toInt': '0' }] },
                                    'totalData': { '$ifNull': [{ '$first': '$score.totalData' }, { '$toInt': '0' }] },
                                    'totalScore': { '$ifNull': [{ '$first': '$score.totalScore' }, { '$toInt': '0' }] },
                                }
                            },
                            {
                                '$addFields': {
                                    'rating': {
                                        '$divide': ['$totalScore', {
                                            '$cond': {
                                                'if': { '$lte': ['$totalData', 0] },
                                                'then': 1,
                                                'else': '$totalData'
                                            }
                                        }]
                                    }
                                }
                            },
                        ]
                    }
                },
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
                    '$addFields': {
                        "doctor_name": {
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
                        'doctor_price': { '$ifNull': ['$dyn.prc', "-"] },
                        'doctor_rating': { '$ifNull': [{ '$first': '$dc.rating' }, { '$toInt': '0' }] },
                        'doctor_consultation': { '$ifNull': [{ '$first': '$dc.totalConsul' }, { '$toInt': '0' }] },
                    }
                },
                {
                    '$lookup': {
                        'from': 'stores',
                        'localField': '_s',
                        'foreignField': '_id',
                        'as': 'st',
                        'pipeline': [
                            {
                                '$sort': { '_id': -1 }
                            },
                            {
                                '$project': {
                                    'clinicName': '$det.nms',
                                    '_id': '$_id'
                                }
                            }
                        ]
                    }
                },
                {
                    '$addFields': {
                        'store_name': { '$ifNull': [{ '$first': '$st.clinicName' }, '-'] },
                        'store_id': { '$ifNull': [{ '$first': '$st._id' }, '-'] },
                    }
                },
                {
                    '$project': {
                        'doctor_id': '$_id',
                        'doctor_name': '$doctor_name',
                        'doctor_image': '$doctor_image',
                        'doctor_price': '$doctor_price',
                        'doctor_rating': '$doctor_rating',
                        'doctor_consultation': '$doctor_consultation',
                        'store_name': '$store_name',
                        'store_id': '$store_id',
                        '_id': 0
                    }
                }
            ])
            res.send(doctor_so)
        } catch (error) {
            console.log(error);
        }
    }

    static async lastChat(req, res) {
        try {
            const lastChat = await Doctor_chat.aggregate([
                {
                    '$sort': { '_id': -1 }
                },
                {
                    '$match': {
                        '$and': [
                            { 'epe': { '$gte': date2number('') } },
                        ]
                    }
                },
                {
                    '$lookup': {
                        'from': 'doctors',
                        'localField': '_d',
                        'foreignField': '_id',
                        'as': 'dc',
                        'pipeline': [
                            {
                                '$sort': { '_id': -1 }
                            },
                            {
                                '$lookup': {
                                    'from': 'stores',
                                    'localField': '_s',
                                    'foreignField': '_id',
                                    'as': 'st',
                                    'pipeline': [
                                        {
                                            '$sort': { '_id': -1 }
                                        },
                                        {
                                            '$addFields': {
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
                                            '$project' : {
                                                'store_id' : '$store_id',
                                                'store_image': { '$concat': [`${rt_link}store/i/`, { '$toString': '$store_id' }] }
                                            }
                                        }
                                    ]
                                }
                            },
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
                                    'name': {
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
                                    'store_id': { '$ifNull': [{ '$first': '$st.store_id' }, '-'] },
                                    'store_image': { '$ifNull': [{ '$first': '$st.store_image' }, '-'] },
                                }
                            }
                        ]
                    }
                },
                {
                    '$addFields': {
                        'doctor_name': { '$ifNull': [{ '$first': '$dc.name' }, '-'] },
                        'doctor_image': { '$ifNull': [{ '$first': '$dc.doctor_image' }, '-'] },
                        'store_id': { '$ifNull': [{ '$first': '$dc.store_id' }, '-'] },
                        'store_image': { '$ifNull': [{ '$first': '$dc.store_image' }, '-'] },
                    }
                },
                {
                    '$project': {
                        '_id': 0,
                        'cluster_id': '$_id',
                        'doctor_name': '$doctor_name',
                        'doctor_image': '$doctor_image',
                        'consult_start': new Date('$eps'),
                        'store_id': '$store_id',
                        'store_image': '$store_image',
                    }
                }
            ])
            res.status(200).json(jsonData(lastChat))
        } catch (error) {
            console.log(error);
        }
    }
}

module.exports = DoctorController