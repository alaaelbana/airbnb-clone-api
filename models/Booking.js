const mongoose = require("mongoose");

const { Schema } = mongoose;

const BookingSchema = new Schema({
  place: { type: Schema.Types.ObjectId, ref: "place" },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  maxGuests: { type: Number, required: true },
  username: { type: String, required: true },
  phone: { type: String, required: true },
  price: Number,
});

const BookingModel = mongoose.model("Booking", BookingSchema);

module.exports = BookingModel;
