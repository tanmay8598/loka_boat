const express = require("express");

const admin = require("../middleware/authMiddleware");
const {
  getUsers,
  registerUser,
  authUser,
  updateUserProfile,
  card,
} = require("../controller/userController");
const router = express.Router();

router.route("/").post(registerUser).get(getUsers);
router.post("/login", authUser);
router.post("/update", updateUserProfile);

router.get("/card", card);

module.exports = router;
