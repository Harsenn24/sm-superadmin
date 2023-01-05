function filter_map(var_loop, inner_data, outer_data, data) {

    let result = {
        '$first': {
            '$filter': {
                'input': {
                    '$map': {
                        'input': var_loop,
                        'in': {
                            '$cond': {
                                'if': { '$eq': [outer_data, inner_data] },
                                'then': data,
                                'else': []
                            }
                        }
                    }
                },
                'as': 'varr',
                'cond': {
                    '$ne': ['$$varr', []]
                }
            }
        }
    }

    return result

}



module.exports = {
    filter_map
}