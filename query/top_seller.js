
function top_store(encrypt, rt_link) {
    return ([
        {
            '$lookup': {
                'from': 'sys_payment',
                'foreignField': '_s',
                'localField': '_id',
                'as': 'pym',
                'pipeline': [
                    { '$count': 'total' }
                ]
            }
        },
        {
            '$addFields': {
                'pqty': { '$ifNull': [{ '$first': '$pym.total' }, { '$toInt': '0' }] },
            }
        },
        {
            '$addFields': {
                'store_id': {
                    '$function': {
                        'body': encrypt,
                        'args': [{ '$toString': '$_id' }, 12],
                        'lang': 'js'
                    }
                }
            }
        },
        {
            '$project': {

                'store_image': { '$concat': [`${rt_link}store/i/`, { '$toString': '$store_id' }] },
                'seller': '$det.nms',
                'Transaksi': '$pqty',
                '_id': 0
            }
        },
        {
            '$sort': { 'Transaksi': -1 }
        }
    ])
}


module.exports = { top_store }