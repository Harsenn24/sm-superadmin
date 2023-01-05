function encodeBase64(data) {

    var buff = Buffer.from(data, 'base64');
    let result = buff.toString('ascii');
    return result

}



module.exports = {
    encodeBase64
}