const switch_status_return = {
    '$switch': {
        'branches': [
            {
                'case':
                    { '$eq': ['$shp.sts', 'return-request'] },
                'then': 'unprocessed'
            },
            {
                'case':
                    { '$eq': ['$shp.sts', 'return-pending'] },
                'then': 'investigated'
            },
            {
                'case':
                    { '$eq': ['$shp.sts', 'returning'] },
                'then': 'finish'
            },
            {
                'case':
                    { '$eq': ['$shp.sts', 'returned'] },
                'then': 'finish'
            }
        ],
        'default': 'unknown'
    }
}

module.exports = switch_status_return