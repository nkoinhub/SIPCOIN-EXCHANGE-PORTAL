var c = new Date(new Date() + 243)
c.setDate(c.getDate() + 243)
var a = new Date();
var b = new Date('2018-03-17T21:10:30.672Z');
var d = c;
var e = [];
e.push(new Date(c));
//console.log(a);
//console.log(b);
//console.log(c);

//console.log((b-a)/(1000 * 60 * 60 * 24))
console.log(d);
console.log(e);

e.push('hello');
e.push('brohter');

console.log(e);
