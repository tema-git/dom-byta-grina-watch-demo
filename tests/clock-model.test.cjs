const test = require('node:test');
const assert = require('node:assert/strict');
const {createClockModel} = require('../clock-model.js');
const near = (a,b) => assert.ok(Math.abs(a-b)<1e-7, `${a} differs from ${b}`);

test('one clockwise minute revolution advances one hour, continuously', () => {
  const clock = createClockModel(610);
  for(let angle=60; angle<=420; angle+=3) clock.turnMinute(angle);
  assert.equal(clock.read().label,'11:10');
  near(clock.read().hourAngle,335); near(clock.read().minuteAngle,60);
});
test('one counterclockwise revolution reverses one hour', () => {
  const clock = createClockModel(610);
  for(let angle=60; angle>=-300; angle-=3) clock.turnMinute(angle);
  assert.equal(clock.read().label,'09:10'); near(clock.read().hourAngle,275);
});
test('multiple revolutions retain carry through twelve', () => {
  const clock = createClockModel(610);
  for(let angle=60;angle<=780;angle+=6) clock.turnMinute(angle);
  assert.equal(clock.read().label,'12:10');
  for(let angle=774;angle>=-300;angle-=6) clock.turnMinute(angle);
  assert.equal(clock.read().label,'09:10');
});
test('59 to 00 carries, and 00 to 59 borrows, including keyboard', () => {
  const clock=createClockModel(719);
  clock.turnMinute(354);clock.turnMinute(0);assert.equal(clock.read().label,'12:00');
  clock.turnMinute(354);assert.equal(clock.read().label,'11:59');
  clock.step(1,'minute');assert.equal(clock.read().label,'12:00');
  clock.step(-1,'minute');assert.equal(clock.read().label,'11:59');
});
test('sub-minute movements accumulate without losing fractional progress', () => {
  const clock=createClockModel(610);
  for(let i=0;i<=3600;i++)clock.turnMinute(60+i*.1);
  assert.equal(clock.read().label,'11:10');near(clock.read().hourAngle,335);
});
test('hour control retains the minute phase', () => {
  const clock=createClockModel(650);
  clock.turnHour(90);assert.equal(clock.read().label,'02:50');near(clock.read().minuteAngle,300);
  clock.step(1,'hour');assert.equal(clock.read().label,'03:50');
});
test('re-entry uses nearest phase without replaying an earlier gesture', () => {
  const clock=createClockModel(659);
  clock.turnMinute(354);clock.endGesture();clock.turnMinute(0);
  assert.equal(clock.read().label,'11:00');
  clock.endGesture();clock.turnMinute(6);assert.equal(clock.read().label,'11:01');
});
test('home and reset clear accumulated gesture state', () => {
  const clock=createClockModel(610);
  clock.turnMinute(180);clock.home('minute');assert.equal(clock.read().label,'10:00');
  clock.home('hour');assert.equal(clock.read().label,'12:00');
  clock.reset();assert.equal(clock.read().label,'10:10');
  clock.turnMinute(66);assert.equal(clock.read().label,'10:11');
});

test('hour increments preserve fractional minute position', () => {
  const clock=createClockModel(610.4);
  clock.step(1,'hour');near(clock.read().minuteAngle,62.4);
  assert.equal(clock.read().label,'11:10');
});
test('fractional time display and Home agree at an hour boundary', () => {
  const clock=createClockModel(659.7);
  assert.equal(clock.read().label,'10:59');clock.home('minute');
  assert.equal(clock.read().label,'10:00');clock.reset();clock.home('hour');
  assert.equal(clock.read().label,'12:59');
});
