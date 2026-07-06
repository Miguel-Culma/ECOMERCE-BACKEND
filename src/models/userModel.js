import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 6,
    maxlength: 254,
  },

  password: {
    type: String,
    required: true,
    trim: true,
    minlength: 6,
    maxlength: 254,
  },

  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
  },

  isAdmin: {
    type: Boolean,
    default: false,
  },
});
export default mongoose.model('User', userSchema);
