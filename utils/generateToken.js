const jwt = require("jsonwebtoken");

const generateTokenAdmin = (id, name, email, userType) => {
  return jwt.sign({ id, name, email, userType }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

module.exports = {
    generateTokenAdmin,
    
  };