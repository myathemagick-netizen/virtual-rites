/* Virtual Rites — cosmological timing
   Moon phase (mean synodic month), planetary day and hour (Chaldean order, unequal hours
   from sunrise and sunset), tropical sun sign by date, and the Wheel of the Year.
   Without a saved location, hours are approximated from 6:00 and 18:00. */
(function (VR) {
'use strict';
const PLANETS = {
  Sun: { sym: '☉', color: '#ffc53d' }, Moon: { sym: '☽', color: '#c9d4ff' }, Mars: { sym: '♂', color: '#ff3b2f' }, Mercury: { sym: '☿', color: '#ff9a3d' },
  Jupiter: { sym: '♃', color: '#6a7bff' }, Venus: { sym: '♀', color: '#3fe08a' }, Saturn: { sym: '♄', color: '#7a5ab0' } };
const DAY_RULERS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const CHALDEAN = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'];

function moon(date) {
  const syn = 29.530588853, ref = Date.UTC(2000, 0, 6, 18, 14), age = ((((date - ref) / 864e5) % syn) + syn) % syn, f = age / syn;
  const names = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
  const icons = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'], i = Math.floor(f * 8 + .5) % 8;
  return { age, fraction: f, illumination: (1 - Math.cos(f * 2 * Math.PI)) / 2, name: names[i], icon: icons[i], waxing: f < .5 };
}
/* Sunrise equation. Returns {rise, set} as Dates for the local calendar day containing `date`, or null near the poles. */
function sunTimes(date, lat, lon) {
  const r = Math.PI / 180, d = new Date(date); d.setHours(12, 0, 0, 0);
  const Jd = d.getTime() / 864e5 + 2440587.5, n = Math.round(Jd - 2451545.0008 + lon / 360), Js = n - lon / 360;
  const M = (357.5291 + .98560028 * Js) % 360, C = 1.9148 * Math.sin(M * r) + .02 * Math.sin(2 * M * r) + .0003 * Math.sin(3 * M * r);
  const L = (M + C + 180 + 102.9372) % 360, Jt = 2451545 + Js + .0053 * Math.sin(M * r) - .0069 * Math.sin(2 * L * r);
  const sd = Math.sin(L * r) * Math.sin(23.4397 * r), cd = Math.cos(Math.asin(sd));
  const cw = (Math.sin(-.833 * r) - Math.sin(lat * r) * sd) / (Math.cos(lat * r) * cd); if (Math.abs(cw) > 1) return null;
  const w = Math.acos(cw) / r, toDate = J => new Date((J - 2440587.5) * 864e5);
  return { rise: toDate(Jt - w / 360), set: toDate(Jt + w / 360) };
}
function approxTimes(date) { const a = new Date(date), b = new Date(date); a.setHours(6, 0, 0, 0); b.setHours(18, 0, 0, 0); return { rise: a, set: b }; }
function planetaryHour(now, loc) {
  const times = d => (loc && sunTimes(d, loc.lat, loc.lon)) || approxTimes(d);
  const approx = !loc || !sunTimes(now, loc.lat, loc.lon);
  const day = new Date(now), today = times(day);
  let start, end, isDay, rulerDate;
  if (now < today.rise) { const y = new Date(now); y.setDate(y.getDate() - 1); start = times(y).set; end = today.rise; isDay = false; rulerDate = y; }
  else if (now >= today.set) { const t = new Date(now); t.setDate(t.getDate() + 1); start = today.set; end = times(t).rise; isDay = false; rulerDate = day; }
  else { start = today.rise; end = today.set; isDay = true; rulerDate = day; }
  const len = (end - start) / 12, idx = Math.min(11, Math.max(0, Math.floor((now - start) / len)));
  const dayRuler = DAY_RULERS[rulerDate.getDay()], hourRuler = CHALDEAN[(CHALDEAN.indexOf(dayRuler) + (isDay ? 0 : 12) + idx) % 7];
  return { dayRuler, dayName: DAY_NAMES[rulerDate.getDay()], hourRuler, hourNumber: idx + 1, isDay, approx, endsAt: new Date(start.getTime() + len * (idx + 1)) };
}
const SIGNS = [['Capricorn', 1, 1], ['Aquarius', 1, 20], ['Pisces', 2, 19], ['Aries', 3, 21], ['Taurus', 4, 20], ['Gemini', 5, 21], ['Cancer', 6, 21], ['Leo', 7, 23],
  ['Virgo', 8, 23], ['Libra', 9, 23], ['Scorpio', 10, 23], ['Sagittarius', 11, 22], ['Capricorn', 12, 22]];
function sunSign(d) { const m = d.getMonth() + 1, day = d.getDate(); let s = 'Capricorn'; SIGNS.forEach(([n, mm, dd]) => { if (m > mm || (m === mm && day >= dd)) s = n; }); return s; }
const FESTIVALS = [['Imbolc', 2, 1], ['Ostara', 3, 20], ['Beltane', 5, 1], ['Litha', 6, 21], ['Lughnasadh', 8, 1], ['Mabon', 9, 22], ['Samhain', 10, 31], ['Yule', 12, 21]];
function nextFestival(now) {
  const t0 = new Date(now); t0.setHours(0, 0, 0, 0);
  for (let y = t0.getFullYear(); y <= t0.getFullYear() + 1; y++) for (const [n, m, d] of FESTIVALS) { const f = new Date(y, m - 1, d); const days = Math.round((f - t0) / 864e5);
    if (days >= 0) return { name: n, days, text: days === 0 ? `${n} is today` : days === 1 ? `${n} is tomorrow` : `${n} in ${days} days` }; }
  return { name: '', days: 0, text: '' };
}
function summary(now = new Date(), loc = VR.settings.location) {
  const m = moon(now), h = planetaryHour(now, loc), f = nextFestival(now);
  return { moon: { name: m.name, icon: m.icon, illumination: Math.round(m.illumination * 100) }, dayName: h.dayName, dayRuler: h.dayRuler,
    hourRuler: h.hourRuler, hourNumber: h.hourNumber, isDay: h.isDay, approx: h.approx, hourColor: PLANETS[h.hourRuler].color, hourSym: PLANETS[h.hourRuler].sym,
    daySym: PLANETS[h.dayRuler].sym, sunSign: sunSign(now), festival: f.text, at: now.toISOString() };
}
VR.cosmos = { PLANETS, moon, sunTimes, planetaryHour, sunSign, nextFestival, summary };
})(window.VR);
