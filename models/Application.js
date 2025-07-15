const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  fio: { type: String, required: true },
  phone: { type: String, required: true },
  description: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Application", applicationSchema);
