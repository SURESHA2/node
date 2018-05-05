var BigNumber = require('bignumber.js');
var BigNumber = require('bignumber.js');
var nodemailer = require('nodemailer');
var bitcoinBCH = require('bitcoin');
var clientBCH = new bitcoinBCH.Client({
  host: sails.config.company.clientBCHhost,
  port: sails.config.company.clientBCHport,
  user: sails.config.company.clientBCHuser,
  pass: sails.config.company.clientBCHpass
});
const COMPANYACCOUNTBCH = sails.config.common.COMPANYACCOUNTBCH;
const LABELPREFIX = sails.config.common.LABELPREFIX;
var transactionFeeBCH = sails.config.common.txFeeBCH;
const CONFIRMATIONOFTXBCH = sails.config.common.CONFIRMATIONOFTXBCH;
var transporter = nodemailer.createTransport({
  service: sails.config.common.supportEmailIdService,
  auth: {
    user: sails.config.common.supportEmailId,
    pass: sails.config.common.supportEmailIdpass
  }
});
var moment = require('moment');
module.exports = {
  getNewBCHAddress: function(req, res) {
    var userMailId = req.body.email;
    if (userMailId=="") {
      return res.json({
        "message": "Can't be emptyjnjj!!!",
        statusCode: 400
      });
    }
    User.findOne({
      email: userMailId
    }).exec(function(err, user) {
      if (err) {
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
      if (user.isBCHAddress) {
        return res.json({
          "message": "Address already exist!!",
          statusCode: 401
        });
      }
      var labelWithPrefix = LABELPREFIX + userMailId;
      console.log("labelWithPrefix :: " + labelWithPrefix);
      clientBCH.cmd('getnewaddress', labelWithPrefix, function(err, address) {
        if (err) {
          console.log(err);
          return res.json({
            "message": "Failed to get new address from BCH server",
            statusCode: 400
          });
        }
        console.log('BCH address generated', address);
        if (!user.isBCHAddress) {
          User.update({
            email: userMailId
          }, {
            isBCHAddress: true,

            userBCHAddress: address
          }).exec(function afterwards(err, updated) {

            if (err) {
              console.log("asdfasdf" + JSON.stringify(err));
              return res.json({
                "message": "Failed to update new address in database",
                statusCode: 401
              });
            }
            return res.json({
              message: "Address created successfully.",
              newaddress: address,
              statusCode: 200
            });
          });
        }
      });
    });
  },
  getBalBCH: function(req, res, next) {
    console.log("Enter into getBalBCH::: ");
    var userMailId = req.body.userMailId;
    if (!userMailId) {
      console.log("Can't be empty!!! by user.....");
      return res.json({
        "message": "Can't be empty!!!",
        statusCode: 400
      });
    }
    User.findOne({
      email: userMailId
    }).populateAll().exec(function(err, user) {
      if (err) {
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
      var labelWithPrefix = LABELPREFIX + userMailId;
      console.log("labelWithPrefix :: " + labelWithPrefix);
      clientBCH.cmd(
        'getbalance',
        labelWithPrefix,
        function(err, userBCHbalanceFromServer, resHeaders) {
          if (err) {
            console.log("Error from sendFromBCHAccount:: ");
            if (err.code && err.code == "ECONNREFUSED") {
              return res.json({
                "message": "BCH Server Refuse to connect App getBalance",
                statusCode: 400
              });
            }
            if (err.code && err.code < 0) {
              return res.json({
                "message": "Problem in BCH server getBalance",
                statusCode: 400
              });
            }
            return res.json({
              "message": "Error in BCH Server getBalance",
              statusCode: 400
            });
          }
          return res.json({
            "balance": userBCHbalanceFromServer,
            statusCode: 200
          });

        });
    });
  },
  sendBCH: function(req, res, next) {
    console.log("Enter into sendBCH");
    var userEmailAddress = req.body.userMailId;
    var userBCHAmountToSend = req.body.amount;
    var userReceiverBCHAddress = req.body.recieverBCHCoinAddress;
    var userSpendingPassword = req.body.spendingPassword;
    var miniBCHAmountSentByUser = 0.001;
    if (!userEmailAddress || !userBCHAmountToSend || !userReceiverBCHAddress ||
      !userSpendingPassword) {
      console.log("Can't be empty!!! by user ");
      return res.json({
        "message": "Can't be empty!!!",
        statusCode: 400
      });
    }
    // if (miniBCHAmountSentByUser.greaterThanOrEqualTo(userBCHAmountToSend)) {
    //   console.log("Sending amount is not less then " + miniBCHAmountSentByUser);
    //   return res.json({
    //     "message": "Sending amount BCH is not less then " + miniBCHAmountSentByUser,
    //     statusCode: 400
    //   });
    // }
    User.findOne({
      email: userEmailAddress
    }).exec(function(err, userDetails) {
      if (err) {
        return res.json({
          "message": "Error to find user",
          statusCode: 401
        });
      }
      if (!userDetails) {
        return res.json({
          "message": "Invalid email!",
          statusCode: 401
        });
      } else {
        console.log(JSON.stringify(userDetails));
        User.compareSpendingpassword(userSpendingPassword, userDetails,
          function(err, valid) {
            if (err) {
              console.log("Error To compare password !!!");
              return res.json({
                "message": err,
                statusCode: 401
              });
            }
            if (!valid) {
              console.log("Invalid transactionpassword !!!");
              return res.json({
                "message": 'Enter valid transaction password',
                statusCode: 401
              });
            } else {
              console.log("Valid transcation password !!!");
              var BCHBalanceInDB = userDetails.BCHbalance;

              console.log("Enter Before If ");

              if (userBCHAmountToSend<=0.001) {
                return res.json({
                  "message": "Insufficient balance!!",
                  statusCode: 400
                });
              } else {
                console.log("Enter info else " + transactionFeeBCH);
                var transactionFeeOfBCH = transactionFeeBCH;
                var netamountToSend = userBCHAmountToSend-transactionFeeOfBCH;
                console.log("clientBCH netamountToSend :: " + netamountToSend);
                var labelWithPrefix = LABELPREFIX + userEmailAddress;

                clientBCH.cmd('sendfrom', labelWithPrefix , userReceiverBCHAddress, parseFloat(netamountToSend),
                  CONFIRMATIONOFTXBCH, userReceiverBCHAddress, userReceiverBCHAddress,
                  function(err, TransactionDetails, resHeaders) {
                    if (err) {
                      console.log("Error from sendFromBCHAccount:: " + err);
                      if (err.code && err.code == "ECONNREFUSED") {
                        return res.json({
                          "message": "BCH Server Refuse to connect App",
                          statusCode: 400
                        });
                      }
                      if (err.code && err.code == -5) {
                        return res.json({
                          "message": "Invalid BCH Address",
                          statusCode: 400
                        });
                      }
                      if (err.code && err.code == -6) {
                        return res.json({
                          "message": "Account has Insufficient funds",
                          statusCode: 400
                        });
                      }
                      if (err.code && err.code < 0) {
                        return res.json({
                          "message": "Problem in BCH server",
                          statusCode: 400
                        });
                      }
                      return res.json({
                        "message": "Error in BCH Server send",
                        statusCode: 400
                      });
                    }
                    console.log('TransactionDetails :', TransactionDetails);
                    var updateBCHAmountInDB = BCHBalanceInDB-userBCHAmountToSend;
                    console.log("updateBCHAmountInDB ::: " + updateBCHAmountInDB);
                    return res.json({
                      "message": "transaction completed",
                      statusCode: 200
                    });
                    // User.update({
                    //   email: userEmailAddress
                    // }, {
                    //   BCHbalance: updateBCHAmountInDB
                    // }).exec(function afterwards(err, updated) {
                    //   if (err) {
                    //     return res.json({
                    //       "message": "Error to update in DB",
                    //       statusCode: 400
                    //     });
                    //   }
                    //   console.log("saveTransactionDeails : " + JSON.stringify(saveTransactionDeails));
                    //   // var saveTransactionDeails = {
                    //   //   amount: parseFloat(userBCHAmountToSend),
                    //   //   actionName: TRANSACTION_ACTION_WITHDRAW_NAME,
                    //   //   actionId: TRANSACTION_ACTION_WITHDRAW_ID,
                    //   //   address: userReceiverBCHAddress,
                    //   //   currencyName: CURRENCY_NAME_BCH,
                    //   //   txid: TransactionDetails,
                    //   //   networkFee: parseFloat(transactionFeeOfBCH),
                    //   //   transationowner: userDetails.id,
                    //   // }
                    //   // Transation.create(saveTransactionDeails).exec(function(err, finn) {
                    //   //   if (err) {
                    //   //     console.log(err);
                    //   //     return res.json({
                    //   //       "message": "Error to create Transaction!",
                    //   //       statusCode: 400
                    //   //     });
                    //   //   }
                    //   //
                    //   //   var mailOptions = {
                    //   //     from: sails.config.common.supportEmailId,
                    //   //     to: userEmailAddress,
                    //   //     subject: 'Transaction successfully done !!!',
                    //   //     html: `
                    //   //       <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                    //   //       <html xmlns="http://www.w3.org/1999/xhtml" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                    //   //       <head>
                    //   //         <meta name="viewport" content="width=device-width" />
                    //   //         <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                    //   //         <title>Actionable emails e.g. reset password</title>
                    //   //
                    //   //
                    //   //         <style type="text/css">
                    //   //           img {
                    //   //             max-width: 100%;
                    //   //           }
                    //   //
                    //   //           body {
                    //   //             -webkit-font-smoothing: antialiased;
                    //   //             -webkit-text-size-adjust: none;
                    //   //             width: 100% !important;
                    //   //             height: 100%;
                    //   //             line-height: 1.6em;
                    //   //           }
                    //   //
                    //   //           body {
                    //   //             background-color: #f6f6f6;
                    //   //           }
                    //   //           @media only screen and (max-width: 640px) {
                    //   //             body {
                    //   //               padding: 0 !important;
                    //   //             }
                    //   //             h1 {
                    //   //               font-weight: 800 !important;
                    //   //               margin: 20px 0 5px !important;
                    //   //             }
                    //   //             h2 {
                    //   //               font-weight: 800 !important;
                    //   //               margin: 20px 0 5px !important;
                    //   //             }
                    //   //             h3 {
                    //   //               font-weight: 800 !important;
                    //   //               margin: 20px 0 5px !important;
                    //   //             }
                    //   //             h4 {
                    //   //               font-weight: 800 !important;
                    //   //               margin: 20px 0 5px !important;
                    //   //             }
                    //   //             h1 {
                    //   //               font-size: 22px !important;
                    //   //             }
                    //   //             h2 {
                    //   //               font-size: 18px !important;
                    //   //             }
                    //   //             h3 {
                    //   //               font-size: 16px !important;
                    //   //             }
                    //   //             .container {
                    //   //               padding: 0 !important;
                    //   //               width: 100% !important;
                    //   //             }
                    //   //             .content {
                    //   //               padding: 0 !important;
                    //   //             }
                    //   //             .content-wrap {
                    //   //               padding: 10px !important;
                    //   //             }
                    //   //             .invoice {
                    //   //               width: 100% !important;
                    //   //             }
                    //   //           }
                    //   //         </style>
                    //   //       </head>
                    //   //
                    //   //       <body itemscope itemtype="http://schema.org/EmailMessage" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; width: 100% !important; height: 100%; line-height: 1.6em; background-color: #f6f6f6; margin: 0;"
                    //   //         bgcolor="#f6f6f6">
                    //   //
                    //   //         <table class="body-wrap" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; width: 100%; background-color: #f6f6f6; margin: 0;" bgcolor="#f6f6f6">
                    //   //           <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                    //   //             <td style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0;" valign="top"></td>
                    //   //             <td class="container" width="600" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; display: block !important; max-width: 600px !important; clear: both !important; margin: 0 auto;"
                    //   //               valign="top">
                    //   //               <div class="content" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; max-width: 600px; display: block; margin: 0 auto; padding: 20px;">
                    //   //                 <table class="main" width="100%" cellpadding="0" cellspacing="0" itemprop="action" itemscope itemtype="http://schema.org/ConfirmAction" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; border-radius: 3px; background-color: #fff; margin: 0; border: 1px solid #e9e9e9;"
                    //   //                   bgcolor="#fff">
                    //   //                   <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                    //   //                     <td class="content-wrap" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 20px;" valign="top">
                    //   //                       <meta itemprop="name" content="Confirm Email" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />
                    //   //                       <table width="100%" cellpadding="0" cellspacing="0" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                    //   //                         <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                    //   //                           <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                    //   //
                    //   //                           </td>
                    //   //                         </tr>
                    //   //                         <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                    //   //                           <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                    //   //                             Dear user,
                    //   //                           </td>
                    //   //                         </tr>
                    //   //                         <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                    //   //                           <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                    //   //                           Your transcation has been  done successfully
                    //   //                           </td>
                    //   //                         </tr>
                    //   //                         <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                    //   //                           <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                    //   //                           Thanks
                    //   //                           </td>
                    //   //                         </tr>
                    //   //                         <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                    //   //                           <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                    //   //                             The mmtcexex Team
                    //   //                           </td>
                    //   //                         </tr>
                    //   //
                    //   //                       </table>
                    //   //                     </td>
                    //   //                   </tr>
                    //   //                 </table>
                    //   //                 <div class="footer" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; width: 100%; clear: both; color: #999; margin: 0; padding: 20px;">
                    //   //                   <table width="100%" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                    //   //                     <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                    //   //                       <td class="aligncenter content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 12px; vertical-align: top; color: #999; text-align: center; margin: 0; padding: 0 0 20px;" align="center"
                    //   //                         valign="top">Follow <a href="http://twitter.com/mmtcexex" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 12px; color: #999; text-decoration: underline; margin: 0;">@mmtcexex</a> on Twitter.</td>
                    //   //                     </tr>
                    //   //                   </table>
                    //   //                 </div>
                    //   //               </div>
                    //   //             </td>
                    //   //             <td style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0;" valign="top"></td>
                    //   //           </tr>
                    //   //         </table>
                    //   //       </body>
                    //   //
                    //   //       </html>`
                    //   //   };
                    //   //
                    //   //   transporter.sendMail(mailOptions, function(error, info) {
                    //   //     if (error) {
                    //   //       console.log(error);
                    //   //     } else {
                    //   //       console.log('Email sent: ' + info.response);
                    //   //
                    //   //     }
                    //   //   });
                    //   //
                    //   //   User.findOne({
                    //   //       email: userEmailAddress
                    //   //     }).populateAll()
                    //   //     .exec(function(err, user) {
                    //   //       if (err) {
                    //   //         return res.json({
                    //   //           "message": "Error to find user",
                    //   //           statusCode: 401
                    //   //         });
                    //   //       }
                    //   //       if (!user) {
                    //   //         return res.json({
                    //   //           "message": "Invalid email!",
                    //   //           statusCode: 401
                    //   //         });
                    //   //       }
                    //   //       console.log("Return user details after sending amount!!");
                    //   //       res.json({
                    //   //         user: user,
                    //   //         statusCode: 200
                    //   //       });
                    //   //     });
                    //   // });
                    // });
                  });
              }
            }
          });
      }
    });
  },
  getTxsListBCH: function(req, res, next) {
    console.log("Enter into getTxsListBCH::: ");
    var userMailId = req.body.userMailId;
    if (!userMailId) {
      console.log("Can't be empty!!! by user.....");
      return res.json({
        "message": "Can't be empty!!!",
        statusCode: 400
      });
    }
    User.findOne({
      email: userMailId
    }).exec(function(err, user) {
      if (err) {
        console.log("Error to find user !!!");
        return res.json({
          "message": "Error to find user",
          statusCode: 401
        });
      }
      if (!user) {
        console.log("Invalid Email !!!");
        return res.json({
          "message": "Invalid email!",
          statusCode: 401
        });
      }
      var labelWithPrefix = LABELPREFIX + userMailId;
      console.log("labelWithPrefix :: " + labelWithPrefix);
      clientBCH.cmd(
        'listtransactions',
        labelWithPrefix,
        function(err, transactionList) {
          if (err) {
            console.log("Error from sendFromBCHAccount:: ");
            if (err.code && err.code == "ECONNREFUSED") {
              return res.json({
                "message": "BCH Server Refuse to connect App",
                statusCode: 400
              });
            }
            if (err.code && err.code < 0) {
              return res.json({
                "message": "Problem in BCH server",
                statusCode: 400
              });
            }
            return res.json({
              "message": "Error in BCH Server",
              statusCode: 400
            });
          }
          console.log("Return transactionList List !! ");
          return res.json({
            "tx": transactionList,
            statusCode: 200
          });
        });
    });
  },
  getAddressList: function(req, res, next) {
    console.log("Enter into getAddressList::: ");
    var userMailId = req.body.userMailId;
    if (!userMailId) {
      console.log("Can't be empty!!! by user.....");
      return res.json({
        "message": "Can't be empty!!!",
        statusCode: 400
      });
    }
    User.findOne({
      email: userMailId
    }).exec(function(err, user) {
      if (err) {
        console.log("Error to find user !!!");
        return res.json({
          "message": "Error to find user",
          statusCode: 401
        });
      }
      if (!user) {
        console.log("Invalid Email !!!");
        return res.json({
          "message": "Invalid email!",
          statusCode: 401
        });
      }
      var labelWithPrefix = LABELPREFIX + userMailId;
      console.log("labelWithPrefix :: " + labelWithPrefix);
      clientBCH.cmd(
        'getaddressesbyaccount',
        labelWithPrefix,
        function(err, getAddressList) {
          if (err) {
            console.log(err);
            console.log("Error from sendFromBCHAccount:: ");
            if (err.code && err.code == "ECONNREFUSED") {
              return res.json({
                "message": "BCH Server Refuse to connect App",
                statusCode: 400
              });
            }
            if (err.code && err.code < 0) {
              return res.json({
                "message": "Problem in BCH server",
                statusCode: 400
              });
            }
            return res.json({
              "message": "Error in BCH Server",
              statusCode: 400
            });
          }
          console.log("Return getAddressList List !! ");
          return res.json({
            "AddressList": getAddressList,
            statusCode: 200
          });
        });
    });
  }


};
