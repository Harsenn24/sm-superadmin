const status_product = {
    '$switch': {
        'branches': [
            {
                'case': {
                    '$and': [
                        { '$eq': ['$det.act', true] },
                    ]
                },
                'then': 'published'
            },
            {
                'case': {
                    '$and': [
                        { '$eq': ['$det.act', false] },
                    ]
                },
                'then': 'unpublished'
            },
            
        ],
        'default': 'unknown'
    }
}

module.exports = status_product


// {
//     'case': {
//         '$and': [
//             { '$eq': ['$det.act', true] },
//         ]
//     },
//     'then': 'published'
// },
// {
//     'case': { '$eq': ['$det.drf', true] },
//     'then': 'unpublished'
// },
// {
//     'case': { '$eq': ['$det.drf', true] },
//     'then': 'draft'
// },
// {
//     'case': { '$eq': ['$total', 0] },
//     'then': 'empty'
// },