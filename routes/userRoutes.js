const express = require("express");

const admin = require("../middleware/authMiddleware");
const {
  getUsers,
  registerUser,
  authUser,
  updateUserProfile,
  card,
  getUserByPhone,
  searchUser,
} = require("../controller/userController");
const router = express.Router();

router.route("/").post(registerUser).get(getUsers);
router.post("/login", authUser);
router.post("/update", updateUserProfile);
router.get("/phone", getUserByPhone);
router.get("/search", searchUser);
router.get("/card", card);

module.exports = router;
