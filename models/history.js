var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var History = mongoose.model('history', {


  user_id: {
      type: String,
      required: true
  },
  history_vals:{
    type: Array,
    required:true
  }
});

module.exports = {History};
