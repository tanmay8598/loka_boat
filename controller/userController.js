const asyncHandler = require("express-async-handler");
const { generateTokenUser } = require("../utils/generateToken.js");
const User = require("../models/userModel.js");
const Replicate = require("replicate");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
// @desc    Auth user & get token
// @route   POST /api/users/login
//@access   Public

const config = {
  region: process.env.AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
};

const s3 = new S3Client(config);

const resetPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (user) {
    let pass = "";
    let str =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + "abcdefghijklmnopqrstuvwxyz0123456789@#$";

    for (let i = 1; i <= 8; i++) {
      let char = Math.floor(Math.random() * str.length + 1);

      pass += str.charAt(char);
    }
    user.password = pass;
    const updatedUser = await user.save();
    sendEmail(pass, user);
    res.status(201).json("success");
  } else {
    res.status(401);
    throw new Error("Invalid email");
  }
});

const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,

      token: generateTokenUser(
        user._id,
        user.name,
        user.email,
        user.shippingAddress
      ),
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// @desc    User registration
// @route   POST /api/users
//@access   Public

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone, gender } = req.body;

  const userExists = await User.findOne({ email });
  const runs = Math.floor(Math.random() * (4000 - 2000 + 1) + 2000);
  const avg = Math.floor(Math.random() * (60 - 30 + 1) + 30);
  const fifty = Math.floor(Math.random() * (30 - 10 + 1) + 10);
  if (userExists) {
    res.status(404);
    throw new Error("User already exists");
  }

  const user = await User.create({
    name,
    email,
    fifty,
    runs,
    avg,
    phone,
    gender,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      fifty: user.fifty,
      runs: user.runs,
      avg: user.avg,
      gender: user.gender,

      // token: generateTokenUser(
      //   user._id,
      //   user.name,
      //   user.email,
      //   user.shippingAddress
      // ),
    });
  } else {
    res.status(404);
    throw new Error("Invalid user data");
  }
});

// @desc    Get user profile
// @route   GET /api/users/login
//@access   Private

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      name: user.phone,
      email: user.email,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.body.id);

  if (user) {
    if (req.body.photo) {
      user.photo = req.body.photo ? req.body.photo : "";
    }
    if (req.body.card) {
      user.card = req.body.card ? req.body.card : "";
    }

    const updatedUser = await user.save();
    res.status(201).json({
      updatedUser,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc    Get all users
// @route   Get /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const page = Number(req.query.pageNumber) || 1;
  const pageSize = 50;
  const count = await User.countDocuments({});
  var pageCount = Math.floor(count / 50);
  if (count % 50 !== 0) {
    pageCount = pageCount + 1;
  }
  const users = await User.find({})
    .limit(pageSize)
    .sort({ createdAt: -1 })
    .skip(pageSize * (page - 1));
  res.json({ users, pageCount });
});

// @desc    Delete users
// @route   DELETE /api/users/:id
// @access  Private/Admin

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    await user.remove();
    res.json({ message: "User removed" });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc    Get user by Id
// @route   GET /api/users/:id
// @access  Private/Admin

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

const card = asyncHandler(async (req, res) => {
  const { gender } = req.query;
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });

  if (gender === "male") {
    const input = {
      swap_image: req.query.photo,
      target_image:
        "https://times-project.s3.ap-south-1.amazonaws.com/front.png",
    };
    const output = await replicate.run(
      "omniedgeio/face-swap:c2d783366e8d32e6e82c40682fab6b4c23b9c6eff2692c0cf7585fc16c238cfe",
      { input }
    );
    const user = await User.findById(req.query.userID);
    if (user) {
      user.card = output;

      const updatedUser = await user.save();
    }
    res.json({
      output,
    });
  } else {
    const input = {
      swap_image: req.query.photo,
      target_image:
        "https://times-project.s3.ap-south-1.amazonaws.com/female_card-1.jpg",
    };
    const output = await replicate.run(
      "omniedgeio/face-swap:c2d783366e8d32e6e82c40682fab6b4c23b9c6eff2692c0cf7585fc16c238cfe",
      { input }
    );

    const user = await User.findById(req.query.userID);

    if (user) {
      user.card = output;

      const updatedUser = await user.save();
    }
    res.json({
      output,
    });
  }
});

module.exports = {
  authUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  resetPassword,
  card,
};
