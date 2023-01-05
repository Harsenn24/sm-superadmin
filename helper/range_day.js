function range_day_aggregate(data_now, data_double) {

    let result = {
        '$concat': [
            {
                '$toString': {
                    '$dateDiff': {
                        'startDate': {
                            '$toDate': {
                                '$multiply': [data_now, 1000]
                            }
                        },
                        'endDate': {
                            '$toDate': {
                                '$multiply': [data_double, 1000]
                            }
                        },
                        'unit': 'day'
                    }
                }
            },
            ' days'
        ]
    }
    return result
}



module.exports = {
    range_day_aggregate
}