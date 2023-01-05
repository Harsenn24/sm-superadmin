function penalty_trx_detail(id_store, id_payment, rt_link) {
    let query = [
        {
            '$match': {
                '$and': [
                    { '_id': ObjectID(id_payment) },
                    { '_s': ObjectID(id_store) }

                ]
            }
        },

        {
            '$lookup': {
                'from': 'users',
                'as': 'user',
                'localField': '_u',
                'foreignField': '_id',
                'pipeline': [
                    {
                        '$addFields': {
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
                            'avatar': { '$concat': [`${rt_link}profile/self/avatar/`, '$dat.usr'] },
                        }
                    }
                ]
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
                        '$sort': { '_id': -1 }
                    },
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
                'order_date': {
                    '$dateToString': {
                        'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                        'format': '%Y-%m-%d',
                        'onNull': '2020-01-01'
                    }
                },
                'order_time': {
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
                '_id': 0,
                'description': { '$ifNull': ['$isc.des', '-'] },
                'reason': '$isc.rsn',
                'full_name': { '$ifNull': [{ '$first': '$user.full_name' }, '-'] },
                'user_avatar': { '$ifNull': [{ '$first': '$user.avatar' }, '-'] },
                'payment_date': { '$concat': ['$order_date', ' ', '$order_time'] },
                'payment_method': { '$ifNull': [{ '$first': '$bl.methods' }, '-'] },
                'buyer_note': { '$ifNull': ['$shp.des.not', '-'] },
                'payment_information': {
                    'address': { '$concat': ['$shp.org.nme', '$shp.org.des', '$shp.org.cn', '$shp.org.sn', '$shp.org.zip'] },
                    'delivery_service': '$shp.chn',
                    'delivery_id': { '$ifNull': ['$shp.rsi', '-'] },
                },
                'product': {
                    '$map': {
                        'input': '$dat',
                        'in': {
                            'name': '$$this.pn',
                            'variant': '$$this.vn',
                            'weight': { '$concat': [{ '$toString': { '$multiply': ['$$this.dim.wh', 1000] } }, 'gr'] },
                            'price': '$$this.prc',
                            'quantity': '$$this.qty',
                            'sub_total': { '$multiply': ['$$this.prc', '$$this.qty'] },
                            'image': {
                                '$concat': [`${rt_link}store/ip/`, {
                                    '$function': {
                                        'body': encrypt,
                                        'args': [{ '$toString': '$$this._p' }, 12],
                                        'lang': 'js'
                                    }
                                }, '/0']
                            },
                        }
                    }
                },
                'invoice': '$inv',
                'fund_status': {
                    '$map': {
                        'input': '$pym.hst',
                        'in': {
                            'title': '$$this.tle',
                            'status': '$$this.sts',
                            'time': {
                                '$concat': [
                                    {
                                        '$dateToString': {
                                            'date': { '$toDate': { '$multiply': ['$$this.ep', 1000] } },
                                            'format': '%Y-%m-%d',
                                            'onNull': '2020-01-01'
                                        }
                                    }, ' ',
                                    {
                                        '$dateToString': {
                                            'date': { '$toDate': { '$multiply': ['$$this.ep', 1000] } },
                                            'format': '%H:%M',
                                            'onNull': '2020-01-01'
                                        }
                                    },

                                ]
                            }

                        }
                    }
                }

            }
        },
    ]

    return query
}

module.exports = { penalty_trx_detail }