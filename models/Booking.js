const mongoose = require("mongoose");

const { Schema } = mongoose;

const BookingSchema = new Schema({
  user: { type: Schema.Types.ObjectId, required: true },
  place: { type: Schema.Types.ObjectId, required: true, ref: "Place" },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  maxGuests: { type: Number, required: true },
  username: { type: String, required: true },
  phone: { type: String, required: true },
  price: Number,
});

const BookingModel = mongoose.model("Booking", BookingSchema);

module.exports = BookingModel;
