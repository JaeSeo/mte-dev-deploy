const mongoose = require('mongoose');
const Schedule = require('../models/schedule');

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region 
AWS.config.update({region: 'ap-northeast-2'});
AWS.config.getCredentials();
// AWS Credentials
// var credentials = new AWS.SharedIniFileCredentials({profile: 'mte'});
// AWS.config.credentials = credentials;
// AWS_SDK_LOAD_CONFIG="true";
// AWS_PROFILE="assume-role-profile";

// var sts = new AWS.STS();
// sts.assumeRole({
//   RoleArn: 'arn:aws:iam::612159056927:role/CodeDeployDemo-EC2-Instance-Profile',
//   RoleSessionName: 'awssdk'
// }, function(err, data) {
//   if (err) { // an error occurred
//     console.log('Cannot assume role');
//     console.log(err, err.stack);
//   } else { // successful response
//     AWS.config.update({
//       accessKeyId: data.Credentials.AccessKeyId,
//       secretAccessKey: data.Credentials.SecretAccessKey,
//       sessionToken: data.Credentials.SessionToken
//     });
//   }
// });

//ses
var params = {
  Destination: { 
    ToAddresses: [
      'wogus1264@gmail.com',
    ]
  },
  Message: {
    Body: {
      Html: {
       Charset: "UTF-8",
       Data: "New MTE meeting has been scheduled!"
      }
     },
     Subject: {
      Charset: 'UTF-8',
      Data: 'Meet The Expert'
     }
    },
  Source: 'jaehyes@amazon.com',
  ReplyToAddresses: [
     'jaehyes@amazon.com',
  ],
};

//js date object
const date = new Date();
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "July", "Aug", "Sep", "Oct", "Nov", "Dec"];
let monthNum = date.getMonth();
let month = monthNames[monthNum];//this month
let year = date.getFullYear();//this year

let firstDate = new Date(year, monthNum, 1);
let firstDay = firstDate.getDay();
let lastDate = new Date(year, monthNum + 1, 0); 
let last = lastDate.getDate();

let lastMonthId = monthNum;
let thisMonthId = monthNum + 1;
let nextMonthId = monthNum + 2;

if (lastMonthId == 0) {
  lastMonthId = 12;
}

if (nextMonthId == 13) {
  nextMonthId = 1;
}

exports.getIndex = (req, res, next) => {
  if (req.query.preMonth) {
    monthNum = +req.query.preMonth - 1;
    month = monthNames[monthNum];
    //Update start and last day
    firstDate = new Date(year, monthNum, 1);//이 달 객체(첫날)
    firstDay = firstDate.getDay();//이달 요일
    lastDate = new Date(year, monthNum + 1 , 0);//이 달 마지막날
    last = lastDate.getDate();
          
    if (monthNum < 0) {
      monthNum = 11
      month = monthNames[monthNum];
      year--;
      firstDate = new Date(year, monthNum, 1);//이 달 객체(첫날)
      firstDay = firstDate.getDay();//이달 요일
      lastDate = new Date(year, monthNum + 1 , 0);//이 달 마지막날
      last = lastDate.getDate();
    }
  }
  if (req.query.postMonth) {
    monthNum = +req.query.postMonth + 1;
    month = monthNames[monthNum];
    //Update start and last day
    firstDate = new Date(year, monthNum, 1);
    firstDay = firstDate.getDay();
    lastDate = new Date(year, monthNum + 1, 0);
    last = lastDate.getDate(); 

    if (monthNum > 11) {
      monthNum = 0
      month = monthNames[monthNum];
      year++;
      firstDate = new Date(year, monthNum, 1);//이 달 객체(첫날)
      firstDay = firstDate.getDay();//이달 요일
      lastDate = new Date(year, monthNum + 1 , 0);//이 달 마지막날
      last = lastDate.getDate();        
    }
  }  
  //query to mongoose
  Schedule.find({$and: [{monthId: `${monthNum + 1}`}, {yearId: `${year}`}]})
  .then(schedules => {
    console.log(schedules);
    //date calculation when hitting next or previous month button.
    //rendering
    res.render('index', {
      schedules: schedules,
      firstDay: firstDay,
      lastDate: last,
      month: month,
      monthNum: monthNum,
      year: year
    });
  })
  .catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
};

exports.postSchedule = (req, res, next) => {

  const cellId = req.body.cellId;
  const sa = req.body.sa;
  const sales = req.body.sales;
  const account = req.body.account;
  const startTime = req.body.startTime;
  const endTime = req.body.endTime;
  const room = req.body.room;
  const monthId = req.body.monthId;
  const yearId = req.body.yearId;
  const keyValue = req.body.keyValue;//s3 object key
  const extension = req.body.extension;

  const schedule = new Schedule({
    cellId: cellId,
    monthId: monthId,
    yearId: yearId,
    sa: sa,
    sales: sales,
    account: account,
    startTime: startTime,
    endTime: endTime,
    room: room,
    keyValue: keyValue,
    extension: extension
  });

  schedule
    .save()
    .then(result => {
      // console.log(result);
      console.log('Created Schedule');
      res.redirect('/');
      next();
    })
    .catch(err => {
      res.render('error');
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });

  AWS.config.update({region: 'us-east-1'});
  var sendPromise = new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(params).promise();

  // Handle promise's fulfilled/rejected states
  // activate below for SES
  // sendPromise.then(
  //   function(data) {
  //     console.log(data.MessageId);
  //   }).catch(
  //     function(err) {
  //     console.error(err, err.stack);
  //   });  
};

exports.postDelete = (req, res, next) => {
  const cellId = req.body.cellId;

  Schedule.findOne({ cellId: cellId })
  .then(scheduleInfo => {
    if (scheduleInfo.keyValue) {
      console.log(scheduleInfo);
      const keyValue = scheduleInfo.keyValue;
      var s3 = new AWS.S3();
      var params = {Bucket: 'meet-the-expert-dev', Key: keyValue};
      s3.deleteObject(params, function(err, data) {
        if (err) console.log(err, err.stack);  // error
        else console.log('Object deleted.');                 // deleted
      });
    }
  })

  Schedule.deleteOne({ cellId: cellId })
    .then(() => {
      console.log('DESTROYED PRODUCT');
      res.redirect('/');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
