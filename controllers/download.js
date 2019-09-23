const mongoose = require('mongoose');
const Schedule = require('../models/schedule');

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region 
AWS.config.update({region: 'ap-northeast-2'});
// var credentials = new AWS.SharedIniFileCredentials({profile: 'mte'});
// AWS.config.credentials = credentials;

exports.download = (req, res, next) => {
    const cellId = req.body.cellId;
    if (!cellId) {
        res.render('noFile');
    }

    console.log(cellId);
    Schedule.findOne({ cellId: `${cellId}` })
    .then(scheduleInfo => {
      if (!scheduleInfo.keyValue) {
          res.render('noFile');
      }

      console.log(scheduleInfo);
      const keyValue = scheduleInfo.keyValue;
      res.setHeader('Content-disposition', `attachment; filename=MeetTheExpert${scheduleInfo.extension}`);
      var s3 = new AWS.S3();
      var params = {Bucket: 'meet-the-expert-dev', Key: `${keyValue}`};
      var stream = s3.getObject(params).createReadStream(keyValue);
      stream.pipe(res);
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};