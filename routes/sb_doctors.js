const express = require("express");
const DoctorController = require("../controllers/doctors");
const LoginController = require("../controllers/login");
const { authentif } = require("../middleware/authentif");
const router = express.Router();

router.post("/login", LoginController.login)
router.use(authentif)
router.get("/prod-personal", DoctorController.prod_personal)
router.get("/consul_inside/:id", DoctorController.consul_inside_store)
router.get("/doctor/:id", DoctorController.doctor_detail)
router.get("/doctor/chat/find", DoctorController.doctor_so)
router.get("/doctor/chat/:id", DoctorController.doctorProfile_wc)
router.get("/doctor/history/active", DoctorController.lastChat)



module.exports = router
