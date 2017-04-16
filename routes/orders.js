var express = require('express');
const _ = require('lodash');
const validator = require('validator');
var exphbs = require('express-handlebars');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser'); //to parse json
var mongo = require('mongodb');
const {ObjectID} = require('mongodb');

var router = express.Router();
var {Sensor} = require('../models/sensor');
var {History} = require('../models/history');
var {authenticate} = require('../middleware/authenticate');



function predict(input , history)  {
  
  var a = input[0];
  var b = input[1];
  var c = input[2];
  
  var dataset1 = ["Normal results "];
  var dataset2 = ["Sunburn" , "Wind Exposure" , "Dermatitis" , "Ring Worm" , "Crest Syndrome"];
  var dataset3 = ["Anxiety Disorder" , "Hypo/Hyper Glycemia" , "Severe Allergic Reaction" , "Supraventricular Tachycardia"  , "Cyanide Poisoning "];
  var dataset4 = ["Dehydration" , "Panic Attack" , "Chicken Pox" , "Actinic Keratosis" , "Eczema" ];
  var dataset5 = ["Pneumonia" , "Mumps" , "Gastoenteristis " , "Acute Sinusilis" , "Sickle Cell Disease"];
  var dataset6 = ["Whooping Cough" , "Dengue Fever" ,  "Bird Flu" ,"Meningitis" ,  "Middle Ear Infection"];
  var dataset7 = ["Pharyngitis" , "Influenza" , "Thalassemia" ,  "Thallasemia" , "Pericarditis"];
  var dataset8 = ["Malaria", "Measles" , "Tuberculosis" , "Hypothyroidism" , "Sickle Cell Disease" ];
  
  
  if( a <= 37.5 && a >= 36.5 )    {
    
    if( b <= 100 && b >= 70 )  {
    
      if( c <= 60 && c >= 50) 
        var res = dataset1;       // a+b+c
      else 
        var res = dataset2;       // a+b+!c
      
    }
    else  {
    
      if( c <= 60 && c >= 50)   
        var res = dataset3;         //a+!b+c
      else
        var res = dataset4;         //a+!b+!c
    }
  }
  else  {
    
    if( b <= 100 && b >= 70 )  {
    
      if( c <= 60 && c >= 50)   
        var res = dataset5;         // a+b+c
      else
        var res = dataset6;       // a+b+!c
    }
    else  {
    
      if( c <= 60 && c >= 50)   
        var res = dataset7;         //a+!b+c
      else
        var res = dataset8;         //a+!b+!c
    }
  }
  
  
  // Adding the common diseases from the history and dataset
  
  var temp = [];
  
  for( var i = history.length - 1 ; i >= 0  ; i--) {
  
    for( var j = 0 ; j < res.length  ; j++) {
    
      if (history[i] == res[j])  
        temp.concat(history[i]);
      
    }
  } 
  
  res = temp.concat(res);      // Putting the values in the result set
  
  
  // Remove all the duplicate elements 
  
  for( var i = 0 ; i < history.length ; i++) {
  
    for( var j = history.length ; j < res.length  ; j++) {
    
      if (history[i] == res[j])  {
        res.splice(j,1);
        break;
      }
    }
  }
  
  return res.toString();
}

//----------------  send disease -------------------//
  


router.post('/', (req, res) => {
  var body = _.pick(req.body, ['s1','s2','s3','user_id']);
  history1 = [];

      History.find({"user_id":body.user_id}).then((history) => {
       if(history.length == 0) {
        history1 = ["Hypo/Hyper Glycemia" , "Anxiety Disorder"];
      }

      else {
        history1 = history.history_vals; 
      }
    });




  input = [body.s1,body.s2,body.s3]; 
  console.log(input);                    //  a!bc

  var output = predict(input , history1);  // the actual output 
  console.log(output);
    

  //to save the sensor readings
  var sensor = new Sensor(body);
  sensor.save().then((doc) => {
    //res.send(doc);

    History.find({"user_id":body.user_id}).then((user) => {
       if(user.length == 0) {
        console.log("new user");
        // for new user
        var history = new History({"user_id":body.user_id,"history_vals":output});
        history.save().then((hist) => {
          res.send(hist);
        }) 
      }
      else {
        console.log("exst user");
        var query = {'user_id':body.user_id};
        History.findOneAndUpdate(query,{"user_id":body.user_id,"history_vals":output}).then((hist) => {
          res.send(hist);
        });
      }
    })



  }, (e) => {
    res.status(400).send(e);
  });
  // save sensor reading part ends



  // History.find({retailer_id:id}).then((history) => {

  //   if(!history) {
  //     return res.status(404).send();
  //   }
  //   console.log(history);
  //   res.send(history);
  //    }).catch((e) => {
  //   res.status(400).send();
  // });



  // // to update the history
  // var history = new History(body);
  // order.save().then((doc) => {
  //   res.send(doc);
  // }, (e) => {
  //   res.status(400).send(e);
  // });
  // // save sensor reading part ends


});










//get all orders of a particular dealer, when supplied dealer's id.
router.get('/:id', (req, res) => { 
  var id = req.params.id; // id of the dealer

  // if (!ObjectID.isValid(id)) {
  //   return res.status(404).send();
  // }

  Order.find({retailer_id:id}).then((orders) => {
    if(!orders) {
      return res.status(404).send();
    }
    res.send(orders);
  }).catch((e) => {
    res.status(400).send();
  });
})


//   Order.findById(id).then((todo) => {
//     if (!todo) {
//       return res.status(404).send();
//     }

//     res.send({todo});
//   }).catch((e) => {
//     res.status(400).send();
//   });
// });


//post a new order
router.post('/', (req, res) => {
  var body = _.pick(req.body, ['customer.name','customer.phone','customer.email','customer.address','retailer_id','invoice.products','invoice.cost']);
  var d = new Date();
  body.placedAt=d.toString();
  var order = new Order(body);

  order.save().then((doc) => {
    res.send(doc);
  }, (e) => {
    res.status(400).send(e);
  });
});



// //change the order to processing
// router.get('/', (req, res) => {
//   Todo.find().then((todos) => {
//     res.send({todos});
//   }, (e) => {
//     res.status(400).send(e);
//   });
// });

// //change the order to done
// router.get('/', (req, res) => {
//   Todo.find().then((todos) => {
//     res.send({todos});
//   }, (e) => {
//     res.status(400).send(e);
//   });
// });


module.exports = router;
