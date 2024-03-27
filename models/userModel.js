const mongoose = require("mongoose");
const bycrypt = require("bcryptjs");

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    lastname: {
      type: String,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: Number,
      required: true,
    },
    photo: {
      type: String,
    },
    card: {
      type: String,
    },
    runs: {
      type: String,
    },
    avg: {
      type: String,
    },
    fifty: {
      type: String,
    },
    gender: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// userSchema.methods.matchPassword = async function (enteredPassword) {
//   return await bycrypt.compare(enteredPassword, this.password);
// };

// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) {
//     next();
//   }
//   const salt = await bycrypt.genSalt(10);
//   this.password = await bycrypt.hash(this.password, salt);
// });

const User = mongoose.model("User", userSchema);

module.exports = User;
