function date2number(date) {
    if (date !== '') {
        return ((new Date(date).getTime()) / 1000)
    } else {
        return ((new Date().getTime()) / 1000)
    }
}

module.exports = {
    date2number
}