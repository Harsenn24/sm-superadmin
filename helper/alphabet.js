function convertAlphabet(number) {
    const array_alpha = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]

    for (let i = 0; i < array_alpha.length; i++) {
        if (number === i) {
            return array_alpha[i]
        }
    }
}



module.exports = {
    convertAlphabet
}