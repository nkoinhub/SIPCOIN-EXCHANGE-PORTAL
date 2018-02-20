var c = new Date(new Date() + 243)
c.setDate(c.getDate() + 243)
var a = new Date();
var b = new Date('2018-03-17T21:10:30.672Z');

var schedule = require('node-schedule');

var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [0,6];
//rule.hour = [0,23];
//rule.minute = [0, new schedule.Range(0,59)];
//rule.second = new schedule.Range(0,59);

console.log(rule);

var j = schedule.scheduleJob(rule, function(){
	console.log("every minute, every hour, every day");
})


var k = schedule.scheduleJob({hour: 16, minute: 0, dayOfWeek: [0,1,2,3,4,5,6]}, function(){
  console.log('Time for tea!');
});
