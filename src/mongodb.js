const mongoose = require("mongoose");
const crypto = require("crypto");

// Connect the node to the mongodb databse with the name "pokedexLogin".
mongoose
  .connect("mongodb://localhost:27017/pokedexLogin")

  // When it is connected
  .then(() => {
    console.log("mongodb connected");
  })

  // When it is not connected
  .catch(() => {
    console.log("connection failed");
  });

// Creating a schema.
const loginSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  likedPokemonsId: {
    type: Array,
    default: [],
  },
  email: {
    type: String,
    required: true,
  },
  temporaryPassword: { type: String },
  temporaryPasswordExpires: { type: Date },
});

// Creating new schema inside the login schema which will hold the new password token.
loginSchema.methods.createResetPasswordToken = function () {
  // This reset token will not be encrpted.
  const resetToken = crypto.randomBytes(12).toString("hex");

  // Encrypting the reset token.
  this.temporaryPassword = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.temporaryPasswordExpires = Date.now() + 10 * 60 * 1000;

  console.log(
    `reset token in hex ${resetToken} and encrpted is ${this.temporaryPassword}`
  );

  return resetToken;
};

// Defining the collection.
const collection = new mongoose.model("collection1", loginSchema);

module.exports = collection;
