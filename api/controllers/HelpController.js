var request = require('request');
 var bcrypt = require('bcrypt');
 var nodemailer = require('nodemailer');
 var mergeJSON = require("merge-json");
 var validator = require('validator');
 var crypto = require("crypto");
 var transporter = nodemailer.createTransport({
   service: sails.config.common.supportEmailIdService,
   auth: {
     user: sails.config.common.supportEmailId,
     pass: sails.config.common.supportEmailIdpass
   }
 });
 var project_url = sails.config.common.projectURL;

 module.exports = {
   logout: function(req, res) {
     req.session.destroy()
     console.log("Logout Successfully.......");
     res.json(200, {
       message: 'Logout Successfully'
     });
   },

   helpUser: function(req, res) {
     console.log("Enter into createNewUser :: " + req.body.email);
     var sub = req.body.subject;
		 var msg = req.body.message;

     // var userpassword = req.body.password;
     // var userconfirmPassword = req.body.confirmpassword;
		 //    if (!validator.isEmail(useremailaddress)) {
     //   return res.json({
     //     "message": "Please Enter valid email id",
     //     statusCode: 400
     //   });
     // }
     if (sub=="" || msg==""  ) {
       console.log("User Entered invalid parameter ");
       return res.json({
         "message": "Can't be empty!!!",
         statusCode: 400
       });
     }
// console.log("ssksksssskskksk");
             var userObj = {
               subject:sub,
							 message:msg
                 }
                 Help.create(userObj).exec(function(err, userObj) {
                 console.log("Error to Create New user !!!");
                 console.log(err);
                 return res.json({
                   "message": "Error to create New User",
                   statusCode: 400
                 });
               });
               console.log("we help you out...........");


             },
               otpmatch: function(req, res) {
                 console.log("Enter into createNewUser :: " + req.body.email);
                 var email = req.body.email;
                 var otp = req.body.otp;
                // var msg = req.body.message;

                 // var userpassword = req.body.password;
                 // var userconfirmPassword = req.body.confirmpassword;
                //    if (!validator.isEmail(useremailaddress)) {
                 //   return res.json({
                 //     "message": "Please Enter valid email id",
                 //     statusCode: 400
                 //   });
                 // }
                 if (email=="" || otp==""  ) {
                   console.log("User Entered invalid parameter ");
                   return res.json({
                     "message": "Can't be empty!!!",
                     statusCode: 400
                   });
                 }
                 // console.log("hello world");
                 User.findOne({
                   email: email
                 }).exec(function(err, user) {
                   if (err) {
                       console.log(err);
                     return res.json({
                       "message": "Error to find user",
                       statusCode: 401
                     });
                   }
                   if (!user) {
                     return res.json({
                       "message": "Invalid email!",
                       statusCode: 401
                     });
                   }
                   console.log("hello world");

                   User.compareEmailVerificationOTP(otp, user, function(err, valid) {
                     console.log("compaire::::::::::::::::::: ",err,valid)
                     if (err) {
                       console.log("Error to compare otp");
                       return res.json({
                         "message": "Error to compare otp",
                         statusCode: 401
                       });
                     }
                     if (!valid) {
                       return res.json({
                         "message": "Please enter correct otp",
                         statusCode: 401
                       });
                     } else {
                       console.log("OTP is verified successfully");
                       User.update({
                           email: email
                         }, {
                           verifyEmail: true
                         })
                         .exec(function(err, updatedUser) {
                           if (err) {
                             return res.json({
                               "message": "Error to update password!",
                               statusCode: 401
                             });
                           }
                           // console.log("Update current transactionPassword successfully!!!");

                           User.findOne({
                             email: email
                           }).exec(function(err, userDetailsReturn) {
                             if (err) {
                               return res.json({
                                 "message": "Error to find user",
                                 statusCode: 401
                               });
                             }
                             if (!userDetailsReturn) {
                               return res.json({
                                 "message": "Invalid email!",
                                 statusCode: 401
                               });
                             }
                             return res.json(200, {
                               user: userDetailsReturn,
                               statusCode: 200
                             });
                           });
                         });
                     }
                   });
                 });
              }
}
