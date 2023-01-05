const { date2number } = require("./date2number")

function get_time_body(req) {
    let { time_start, time_end } = req.query

    if (!time_start) { throw { message: 'Start Date is required' } }

    if (!time_end) { throw { message: 'End Date is required' } }


    time_start = date2number(time_start)
    time_end = date2number(time_end)
    let time_start_double = time_end
    let time_end_double = time_end - (time_start - time_end)

    return { time_start: time_start, time_end: time_end, time_start_double: time_start_double, time_end_double: time_end_double }
}

module.exports = { get_time_body }