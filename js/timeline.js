// Turn a section's dated lists (<dl>: <dt>years</dt><dd>entry</dd>) into one
// vertical timeline plot: years to scale top to bottom, newest first, each
// span drawn as a bar, overlapping spans in side-by-side lanes, and a list of
// single years (degrees) as dots in a lane of their own on the left. Labels
// sit in a column to the right, pushed apart when they would collide and tied
// back to their mark with a connector. The <dl>s stay in the page as the
// fallback.
(function () {
  var now = new Date();
  var NOW = now.getFullYear() + now.getMonth() / 12;
  var SVG = 'http://www.w3.org/2000/svg';

  // Colour follows the employer, matched on the entry text; first match wins,
  // so the WashU catch-all goes last. Hues are Gruvbox light, assigned so every
  // pair that touches in the plot (side by side or end to end) passes the
  // dataviz validator: worst CVD ΔE 14.5, worst normal-vision ΔE 19.2.
  var EMPLOYERS = [
    ['California San Diego', 'UC San Diego', '#98971a'],
    ['Salk', 'Salk Institute', '#b16286'],
    ['Boeing', 'Boeing', '#076678'],
    ['Neurolutions', 'Neurolutions', '#b57614'],
    ['Lickenbrock', 'Lickenbrock', '#d65d0e'],
    ['Washington University', 'WashU', '#9d0006']
  ];
  function employer(text) {
    for (var k = 0; k < EMPLOYERS.length; k++) if (text.indexOf(EMPLOYERS[k][0]) >= 0) return EMPLOYERS[k];
    return [null, 'Other', '#6b6b70'];
  }

  function parse(dl) {
    var entries = [], cur = null;
    Array.prototype.forEach.call(dl.children, function (el) {
      if (el.tagName === 'DT') {
        var m = el.textContent.match(/(\d{4})(?:\s*[–-]+\s*(\d{4}|present))?/);
        if (!m) return;
        cur = {
          date: el.textContent.trim(),
          start: +m[1],
          end: m[2] ? (m[2] === 'present' ? NOW : +m[2]) : null,
          ongoing: m[2] === 'present',
          html: []
        };
        entries.push(cur);
      } else if (el.tagName === 'DD' && cur) {
        cur.html.push(el.innerHTML);
      }
    });
    // A list of single years is a list of milestones (degrees); a single year
    // among spans is a span lasting that year.
    var points = entries.every(function (e) { return e.end === null; });
    entries.forEach(function (e) {
      e.point = points;
      if (e.end === null) e.end = points ? e.start : e.start + 1;
      var who = employer(e.html.join(' '));
      e.org = who[1];
      e.color = who[2];
    });
    return entries;
  }

  // Split "<strong>Title</strong>, Department, Institution" into tagged
  // parts so the stylesheet can run them inline or stack and size each one.
  // The last comma part is the institution; any before it, the department.
  function parts(h) {
    var m = h.match(/^\s*<strong>(.*?)<\/strong>\s*,?\s*([\s\S]*)$/);
    if (!m) return h;
    var rest = m[2].trim().split(/,\s+/).filter(Boolean);
    var out = '<span class="tl-title">' + m[1] + '</span>';
    rest.forEach(function (p, k) {
      out += '<span class="tl-sep">, </span><span class="' + (k === rest.length - 1 ? 'tl-org' : 'tl-dept') + '">' + p + '</span>';
    });
    return out;
  }

  // Greedy interval colouring: each entry takes the first lane that is free.
  function assignLanes(entries) {
    var laneEnds = [];
    entries.slice()
      .sort(function (a, b) { return a.start - b.start || (b.end - b.start) - (a.end - a.start); })
      .forEach(function (e) {
        var lane = laneEnds.findIndex(function (end) { return end <= e.start; });
        if (lane < 0) { lane = laneEnds.length; laneEnds.push(0); }
        laneEnds[lane] = e.end;
        e.lane = lane;
      });
    return laneEnds.length;
  }

  function render(sec, yearPx) {
    var old = sec.querySelector(':scope > .tl-wrap');
    if (old) old.remove();

    var dls = Array.prototype.slice.call(sec.querySelectorAll(':scope > dl'));
    var entries = [].concat.apply([], dls.map(parse));
    if (!entries.length) return;
    var spans = entries.filter(function (e) { return !e.point; });
    var hasPoints = spans.length < entries.length;
    var lanes = assignLanes(spans) + (hasPoints ? 1 : 0);
    entries.forEach(function (e) { e.lane = e.point ? 0 : e.lane + (hasPoints ? 1 : 0); });

    var narrow = window.innerWidth < 600;
    yearPx = yearPx || (narrow ? 34 : 42);
    // Half a year of room around a dot, so it never sits on the plot's edge.
    var top = Math.ceil(Math.max.apply(null, entries.map(function (e) { return e.point ? e.start + 0.5 : e.end; })));
    var bottom = Math.floor(Math.min.apply(null, entries.map(function (e) { return e.point ? e.start - 0.5 : e.start; })));
    var y = function (t) { return (top - t) * yearPx; };
    var plotH = (top - bottom) * yearPx;

    var barW = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bar-w')) || 10;
    var axisW = 40, laneGap = 6;
    var entryGap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--entry-gap')) || (narrow ? 12 : 14);
    var lanesX = axisW + 10;
    var lanesW = lanes * barW + (lanes - 1) * laneGap;
    var labelsX = lanesX + lanesW + (narrow ? 20 : 36);

    var wrap = document.createElement('div');
    wrap.className = 'tl-wrap';
    sec.insertBefore(wrap, dls[0]);
    dls.forEach(function (dl) { dl.classList.add('tl-source'); });

    // Legend, in plot order (newest first), when more than one employer shows.
    var seen = [];
    entries.forEach(function (e) {
      if (!seen.some(function (o) { return o.org === e.org; })) seen.push(e);
    });
    // Dots mixed in with bars get their own legend entry.
    var mixed = hasPoints && spans.length > 0;
    if (seen.length > 1 || mixed) {
      var legend = document.createElement('ul');
      legend.className = 'tl-legend';
      legend.innerHTML = seen.map(function (e) {
        return '<li><span class="tl-swatch" style="--c:' + e.color + '"></span>' + e.org + '</li>';
      }).join('') + (mixed ? '<li><span class="tl-ring"></span>Degree</li>' : '');
      wrap.appendChild(legend);
    }

    var tl = document.createElement('div');
    tl.className = 'tl';
    wrap.appendChild(tl);

    var svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('class', 'tl-links');
    tl.appendChild(svg);

    // Axis: a tick each year, a label every other year, faint grid lines.
    for (var yr = bottom; yr <= top; yr++) {
      var tick = document.createElement('div');
      tick.className = 'tl-tick' + (yr % 2 === 0 ? ' major' : '');
      tick.style.top = y(yr) + 'px';
      tick.style.width = (lanesX + lanesW + 6) + 'px';
      if (yr % 2 === 0) tick.innerHTML = '<span>' + yr + '</span>';
      tl.appendChild(tick);
    }

    // Labels first, so their heights can be measured for collision handling.
    var labels = entries.map(function (e, i) {
      var lab = document.createElement('div');
      lab.className = 'tl-label';
      lab.dataset.i = i;
      lab.style.setProperty('--c', e.color);
      lab.style.left = labelsX + 'px';
      lab.innerHTML = '<div class="tl-date">' + e.date + '</div>' +
        e.html.map(function (h, k) { return k ? '<div class="tl-note">' + h + '</div>' : '<div class="tl-what">' + parts(h) + '</div>'; }).join('');
      tl.appendChild(lab);
      return lab;
    });

    // Place labels newest first at their entry's top, pushing each one down
    // until it clears the label above it.
    var order = entries.map(function (e, i) { return i; })
      .sort(function (a, b) { return y(entries[a].end) - y(entries[b].end); });
    var floor = -Infinity, maxBottom = plotH;
    order.forEach(function (i) {
      var e = entries[i];
      var want = e.point ? y(e.start) - 9 : y(e.end) - 2;
      var at = Math.max(want, floor);
      labels[i].style.top = at + 'px';
      e.labelY = at;
      floor = at + labels[i].offsetHeight + entryGap;
      maxBottom = Math.max(maxBottom, at + labels[i].offsetHeight);
    });
    // Labels taller than the plot drift below their bars; stretch the years
    // to make room, and lay out again.
    if (maxBottom > plotH + 8 && yearPx < 90) return render(sec, Math.min(90, yearPx * maxBottom / plotH));
    tl.style.height = maxBottom + 'px';
    svg.setAttribute('width', labelsX);
    svg.setAttribute('height', maxBottom);

    entries.forEach(function (e, i) {
      var x = lanesX + e.lane * (barW + laneGap);
      var mark = document.createElement('div');
      mark.dataset.i = i;
      mark.style.setProperty('--c', e.color);
      if (e.point) {
        mark.className = 'tl-dot';
        mark.style.top = y(e.start) + 'px';
        mark.style.left = (x + barW / 2) + 'px';
      } else {
        mark.className = 'tl-bar' + (e.ongoing ? ' ongoing' : '');
        mark.style.top = y(e.end) + 'px';
        mark.style.height = Math.max(4, y(e.start) - y(e.end)) + 'px';
        mark.style.left = x + 'px';
        mark.style.width = barW + 'px';
        // Year tags over the axis at the bar's ends, shown while the entry
        // is highlighted. An ongoing span has no end to tag.
        [[e.start, 'start']].concat(e.ongoing ? [] : [[e.end, 'end']]).forEach(function (p) {
          var tag = document.createElement('div');
          tag.className = 'tl-end ' + p[1];
          tag.dataset.i = i;
          tag.style.top = y(p[0]) + 'px';
          tag.style.width = (axisW - 2) + 'px';
          tag.textContent = p[0];
          tl.appendChild(tag);
        });
      }
      tl.appendChild(mark);

      // Connector to the label's first line, leaving the bar at the point
      // level with the label when the bar reaches that far, so most run flat.
      var lx = labelsX - 6, ly = e.labelY + 9;
      var ax = e.point ? x + barW / 2 + 6 : x + barW + 2;
      var ay = e.point ? y(e.start) : Math.min(Math.max(ly, y(e.end) + 4), y(e.start) - 4);
      var path = document.createElementNS(SVG, 'path');
      var mid = lanesX + lanesW + 8;
      path.setAttribute('d', 'M' + ax + ' ' + ay + ' H' + mid + ' L' + lx + ' ' + ly);
      path.dataset.i = i;
      svg.appendChild(path);
    });

    // Hovering or tapping any part of an entry highlights all of it.
    function hot(i, on) {
      tl.querySelectorAll('[data-i="' + i + '"]').forEach(function (n) { n.classList.toggle('hot', on); });
    }
    tl.addEventListener('mouseover', function (ev) {
      var n = ev.target.closest('[data-i]'); if (n) hot(n.dataset.i, true);
    });
    tl.addEventListener('mouseout', function (ev) {
      var n = ev.target.closest('[data-i]'); if (n) hot(n.dataset.i, false);
    });
    tl.addEventListener('click', function (ev) {
      var n = ev.target.closest('[data-i]');
      tl.querySelectorAll('.hot').forEach(function (h) { h.classList.remove('hot'); });
      if (n) hot(n.dataset.i, true);
    });
  }

  // Render the timelines in visible sections; hidden ones can't be measured.
  window.renderTimelines = function () {
    document.querySelectorAll('main > section').forEach(function (sec) {
      if (sec.offsetParent === null) return;
      if (sec.querySelector(':scope > dl')) render(sec);
    });
  };
  // Web fonts change label heights, so lay out again once they arrive.
  if (document.fonts) document.fonts.ready.then(function () { window.renderTimelines(); });
  var t;
  window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(window.renderTimelines, 150); });
})();
