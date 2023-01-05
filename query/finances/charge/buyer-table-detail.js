const { ObjectID } = require("bson")

function buyer_table_detail(idDecrypt, rt_link) {
    let query = [
        {
            '$match': { '_id': ObjectID(idDecrypt) }
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
                'date_sent': {
                    '$dateToString': {
                        'date': { '$toDate': { '$multiply': ['$shp.tme.shp', 1000] } },
                        'format': '%Y-%m-%d',
                        'onNull': '2020-01-01'
                    }
                },
                'time_sent': {
                    '$dateToString': {
                        'date': { '$toDate': { '$multiply': ['$shp.tme.shp', 1000] } },
                        'format': '%H:%M',
                        'onNull': '2020-01-01'
                    }
                }
            }
        },
        {
            '$project': {
                '_id': 0,
                'full_name': { '$ifNull': [{ '$first': '$data_user.full_name' }, '-'] },
                'profil_pict': { '$ifNull': [{ '$first': '$data_user.profil_pict' }, '-'] },
                'invoice': '$inv',
                'shipping_time': { '$concat': ['$date_sent', ' ', '$time_sent'] },
                'shipping_service': '$shp.chn',
                'product_weight': { '$concat': [{ '$toString': { '$sum': '$dat.dim.wh' } }, ' Gr'] },
                'shipping_cost': '$shp.det.bmm',
                'insurance_fee': '$shp.det.inf',
                'voucher': '-',
                'total': '$mon.shp',
                'address': {
                    'origin': { '$concat': ['$shp.org.nme', ', ', '$shp.org.des', ', ', '$shp.org.zip'] },
                    'destination': { '$concat': ['$shp.des.nme', ', ', '$shp.des.des', ', ', '$shp.des.zip'] },

                }
            }
        },
    ]

    return query
}

module.exports = { buyer_table_detail }