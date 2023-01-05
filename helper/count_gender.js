function count_gender(data1, data2) {
    const result = {
        '$map': {
            'input': data1,
            'in': {
                '$switch': {
                    'branches': [
                        {
                            'case':
                                { '$eq': ['$$this.gender', data2] },
                            'then': '$$this.count'
                        },
                    ],
                    'default': 0
                }
            }
        }
    }

    return result
}

module.exports = { count_gender }