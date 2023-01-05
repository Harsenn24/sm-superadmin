const { Sa_activity_log } = require("../model");
const { date2number } = require("./date2number");
const timeUpdate = date2number('')

function saveHistory(dataUser, activity) {
    const addData = new Sa_activity_log(
        {
            eml: dataUser.email,
            usr: dataUser.username,
            act: activity,
            ep: timeUpdate
        }
    )

    return addData
}

module.exports = { saveHistory }

