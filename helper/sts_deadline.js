const switch_deadline = {
    '$switch': {
        'branches': [
            {
                'case': { '$eq': ['$tme.sts', 'payment:pending'] }, 'then': {
                    'deadline_type': 'payment:pending',
                    'deadline_start': { '$toDate': { '$multiply': ['$tme.eps', 1000] } },
                    'deadline_end': { '$toDate': { '$multiply': ['$tme.epe', 1000] } }
                }
            },
            {
                'case': { '$eq': ['$tme.sts', 'payment:settlement'] }, 'then': {
                    'deadline_type': 'payment:settlement',
                    'deadline_start': { '$toDate': { '$multiply': ['$tme.eps', 1000] } },
                    'deadline_end': { '$toDate': { '$multiply': ['$tme.epe', 1000] } }
                }
            },
            {
                'case': { '$eq': ['$tme.sts', 'shipping:packed'] }, 'then': {
                    'deadline_type': 'shipping:packed',
                    'deadline_start': { '$toDate': { '$multiply': ['$tme.eps', 1000] } },
                    'deadline_end': { '$toDate': { '$multiply': ['$tme.epe', 1000] } }
                }
            },
            {
                'case': { '$eq': ['$tme.sts', 'shipping:shipping'] }, 'then': {
                    'deadline_type': 'shipping:shipping',
                    'deadline_start': { '$toDate': { '$multiply': ['$tme.eps', 1000] } },
                    'deadline_end': { '$toDate': { '$multiply': ['$tme.epe', 1000] } }
                }
            },
        ],
        'default': {
            'deadline_type': 'unknown',
            'deadline_start': 'unknown',
            'deadline_end': 'unknown'
        }
    }
}

module.exports = switch_deadline