const returnAdminStatus = {
    '$switch': {
        'branches': [
            {
                'case':
                    { '$eq': ['$sts', 'request'] },
                'then': 'unprocessed'
            },
            {
                'case':
                    { '$eq': ['$sts', 'pending'] },
                'then': 'investigated'
            },
            {
                'case':
                    { '$eq': ['$sts', 'reject'] },
                'then': 'rejected' // dari sisi user
            },
            {
                'case':
                    { '$eq': ['$sts', 'accepted'] },
                'then': 'accepted'// dari sisi user
            }
        ],
        'default': 'unknown'
    }
}

module.exports = { returnAdminStatus }