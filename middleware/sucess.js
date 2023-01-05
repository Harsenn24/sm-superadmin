function jsonData(
    data = { 'success': true },
    status_code = 200,
    status_comments = 'ok!',
    meta_code = 1,
    meta_comments = "Success!"
) {
    try { meta_comments }
    catch { meta_comments = 'Something wrong!' }
    return {
        "status_code": status_code,
        "comments": status_comments,
        "meta": {
            "code": meta_code,
            "comments": meta_comments,
            "latency": 0
        },
        "data": data
    }
}



module.exports = { jsonData }