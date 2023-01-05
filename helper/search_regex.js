function search_something(key_name, value_name) {

    if (value_name) {
        return {
            [key_name]: {
                '$regex': value_name,
                '$options': 'i'
            }
        }
    } else {
        return {}
    }

}



module.exports = {
    search_something
}