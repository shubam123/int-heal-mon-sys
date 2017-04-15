var mongoose = require('mongoose');

var Sensor = mongoose.model('sensor_vals', {


  user_id: {
      type: String,
      required: true
  },
  s1: {
    type: String
  },
  s2: {
    type: String
  },
  s3: {
    type: String
  },  
});

module.exports = {Sensor};
