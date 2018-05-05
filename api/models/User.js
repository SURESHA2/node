/**
 * User.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
var bcrypt = require('bcrypt');
module.exports = {
  schema: true,
  attributes: {
    email: {
      type: "email",
      email: true,
      // required: true,
      unique: true
    },
    isUserDisable: {
      type: "boolean",
      defaultsTo: false
    },

    isUserFreezed: {
      type: "boolean",
      defaultsTo: false
    },

   name: {
     type: 'string'
   },

    encryptedPassword: {
      type: 'string'
    },

    encryptedResetSpendingpassword: {
      type: 'string'
    },
    encryptedSpendingpassword: {
      type: 'string'
    },
    encryptedForgotPasswordOTP: {
      type: 'string'
    },
    encryptedForgotSpendingPasswordOTP: {
      type: 'string'
    },
    encryptedEmailVerificationOTP: {
      type: 'string'
    },
    verifyEmail: {
      type: 'boolean',
      defaultsTo: false
    },
    isAdmin: {
      type: 'boolean',
      defaultsTo: false
    },
    loginHistory: {
      collection: 'LoginHistory',
      via: 'loginowner'
    },
    mobileNumber: {
    type:'string'
    },

    toJSON: function() {
      var obj = this.toObject();
      delete obj.encryptedPassword;
      delete obj.encryptedSpendingpassword;
      delete obj.encryptedEmailVerificationOTP;
      delete obj.encryptedForgotPasswordOTP;
      delete obj.encryptedForgotSpendingPasswordOTP;
      return obj;
    }

  },
  comparePassword: function(password, user, cb = () => {}) {
    bcrypt.compare(password, user.encryptedPassword, function(err, match) {
      return new Promise(function(resolve, reject) {
        if (err) {
          console.log(err);
          cb(err);
          return reject(err);
        }
        cb(null, match)
        resolve(match);
      })
    })
  },
  compareResetSpendingpassword: function(resetspendingpassword, user, cb = () => {}) {
    bcrypt.compare(resetspendingpassword, user.encryptedResetSpendingpassword, function(err, match) {
      return new Promise(function(resolve, reject) {
        if (err) {
          cb(err);
          return reject(err);
        }
        cb(null, match)
        resolve(match);
      })
    })
  },
  compareSpendingpassword: function(spendingpassword, user, cb = () => {}) {
    bcrypt.compare(spendingpassword, user.encryptedSpendingpassword, function(err, match) {
      return new Promise(function(resolve, reject) {
        if (err) {
          cb(err);
          return reject(err);
        }
        cb(null, match)
        resolve(match);
      })
    })
  },

  compareForgotpasswordOTP: function(otp, user, cb = () => {}) {
    bcrypt.compare(otp, user.encryptedForgotPasswordOTP, function(err, match) {
      return new Promise(function(resolve, reject) {
        if (err) {
          cb(err);
          return reject(err);
        }
        cb(null, match)
        resolve(match);
      })
    })
  },
  compareEmailVerificationOTP: function(otp, user, cb = () => {}) {
    console.log("otp,user:::::::::::::::::::::::     ",otp,user)
    bcrypt.compare(otp, user.encryptedEmailVerificationOTP, function(err, match) {
      return new Promise(function(resolve, reject) {
        if (err) {
          console.log("User Controller::::::::"+err);
          cb(err);
          return reject(err);
        }
        cb(null, match)
        resolve(match);
      })
    })
  },
  compareEmailVerificationOTPForSpendingPassword: function(otp, user, cb = () => {}) {
    bcrypt.compare(otp, user.encryptedForgotSpendingPasswordOTP, function(err, match) {
      return new Promise(function(resolve, reject) {
        if (err) {
          cb(err);
          return reject(err);
        }
        cb(null, match)
        resolve(match);
      })
    })
  }
};
