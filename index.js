const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserModel = require("./models/User.js");
const PlaceModel = require("./models/Place.js");
const BookingModel = require("./models/Booking.js");
const cookieParser = require("cookie-parser");
const imageDownloader = require("image-downloader");
const multer = require("multer");
const fs = require("fs");

require("dotenv").config();
app = express();

app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(__dirname + "/uploads"));

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = "asdjdqwpoklc";

app.use(
  cors({
    credentials: true,
    origin: "http://localhost:5173",
  })
);

mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGO_URL);

app.get("/test", (req, res) => {
  res.json("test ok");
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const user = await UserModel.create({
      name,
      email,
      password: bcrypt.hashSync(password, bcryptSalt),
    });
    res.json(user);
  } catch (err) {
    res.status(422).json(err);
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await UserModel.findOne({ email });
  if (user) {
    const passOk = bcrypt.compareSync(password, user.password);
    if (passOk) {
      jwt.sign(
        {
          email: user.email,
          id: user._id,
        },
        jwtSecret,
        {},
        (err, token) => {
          if (err) throw err;
          res.cookie("token", token).json(user);
        }
      );
    } else {
      res.status(422).json("pass not found");
    }
  } else {
    res.status(422).json("email not found");
  }
});

app.get("/profile", (req, res) => {
  const { token } = req.cookies;
  if (token) {
    jwt.verify(token, jwtSecret, {}, async (err, data) => {
      if (err) throw err;
      const { name, email, _id } = await UserModel.findById(data.id);
      res.json({ name, email, _id });
    });
  } else {
    res.json(null);
  }
});

app.post("/logout", (_, res) => {
  res.cookie("token", "").json(true);
});

app.post("/upload-by-link", async (req, res) => {
  const { link } = req.body;
  const newName = "photo" + Date.now() + ".jpg";
  try {
    await imageDownloader.image({
      url: link,
      dest: __dirname + "/uploads/" + newName,
    });
    res.json(newName);
  } catch (err) {
    res.status(422).json(err);
  }
});

const photosMiddleware = multer({ dest: "uploads" });
app.post("/upload", photosMiddleware.array("photos", 100), (req, res) => {
  const uploadedFiles = [];
  for (let i = 0; i < req.files.length; i++) {
    const { path, originalname } = req.files[i];
    const parts = originalname.split(".");
    const newpath = path + "." + parts[parts.length - 1];
    fs.renameSync(path, newpath);
    uploadedFiles.push(newpath.replace("uploads\\", ""));
  }
  res.json(uploadedFiles);
});

app.post("/places", async (req, res) => {
  const { token } = req.cookies;
  const {
    Title,
    Address,
    addedPhotos,
    Description,
    Perks,
    Extra,
    Price,
    CheckIn,
    CheckOut,
    Guests,
  } = req.body;
  jwt.verify(token, jwtSecret, {}, async (err, data) => {
    if (err) throw err;
    const placeDoc = await PlaceModel.create({
      owner: data.id,
      title: Title,
      address: Address,
      photos: addedPhotos,
      description: Description,
      perks: Perks,
      extraInfo: Extra,
      Price: Price,
      checkIn: CheckIn,
      checkOut: CheckOut,
      maxGuests: Guests,
    });
    res.json(placeDoc);
  });
});
app.get("/user-places", (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, jwtSecret, {}, async (err, data) => {
    if (err) throw err;
    res.json(await PlaceModel.find({ owner: data.id }));
  });
});
app.get("/places/:id", async (req, res) => {
  const { id } = req.params;
  try {
    res.json(await PlaceModel.findById(id));
  } catch (err) {
    res.status(422).json(err);
  }
});
app.put("/places", async (req, res) => {
  const { token } = req.cookies;
  const {
    id,
    Title,
    Address,
    addedPhotos,
    Description,
    Perks,
    Extra,
    Price,
    CheckIn,
    CheckOut,
    Guests,
  } = req.body;
  jwt.verify(token, jwtSecret, {}, async (err, data) => {
    if (err) throw err;
    const placeDoc = await PlaceModel.findById(id);
    if (data.id === placeDoc.owner.toString()) {
      placeDoc.set({
        title: Title,
        address: Address,
        photos: addedPhotos,
        description: Description,
        perks: Perks,
        extraInfo: Extra,
        Price: Price,
        checkIn: CheckIn,
        checkOut: CheckOut,
        maxGuests: Guests,
      });
      await placeDoc.save();
      res.json("ok");
    }
  });
});

app.get("/places", async (req, res) => {
  res.json(await PlaceModel.find());
});

app.post("/bookings", (req, res) => {
  const { place, checkIn, checkOut, maxGuests, username, phone, price } =
    req.body;
  BookingModel.create({
    place,
    checkIn,
    checkOut,
    maxGuests,
    username,
    phone,
    price,
  })
    .then((doc) => {
      res.json(doc);
    })
    .catch((err) => {
      res.status(422).json(err);
    });
});

app.listen(4000);
