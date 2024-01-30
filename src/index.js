const express = require("express");
const app = express(); // To start the express.js
const path = require("path");
const hbs = require("hbs");
const tempelatePath = path.join(__dirname, "../tempelates");
const collection = require("./mongodb");
const CryptoJS = require("crypto-js");
const sendEmail = require("./email");
const crypto = require("crypto");
require("dotenv").config();

app.use(express.json());
app.set("view engine", "hbs"); // Defining that view engine is hbs.
app.set("views", tempelatePath);
app.use(express.urlencoded({ extended: false }));

// Use static file to link css, js and other files.
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.get("/forgot", (req, res) => {
  res.render("forgot");
});

// Backend route for temporary.
app.get("/temporary/:token", (req, res) => {
  const token = req.params.token;
  // Render temporary.hbs and pass the token to the template
  res.render("temporary", { token });
});

// Backend route to retrieve likedPokemonsId for a user.
app.get("/get-liked-pokemons/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    // Find the user by userId and retrieve their likedPokemonsId
    const user = await collection.findOne({ _id: userId });

    if (user) {
      const likedPokemonsId = user.likedPokemonsId || [];
      res.status(200).json({ likedPokemonsId });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// For SignUp
app.post("/signup", async (req, res) => {
  const data = {
    name: req.body.name,
    password: req.body.password,
    email_ID: req.body.email,
  };

  const check = await collection.findOne({ name: req.body.name });

  // Check for existing username
  if (check && check.name === data.name) {
    return res.render("signup", {
      alertMessage: "Please select another username.",
    });
  }

  // Check if email exists
  const checkEmail = await collection.findOne({ email: req.body.email });
  if (checkEmail) {
    return res.render("signup", {
      alertMessage: "Email already exists. Please use another email.",
    });
  }

  console.log(
    `data name ${data.name}, data password ${data.password} and mail is ${checkEmail}`
  );
  // Encrypt the password
  const encryptedPassword = CryptoJS.AES.encrypt(
    data.password,
    "Pass!123$"
  ).toString();

  // Create an object with the encrypted password
  const encryptedData = {
    name: data.name,
    password: encryptedPassword,
    email: data.email_ID,
  };

  // Insert the encrypted data into the collection
  await collection.insertMany(encryptedData);

  res.redirect("/");
});

// For LogIn
app.post("/login", async (req, res) => {
  try {
    const checkUser = await collection.findOne({ name: req.body.name });

    if (!checkUser) {
      // If user doesn't exist
      return res.render("login", { alertMessage: "Incorrect username!" });
    }

    // const isPasswordMatch = checkUser.password === req.body.password;
    const decryptedPassword = CryptoJS.AES.decrypt(
      checkUser.password,
      "Pass!123$"
    ).toString(CryptoJS.enc.Utf8);

    if (decryptedPassword === req.body.password) {
      const userId = checkUser._id;
      return res.render("pokedex", { userId });
    } else {
      return res.render("login", { alertMessage: "Incorrect password!" });
    }
  } catch {
    res.redirect("/signup");
  }

  res.render("pokedex");
});

// Route to save likedPokemonsId for a user
app.post("/save-liked-pokemons/:userId", async (req, res) => {
  const userId = req.params.userId;

  const { likedPokemonsId } = req.body;

  try {
    const user = await collection.findOneAndUpdate(
      { _id: userId },
      { $set: { likedPokemonsId: likedPokemonsId } },
      { new: true }
    );

    // Send a success response or handle user data
    res
      .status(200)
      .json({ message: "Liked pokemons saved successfully", user });
  } catch (error) {
    // Handle any errors
    return res.status(500).json({ error: error.message });
  }
});

// For forgot password
app.post("/forgot", async (req, res) => {
  // Get the username and email address. In out case the email id is same for all.
  const checkUser = await collection.findOne({ name: req.body.name });
  const checkEmail = await collection.findOne({ email: req.body.email });

  if (checkEmail && checkUser) {
    // Generating temporary password and it's expiration time and storing it in the DB.
    const resetToken = checkEmail.createResetPasswordToken();
    await checkEmail.save({ validateBeforeSave: false });

    // This sends the reset token to the email.
    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/temporary/${resetToken}`;

    console.log(resetURL);

    const message = `We have received a password reset request.\nPlease use the below link to reset your password.\n\n${resetURL}\n\nThe temporary password is ${resetToken}\n\nThis reset password link will expire in the next 10 minutes.\n\n\nThanks,\nTeam Pokedex.`;

    console.log(message);

    try {
      await sendEmail({
        email: checkEmail.email,
        subject: "Request Password Change",
        message: message,
      });

      res.status(200).render("forgot", {
        status: "success",
        alertMessage: "Reset password link sent successfully!",
      });
    } catch (error) {
      checkEmail.temporaryPassword = undefined;
      checkEmail.temporaryPasswordExpires = undefined;
      await checkEmail.save({ validateBeforeSave: false });

      return res.status(500).render("forgot", {
        alertMessage:
          "An error occurred while processing your request, please try again after some time.",
      });
    }
  } else {
    // If email is not correct.
    return res.render("forgot", {
      alertMessage: "Incorrect email address or username",
    });
  }
});

// Backend route for Password Reset.
app.post("/temporary/:token", async (req, res) => {
  const token = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  console.log(`token is ${token}, line 298`);

  // This checks for the target user and also the password expiration time.
  const user = await collection.findOne({
    temporaryPassword: token,
    temporaryPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    console.log(`user not match line 307`);
    return res.status(500).render("/temporary/:token", {
      alertMessage:
        "An error occurred while processing your request.\nPlease try again after some time.",
    });
  }

  console.log(
    `user is ${user}, req body temporaryPassword ${
      req.body.temporaryPassword
    } type is ${typeof req.body.temporaryPassword}, line 315`
  );

  const encryptedTemporaryPassword = crypto
    .createHash("sha256")
    .update(req.body.temporaryPassword)
    .digest("hex");

  console.log(`encrypted is ${encryptedTemporaryPassword}, line 266`);

  console.log(
    `user.temporaryPassword ${user.temporaryPassword} and encryptedTemporaryPassword ${encryptedTemporaryPassword} line 263`
  );

  if (user.temporaryPassword !== encryptedTemporaryPassword) {
    console.log(
      `user.temporaryPassword ${user.temporaryPassword} and encryptedTemporaryPassword ${encryptedTemporaryPassword} line 268 when temp pass not equal.`
    );
    return res.render("temporary", {
      alertMessage: "Temporary password doesn't match. Please try again.",
    });
  }

  // Check if the new password and confirmation password matches
  const newPassword = req.body.newPassword;
  const confirmPassword = req.body.confirmPassword;

  if (newPassword !== confirmPassword) {
    console.log(`password not match, line 280`);
    return res.render("temporary", {
      alertMessage: "Passwords do not match",
    });
  }

  // Temporary password matches, update user password
  user.password = CryptoJS.AES.encrypt(newPassword, "Pass!123$").toString();
  user.confirmPassword = confirmPassword;
  user.temporaryPassword = undefined;
  user.temporaryPasswordExpires = undefined;

  await user.save();

  console.log(`before redirecting to login, line 301`);
  // Redirecting to the login page after successfully updating the password.
  res.redirect("/");
});

// For Logout.
app.post("/logout", (req, res) => {
  res.render("login");
});

app.listen(3004, () => {
  console.log("port connected");
});
