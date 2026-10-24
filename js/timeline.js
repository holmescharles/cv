// Turn a section's dated lists (<dl>: <dt>years</dt><dd>entry</dd>) into
// readable lists under one horizontal timeline strip. The strip draws every
// job as a bar (overlapping jobs in separate rows) and every degree as a
// diamond, years to scale left to right. Hovering, focusing or tapping an
// entry, in a list or on the strip, highlights it in both places and marks
// its date range on the strip. The <dl>s stay in the page as the fallback.
(function () {
  var now = new Date();
  var NOW = now.getFullYear() + now.getMonth() / 12;

  // Colour follows the employer, matched on the entry text; first match wins,
  // so the WashU catch-all goes last. Hues are Gruvbox light, assigned so every
  // pair that touches on the strip passes the dataviz validator: worst CVD
  // ΔE 14.5, worst normal-vision ΔE 19.2.
  var EMPLOYERS = [
    ['California San Diego', 'UC San Diego', '#98971a'],
    ['Salk', 'Salk Institute', '#b16286'],
    ['Boeing', 'Boeing', '#076678'],
    ['Neurolutions', 'Neurolutions', '#b57614'],
    ['Lickenbrock', 'Lickenbrock', '#d65d0e'],
    ['Washington University', 'WashU', '#9d0006']
  ];
  // Degrees are not employers: they get their own hue, Gruvbox aqua, which
  // passes the same checks against WashU red, Boeing teal and Lickenbrock
  // orange, and fails against UC San Diego olive and Neurolutions amber.
  var DEGREE = ['Degree', '#689d6a'];
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
      var who = points ? [null, DEGREE[0], DEGREE[1]] : employer(e.html.join(' '));
      e.org = who[1];
      e.color = who[2];
    });
    return entries;
  }

  // Split "<strong>Title</strong>, Department, Institution" into tagged
  // parts so the stylesheet can stack, order and size each one. The last
  // comma part is the institution; any before it, the department.
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

  // Greedy interval colouring: each entry takes the first row that is free.
  function assignRows(entries) {
    var rowEnds = [];
    entries.slice()
      .sort(function (a, b) { return a.start - b.start || (b.end - b.start) - (a.end - a.start); })
      .forEach(function (e) {
        var row = rowEnds.findIndex(function (end) { return end <= e.start; });
        if (row < 0) { row = rowEnds.length; rowEnds.push(0); }
        rowEnds[row] = e.end;
        e.row = row;
      });
    return rowEnds.length;
  }

  function build(sec) {
    if (sec.dataset.timeline) return;
    sec.dataset.timeline = 'built';
    var dls = Array.prototype.slice.call(sec.querySelectorAll(':scope > dl'));
    var lists = dls.map(parse);
    var entries = [].concat.apply([], lists);
    if (!entries.length) return;

    var spans = entries.filter(function (e) { return !e.point; });
    var hasPoints = spans.length < entries.length;
    var rows = assignRows(spans) + (hasPoints ? 1 : 0);
    entries.forEach(function (e, i) { e.i = i; e.row = e.point ? 0 : e.row + (hasPoints ? 1 : 0); });

    // Years left to right; half a year of room around a diamond.
    var lo = Math.floor(Math.min.apply(null, entries.map(function (e) { return e.point ? e.start - 0.5 : e.start; })));
    var hi = Math.ceil(Math.max.apply(null, entries.map(function (e) { return e.point ? e.start + 0.5 : e.end; })));
    var x = function (t) { return (t - lo) / (hi - lo) * 100 + '%'; };

    // The strip: legend, then the plot.
    var strip = document.createElement('div');
    strip.className = 'tl-strip';
    var seen = [];
    spans.forEach(function (e) { if (!seen.some(function (o) { return o.org === e.org; })) seen.push(e); });
    var mixed = hasPoints && spans.length > 0;
    if (seen.length > 1 || mixed) {
      var legend = document.createElement('ul');
      legend.className = 'tl-legend';
      legend.innerHTML = seen.map(function (e) {
        return '<li><span class="tl-swatch" style="--c:' + e.color + '"></span>' + e.org + '</li>';
      }).join('') + (mixed ? '<li><span class="tl-diamond" style="--c:' + DEGREE[1] + '"></span>' + DEGREE[0] + '</li>' : '');
      strip.appendChild(legend);
    }
    var plot = document.createElement('div');
    plot.className = 'tl-plot';
    plot.style.height = 'calc(' + rows + ' * (var(--row-h) + 5px))';
    strip.appendChild(plot);

    // A tick each year; labels every other year, every fourth on a phone.
    for (var yr = lo; yr <= hi; yr++) {
      var tick = document.createElement('div');
      tick.className = 'tl-tick' + (yr % 2 === 0 ? ' label' : '') + (yr % 4 === 0 ? ' label4' : '');
      tick.style.left = x(yr);
      tick.innerHTML = '<span>' + yr + '</span>';
      plot.appendChild(tick);
    }
    var band = document.createElement('div');
    band.className = 'tl-band';
    plot.appendChild(band);

    var marks = entries.map(function (e) {
      var m = document.createElement('div');
      m.className = 'tl-mark' + (e.point ? ' point' : '') + (e.ongoing ? ' ongoing' : '');
      m.dataset.i = e.i;
      m.style.setProperty('--c', e.color);
      m.style.top = 'calc(' + e.row + ' * (var(--row-h) + 5px))';
      m.style.left = x(e.start);
      if (!e.point) m.style.width = 'calc(' + x(e.end) + ' - ' + x(e.start) + ' - 2px)';
      m.title = e.date;
      plot.appendChild(m);
      return m;
    });
    sec.insertBefore(strip, sec.querySelector(':scope > h2') || dls[0]);

    // The lists, one per <dl>, each in its own order.
    var items = [];
    dls.forEach(function (dl, k) {
      var ul = document.createElement('ul');
      ul.className = 'tl-list';
      lists[k].forEach(function (e) {
        var li = document.createElement('li');
        li.className = 'tl-item' + (e.point ? ' point' : '');
        li.dataset.i = e.i;
        li.tabIndex = 0;
        li.style.setProperty('--c', e.color);
        li.innerHTML = '<div class="tl-date">' + e.date + '</div>' +
          e.html.map(function (h, j) { return j ? '<div class="tl-note">' + h + '</div>' : '<div class="tl-what">' + parts(h) + '</div>'; }).join('');
        ul.appendChild(li);
        items[e.i] = li;
      });
      dl.parentNode.insertBefore(ul, dl);
      dl.classList.add('tl-source');
    });

    var active = null;
    function show(i) {
      if (i === active) return;
      if (active !== null) { marks[active].classList.remove('on'); items[active].classList.remove('on'); }
      active = i;
      strip.classList.toggle('active', i !== null);
      if (i === null) return;
      var e = entries[i];
      marks[i].classList.add('on');
      items[i].classList.add('on');
      band.style.setProperty('--c', e.color);
      band.style.left = x(e.start);
      band.style.width = e.point ? '0px' : 'calc(' + x(e.end) + ' - ' + x(e.start) + ')';
      var to = e.ongoing ? 'present' : e.end;
      band.innerHTML = e.point || e.end - e.start <= 1
        ? '<span class="at">' + e.date + '</span>'
        : '<span class="from">' + e.start + '</span><span class="to">' + to + '</span>';
    }
    function pick(ev) { var n = ev.target.closest('[data-i]'); return n ? +n.dataset.i : null; }
    [plot].concat(items).forEach(function (el) {
      el.addEventListener('mouseover', function (ev) { var i = pick(ev); if (i !== null) show(i); });
      el.addEventListener('mouseleave', function () { show(null); });
    });
    items.forEach(function (li) {
      li.addEventListener('focus', function () { show(+li.dataset.i); });
      li.addEventListener('blur', function () { show(null); });
    });
    // Taps: highlight an entry and keep it until the next tap; a tap on a
    // strip mark also brings its entry into view.
    sec.addEventListener('click', function (ev) {
      var i = pick(ev);
      show(i);
      if (i !== null && ev.target.closest('.tl-mark')) items[i].scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }

  // Pin the strip below the phone's header bar, whose height varies.
  function pinTop() {
    var nav = document.querySelector('nav.site');
    var top = nav && getComputedStyle(nav).position === 'sticky' ? nav.offsetHeight : 0;
    document.documentElement.style.setProperty('--strip-top', top + 'px');
  }

  window.renderTimelines = function () {
    document.querySelectorAll('main > section').forEach(function (sec) {
      if (sec.querySelector(':scope > dl')) build(sec);
    });
    pinTop();
  };
  window.addEventListener('resize', pinTop);
})();
