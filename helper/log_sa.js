const { Sa_activity_log } = require("../model")

function addLogSa(email, username, activity, timeUpdate) {

    const addData = new Sa_activity_log(
        {
            eml: email,
            usr: username,
            act: activity,
            ep: timeUpdate
        }
    )

    let hasil = 0

    addData.save((err) => {
        if (err) {
            console.log(err)
            hasil = err
        } else {
            hasil = 'ok'
        }
    })

    // return hasil
    console.log(hasil)
}

module.exports = {
    addLogSa
}