(function (root) {
  'use strict';
  const wrap = (value, period) => ((value % period) + period) % period;
  const shortestTurn = (to, from) => wrap(to - from + 180, 360) - 180;

  // Both hands derive from one continuous time. Crossing twelve therefore
  // carries the hour forward (or backward) instead of resetting its base.
  function createClockModel(initialMinutes = 610) {
    let time = wrap(initialMinutes, 720), previousMinuteAngle = null;
    function read() {
      const shown = wrap(Math.floor(time + 1e-8), 720);
      const hour = Math.floor(shown / 60) || 12, minute = shown % 60;
      return {
        hour, minute,
        label: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        minuteAngle: wrap(time, 60) * 6,
        hourAngle: time / 2
      };
    }
    function endGesture() { previousMinuteAngle = null; }
    return {
      read,
      endGesture,
      turnMinute(angle) {
        const target = wrap(angle, 360);
        const from = previousMinuteAngle ?? wrap(time, 60) * 6;
        time = wrap(time + shortestTurn(target, from) / 6, 720);
        previousMinuteAngle = target;
        return read();
      },
      turnHour(angle) {
        const minutes = wrap(time, 60);
        const hour = wrap(Math.round((wrap(angle, 360) - minutes / 2) / 30), 12);
        time = hour * 60 + minutes;
        endGesture();
        return read();
      },
      step(delta, part) {
        time = wrap(part === 'hour' ? time + delta * 60 : Math.floor(time + 1e-8) + delta, 720);
        endGesture();
        return read();
      },
      home(part) {
        time = part === 'hour' ? wrap(time, 60) : wrap(Math.floor((time + 1e-8) / 60) * 60, 720);
        endGesture();
        return read();
      },
      reset() { time = wrap(initialMinutes, 720); endGesture(); return read(); }
    };
  }
  if (typeof module === 'object' && module.exports) module.exports = {createClockModel};
  else root.createClockModel = createClockModel;
})(typeof window === 'undefined' ? {} : window);
