function query_edit(price, promo_status_data, promo_price_data, date_start_data, date_end_data, type) {
    const query = {
        '$set': {
            'data': {
                '$map': {
                    'input': '$data',
                    'in': {
                        '$cond': {
                            'if': { '$eq': ['$$this.type', type] },
                            'then': {
                                '$mergeObjects': [
                                    '$$this',
                                    {
                                        'price': price,
                                        'promo': {
                                            'active': promo_status_data,
                                            'price': promo_price_data,
                                            'start': date_start_data,
                                            'end': date_end_data
                                        },
                                    }
                                ]
                            },
                            'else': '$$this'
                        }
                    }
                }
            }
        }
    }

    return query
}


module.exports = { query_edit }