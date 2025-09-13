const mongoose = require('mongoose')

const referralSchema = new mongoose.Schema({
  source: { type: String, required: true },
  count: { type: Number, default: 1 },
});

const Referral = mongoose.model("Referral", referralSchema);

export default Referral;
