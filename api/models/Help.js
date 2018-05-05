var bcrypt = require('bcrypt');
module.exports = {
  schema: true,
  attributes: {
    subject: {
      type: "string",
      unique: true
    },
    message: {
      type: "string",
      defaultsTo: false
    },


    // encryptedPassword: {
    //   type: 'string'
    // },


  }
};
