const { jsonData } = require("../middleware/sucess")

function handleError(err, req, res, next) {

    let code = null
    let message = null
    let codeNumber = null

    switch (err.message) {
        case 'username or email is required':
            code = 400
            codeNumber = 3
            message = 'username or email is required'
            break;

        case 'password is required':
            code = 400
            codeNumber = 4
            message = 'password is required'
            break;

        case 'Invalid email/password':
            code = 400
            codeNumber = 5
            message = 'Invalid email/password'
            break;

        case 'JSON Web Token Error':
            code = 400
            codeNumber = 6
            message = 'JSON Web Token Error'
            break;

        case 'Invalid Endpoint':
            code = 400
            codeNumber = 7
            message = 'Invalid Endpoint'
            break;

        case 'Invalid Method':
            code = 400
            codeNumber = 7
            message = 'Invalid Method'
            break;

        case 'Start Date is required':
            code = 400
            codeNumber = 8
            message = 'Start Date is required'
            break;

        case 'End Date is required':
            code = 400
            codeNumber = 9
            message = 'End Date is required'
            break;

        case 'Start Date double is required':
            code = 400
            codeNumber = 10
            message = 'Start Date double is required'
            break;

        case 'End Date double is required':
            code = 400
            codeNumber = 11
            message = 'End Date double is required'
            break;

        case 'Id is invalid':
            code = 400
            codeNumber = 12
            message = 'Id is invalid'
            break;

        case 'Data not found':
            code = 400
            codeNumber = 13
            message = 'Data not found'
            break;

        case 'old password is required':
            code = 400
            codeNumber = 14
            message = 'old password is required'
            break;

        case 'new password is required':
            code = 400
            codeNumber = 15
            message = 'new password is required'
            break;

        case 'confirm password is required':
            code = 400
            codeNumber = 16
            message = 'confirm password is required'
            break;

        case `Your password can't be different`:
            code = 400
            codeNumber = 17
            message = `Your password can't be different`
            break;

        case `old passowrd is invalid`:
            code = 400
            codeNumber = 18
            message = `old passowrd is invalid`
            break;

        case `Input must be a Number`:
            code = 400
            codeNumber = 19
            message = `Input must be a Number`
            break;

        case `Fee is required`:
            code = 400
            codeNumber = 20
            message = `Fee is required`
            break;

        case `Minimum transaction is required`:
            code = 400
            codeNumber = 21
            message = `Minimum transaction is required`
            break;

        case `Admin fee discount is required`:
            code = 400
            codeNumber = 22
            message = `Admin fee discount is required`
            break;

        case `Input price is required`:
            code = 400
            codeNumber = 23
            message = `Input price is required`
            break;

        case `Failed Edit Data!`:
            code = 400
            codeNumber = 24
            message = `Failed Edit Data!`
            break;

        case 'Email is required':
            code = 400
            codeNumber = 25
            message = 'Email is required'
            break;

        case 'Failed save to temporary collection':
            code = 400
            codeNumber = 26
            message = 'Failed save to temporary collection'
            break;

        case 'Failed send email':
            code = 400
            codeNumber = 27
            message = 'Failed send email'
            break;

        case 'Email already in used':
            code = 400
            codeNumber = 28
            message = 'Email already in used'
            break;

        case 'Token is invalid':
            code = 400
            codeNumber = 29
            message = 'Token is invalid'
            break;

        case 'Token is required':
            code = 400
            codeNumber = 30
            message = 'Token is required'
            break;

        case 'Data is empty':
            code = 400
            codeNumber = 31
            message = 'Data is empty'
            break;

        case 'This store already approved':
            code = 400
            codeNumber = 32
            message = 'This store already approved'
            break;

        case 'Tab is required':
            code = 400
            codeNumber = 33
            message = 'Tab is required'
            break;

        case 'Page not found':
            code = 400
            codeNumber = 34
            message = 'Page not found'
            break;

        case 'Admin voucher is required':
            code = 400
            codeNumber = 35
            message = 'Admin voucher is required'
            break;

        case 'Admin doctor is required':
            code = 400
            codeNumber = 36
            message = 'Admin doctor is required'
            break;

        case 'Type is required':
            code = 400
            codeNumber = 37
            message = 'Type is required'
            break;

        case 'Price is required':
            code = 400
            codeNumber = 38
            message = 'Price is required'
            break;

        case 'Promo status is required':
            code = 400
            codeNumber = 39
            message = 'Promo status is required'
            break;

        case 'Promo price is required':
            code = 400
            codeNumber = 40
            message = 'Promo price is required'
            break;

        case 'Promo start is required':
            code = 400
            codeNumber = 41
            message = 'Promo start is required'
            break;

        case 'Promo end date is required':
            code = 400
            codeNumber = 42
            message = 'Promo end date is required'
            break;

        case 'Id config is required':
            code = 400
            codeNumber = 43
            message = 'Id config is required'
            break;

        case 'Name is required':
            code = 400
            codeNumber = 44
            message = 'Name is required'
            break;

        case 'id not found':
            code = 400
            codeNumber = 45
            message = 'id not found'
            break;

        case 'Reason is required':
            code = 400
            codeNumber = 46
            message = 'Reason is required'
            break;

        case 'Descision is required':
            code = 400
            codeNumber = 47
            message = 'Descision is required'
            break;

        case 'This order status already ivestigated':
            code = 400
            codeNumber = 48
            message = 'This order status already ivestigated'
            break;

        case 'Super admin already give the token to seller':
            code = 400
            codeNumber = 49
            message = 'Super admin already give the token to seller'
            break;

        case 'Source is required':
            code = 400
            codeNumber = 50
            message = 'Source is required'
            break;

        case 'Failed sent email!':
            code = 400
            codeNumber = 51
            message = 'Failed sent email!'
            break;

        case 'This store is not in default':
            code = 400
            codeNumber = 52
            message = 'This store is not in default'
            break;

        case 'This excel has empty data':
            code = 400
            codeNumber = 53
            message = 'This excel has empty data'
            break;

        case 'This store already in default':
            code = 400
            codeNumber = 54
            message = 'This store already in default'
            break;

        default:
            code = 500;
            codeNumber = 99
            message = `OH NO, YOU GOT AN ERROR! :  ${err}`;
            break;
    }
    res.status(code).json(jsonData({ success: false }, code, 'Failed!', codeNumber, message))
}

module.exports = { handleError }