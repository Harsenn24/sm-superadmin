function percent_aggregate(data_now, data_double) {

    let result = {
        '$cond': {
            'if': { '$eq': [data_double, { '$toInt': '0' }] },
            'then': { '$toInt': '0' },
            'else': {
                '$round': [{
                    '$multiply': [
                        {
                            '$divide': [
                                { '$subtract': [data_now, data_double] },
                                data_double
                            ]
                        }, 100
                    ]
                }, 2]
            }
        }


    }

    return result

}



module.exports = {
    percent_aggregate
}