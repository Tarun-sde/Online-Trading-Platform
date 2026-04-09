import mongoose from 'mongoose';

const demoAccountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    required: true,
    default: 100000
  },
  holdings: [{
    symbol: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    avgPrice: {
      type: Number,
      required: true,
      min: 0
    }
  }]
}, { timestamps: true });

const DemoAccount = mongoose.model('DemoAccount', demoAccountSchema);
export default DemoAccount;
