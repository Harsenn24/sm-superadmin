
function top_prod(encrypt, rt_link) {
    return ([
        {
            '$lookup': {
                'from': 'sys_payment',
                'localField': '_s',
                'foreignField': '_s',
                'let': {
                    'store': '$_s',
                    'product': '$_id'
                },
                'pipeline': [
                    {
                        '$unwind': {
                            'path': '$dat'
                        }
                    },
                    {
                        '$match': {
                            '$expr': {
                                '$eq': ['$dat._p', '$$product']
                            }
                        }
                    },
                    {
                        '$group': {
                            '_id': '$dat._p',
                            'pname': { '$first': '$dat.pn' },
                            'pqty': { '$sum': 1 }
                        }
                    },
                    {
                        '$project': {
                            'item_name': '$pname',
                            'item_qty': '$pqty',
                            '_id': 0
                        }
                    },
                    { '$sort': { 'item_qty': -1 } }
                ],
                'as': 'payment',
            }
        },
        {
            '$addFields': {
                'pname': { '$ifNull': [{ '$first': '$payment.item_name' }, 'unknown'] },
                'pqty': { '$ifNull': [{ '$first': '$payment.item_qty' }, { '$toInt': '0' }] },
            }
        },
        {
            '$project': {
                'product_id': {
                    '$function': {
                        'body': encrypt,
                        'args': [{ '$toString': '$_id' }, 12],
                        'lang': 'js'
                    }
                },
                'product_image': {
                    '$concat': [`${rt_link}store/ip/`, {
                        '$function': {
                            'body': encrypt,
                            'args': [{ '$toString': '$_id' }, 12],
                            'lang': 'js'
                        }
                    }, '/0']
                },
                'item_name': '$pname',
                'item_qty': '$pqty',
                '_id': 0
            }
        },
        {
            '$sort' : {'item_qty' : -1}
        }
    ])
}


module.exports = { top_prod }