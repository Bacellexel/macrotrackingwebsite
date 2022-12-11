const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  name:{
    type: String,
    required:true
  },
  email:{
    type: String,
    required:true
  },
  password:{
    type: String,
    required:true
  },
  date:{
    type:Date,
    default:Date.now
  },
  caloriesTotal:{
    type: Number,
    default:0
  },
  weight:{
    type: Number,
    default:0
  },
  height:{
    type: Number,
    default:0
  },
  dateOfBirth:{
    type: Date,
    default:Date.now
  },
  gender:{
    type: String,
    default:"Male"
  },
  activity:{
    type:String,
    default:"Sedentary"
  },
  goal:{
    type:String,
    default:"Bulk"
  },
  todayCalories:{
    type: Number,
    default:0
  },
  todayProteins:{
    type: Number,
    default:0
  },
  todayCarbs:{
    type: Number,
    default:0
  },
  todayFats:{
    type: Number,
    default:0
  },
  percentProteins:{
    type: Number,
    default:25
  },
  percentCarbs:{
    type: Number,
    default:40
  },
  percentFats:{
    type: Number,
    default:35
  },
  searchHistory:{
    type: []
  }
});
const User = mongoose.model('User', UserSchema);

module.exports = User;
