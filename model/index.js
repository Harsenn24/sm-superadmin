const mongoose = require('mongoose');
const configSchema = require('../schema/config');
const recordStore = require('../schema/record_store');
const superAdminActivity = require('../schema/sa_activity');
const sa_store = require('../schema/sa_stores');
const storeSchema = require('../schema/store');
const sys_payment_schema = require('../schema/sys_payment');
const tmpDataSchema = require('../schema/tmpData');
const userSchema = require('../schema/user');
const Schema = mongoose.Schema

const sa_users = new Schema(userSchema, { collection: "sa_users" })
const Sa_user = mongoose.model('Sa_user', sa_users)

const storesVouchers = new Schema({}, { collection: "stores_vouchers" })
const StoreVoucher = mongoose.model('StoreVoucher', storesVouchers)

const sys_vouchers = new Schema({}, { collection: "sys_vouchers" })
const Sys_voucher = mongoose.model('Sys_voucher', sys_vouchers)

const configs = new Schema(configSchema, { collection: "config" })
const Config = mongoose.model('Config', configs)

const stores = new Schema(storeSchema, { collection: "stores" })
const Store = mongoose.model('Store', stores)

const sys_payment = new Schema(sys_payment_schema, { collection: "sys_payment" })
const Sys_payment = mongoose.model('Sys_payment', sys_payment)

const sys_products_seen = new Schema({}, { collection: "sys_products_seen" })
const Sys_products_seen = mongoose.model('Sys_products_seen', sys_products_seen)

const sys_subscribe = new Schema({}, { collection: "sys_subscribe" })
const Sys_subscribe = mongoose.model('Sys_subscribe', sys_subscribe)

const users = new Schema({}, { collection: "users" })
const User = mongoose.model('User', users)

const stores_products = new Schema({}, { collection: "stores_products" })
const Stores_product = mongoose.model('Stores_product', stores_products)

const stores_clinics = new Schema({}, { collection: "stores_clinic" })
const Stores_clinic = mongoose.model('Stores_clinic', stores_clinics)

const doctors = new Schema({}, { collection: "doctors" })
const Doctor = mongoose.model('Doctor', doctors)

const tmp_sampahs = new Schema({}, { collection: "tmp_sampah" })
const Tmp_sampah = mongoose.model('Tmp_sampah', tmp_sampahs)

const doctors_chats = new Schema({}, { collection: "doctors_chats" })
const Doctor_chat = mongoose.model('Doctor_chat', doctors_chats)

const stores_bank = new Schema({}, { collection: "stores_bank" })
const Store_bank = mongoose.model('Store_bank', stores_bank)

const sys_doctors = new Schema({}, { collection: "sys_doctors" })
const Sys_doctor = mongoose.model('Sys_doctor', sys_doctors)

const rcd_stores_challenges = new Schema(recordStore, { collection: "rcd_stores_challenge" })
const Rcd_stores_challenge = mongoose.model('Rcd_stores_challenge', rcd_stores_challenges)

const tmpDatas = new Schema(tmpDataSchema, { collection: "sa_tmp_new_admin" })
const Tmp_data = mongoose.model('Tmp_data', tmpDatas)

const productReviews = new Schema({}, { collection: "sys_products_rev" })
const ProductReview = mongoose.model('ProductReview', productReviews)

const voucherReviews = new Schema({}, { collection: "sys_vouchers_rev" })
const VoucherReview = mongoose.model('VoucherReview', voucherReviews)

const storeFollowers = new Schema({}, { collection: "sys_stores_social" })
const StoreFollower = mongoose.model('StoreFollower', storeFollowers)

const storeSeens = new Schema({}, { collection: "stores_seen" })
const StoreSeen = mongoose.model('StoreSeen', storeSeens)

const userCarts = new Schema({}, { collection: "users_cart" })
const UserCart = mongoose.model('UserCart', userCarts)

const sa_activity_log = new Schema(superAdminActivity, { collection: "sa_log_activity" })
const Sa_activity_log = mongoose.model('Sa_activity_log', sa_activity_log)

const record_stores_withraw = new Schema({}, { collection: "rcd_stores_wd" })
const RecordWithdraw = mongoose.model('Rcd_stores_wd', record_stores_withraw)

const record_penalty = new Schema({}, { collection: "rcd_stores_penalty" })
const RecordPenalty = mongoose.model('Rcd_stores_penalty', record_penalty)

const sa_stores = new Schema(sa_store, { collection: "sa_stores_reissue" })
const Sa_stores = mongoose.model('Sa_stores_reissue', sa_stores)

const coupon = new Schema({}, { collection: "stores_coupon" })
const Stores_coupon = mongoose.model('Stores_coupon', coupon)

const log_store = new Schema({}, { collection: "stores_log" })
const Store_log = mongoose.model('Store_log', log_store)

const user_coupon = new Schema({}, { collection: "users_coupon" })
const User_coupon = mongoose.model('User_coupon', user_coupon)

module.exports = {
    User_coupon,
    Store_log,
    Stores_coupon,
    Sa_stores,
    RecordPenalty,
    RecordWithdraw,
    Sa_user,
    Config,
    StoreVoucher,
    Sys_voucher,
    Store,
    Sys_payment,
    Doctor,
    Sys_products_seen,
    Sys_subscribe,
    User,
    Stores_product,
    Stores_clinic,
    Tmp_sampah,
    Doctor_chat,
    Store_bank,
    Sys_doctor,
    Tmp_data,
    Rcd_stores_challenge,
    ProductReview,
    VoucherReview,
    StoreFollower,
    StoreSeen,
    UserCart,
    Sa_activity_log,
}

