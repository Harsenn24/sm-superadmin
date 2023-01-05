
function getDataMagicMirror(type) {
    return ([
        {
            '$match': {
                '$and': [
                    { 'type': 'subscribe' },
                    { 'subtype': 'prices' },
                ]
            }
        },
        {
            '$addFields': {
                'result': {
                    '$map': {
                        'input': '$data',
                        'in': {
                            '$cond': {
                                'if': { '$eq': ['$$this.type', type] },
                                'then': {
                                    'price': '$$this.price',
                                    'promo': {
                                        'promo_status': '$$this.promo.active',
                                        'promo_price': '$$this.promo.price',
                                        'promo_start': {
                                            '$dateToString': {
                                                'date': { '$toDate': { '$multiply': ['$$this.promo.start', 1000] } },
                                                'format': '%Y-%m-%d',
                                                'onNull': null
                                            }
                                        },
                                        'promo_end': {
                                            '$dateToString': {
                                                'date': { '$toDate': { '$multiply': ['$$this.promo.end', 1000] } },
                                                'format': '%Y-%m-%d',
                                                'onNull': null
                                            }
                                        },

                                    }

                                },
                                'else': {
                                    'price': 0

                                }
                            }
                        }
                    }
                }
            }
        },
        {
            '$project': {
                'result': '$result',
                '_id': 0
            }
        }
    ])
}


module.exports = { getDataMagicMirror }