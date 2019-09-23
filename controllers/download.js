const mongoose = require('mongoose');
const Schedule = require('../models/schedule');

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region 
AWS.config.update({region: 'ap-northeast-2'});
// var credentials = new AWS.SharedIniFileCredentials({profile: 'mte'});
// AWS.config.credentials = credentials;
function getEC2Rolename(AWS){
  var promise = new Promise((resolve,reject)=>{
      
      var metadata = new AWS.MetadataService();
      
      metadata.request('/latest/meta-data/iam/security-credentials/',function(err,rolename){
          if(err) reject(err);
          console.log(rolename);            
          resolve(rolename);
      });
  });
      
  return promise;
};

function getEC2Credentials(AWS,rolename){
  var promise = new Promise((resolve,reject)=>{
      
      var metadata = new AWS.MetadataService();
      
      metadata.request('/latest/meta-data/iam/security-credentials/'+rolename,function(err,data){
          if(err) reject(err);   
          
          resolve(JSON.parse(data));            
      });
  });
      
  return promise;
};

getEC2Rolename(AWS)
.then((rolename)=>{
    return getEC2Credentials(AWS,rolename)
})
.then((credentials)=>{

    AWS.config.accessKeyId=credentials.AccessKeyId;
    AWS.config.secretAccessKey=credentials.SecretAccessKey;
    AWS.config.sessionToken = credentials.Token;
        
})
.catch((err)=>{
    console.log(err);
});
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