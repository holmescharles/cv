// Put every dated entry on the page on one horizontal timeline strip, pinned
// below the name and contact block. Years run to scale left to right. The
// Timeline section's dated lists (<dl>: <dt>years</dt><dd>entry</dd>) draw
// each degree as a diamond on the top row, training as bars on the rows
// below, and jobs as bars below those, overlapping spans of one kind in
// separate rows; those lists are rebuilt as readable lists. Every other
// section gets one grey row of its own, from the years in its entries.
// Hovering, focusing or tapping an entry, anywhere on the page or on the
// strip, highlights it in both places and marks its date range on the strip.
// The <dl>s stay in the page as the fallback.
(function () {
  var now = new Date();
  var NOW = now.getFullYear() + now.getMonth() / 12;

  // Colour follows the employer, matched on the entry text; first match wins,
  // so the WashU catch-all goes last. Each colour is a stylesheet token with
  // a light and a dark value; site.css records how each set was validated.
  var EMPLOYERS = [
    ['California San Diego', 'UC San Diego', 'var(--tl-ucsd)'],
    ['Salk', 'Salk Institute', 'var(--tl-salk)'],
    ['Boeing', 'Boeing', 'var(--tl-boeing)'],
    ['Neurolutions', 'Neurolutions', 'var(--tl-neuro)'],
    ['Lickenbrock', 'Lickenbrock', 'var(--tl-lick)'],
    ['Washington University', 'WashU', 'var(--tl-washu)']
  ];
  // Degrees and training are not employers: each gets its own hue and its
  // own rows.
  var DEGREE = ['Degree', 'var(--tl-degree)'];
  var TRAINING = ['Training', 'var(--tl-training)'];
  var KINDS = ['degree', 'training', 'job'];
  var LABELS = { degree: 'Degrees', training: 'Training', job: 'Jobs' };
  // The Timeline subsection each kind's band answers to.
  var SUBS = { degree: 'timeline-education', training: 'timeline-training', job: 'timeline-employment' };
  // The other sections share one grey (Gruvbox fg4): the row label, not a
  // hue, says which section a mark belongs to. Labels are short to fit the
  // strip's left margin; a section not listed uses its heading.
  var OTHER = 'var(--muted)';
  var SHORT = {
    'honors-and-awards': 'Honors',
    'teaching-and-mentoring': 'Teaching',
    'journal-publications': 'Papers',
    'preprints': 'Preprints',
    'conference-presentations-and-publications': 'Talks',
    'extracurricular-activities': 'Activities'
  };
  function employer(text) {
    for (var k = 0; k < EMPLOYERS.length; k++) if (text.indexOf(EMPLOYERS[k][0]) >= 0) return EMPLOYERS[k];
    return [null, 'Other', 'var(--muted)'];
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
    // A list of single years is a list of milestones (degrees). A single
    // year among spans is a short event (a two-week summer school): a dot at
    // mid-year, holding its row for the year so nothing lands on top of it.
    var points = entries.every(function (e) { return e.end === null; });
    var kind = dl.dataset.kind || (points ? 'degree' : 'job');
    entries.forEach(function (e) {
      e.kind = kind;
      e.point = points;
      var brief = e.end === null && !points;
      if (e.end === null) e.end = points ? e.start : e.start + 1;
      var who = kind === 'degree' ? [null, DEGREE[0], DEGREE[1]]
        : kind === 'training' ? [null, TRAINING[0], TRAINING[1]]
        : employer(e.html.join(' '));
      e.org = who[1];
      e.color = who[2];
      e.marks = [{ start: e.start, end: e.end, point: e.point || brief, ongoing: e.ongoing, at: brief ? e.start + 0.5 : e.start }];
    });
    return entries;
  }

  // The dated entries of any other section: each list item's years, from its
  // italic dates ("2019 – 2021", "2025", "Fall 2014") or, in a bibliography,
  // "(2022)". An item with several dates gets a mark for each; a named
  // semester places its dot in that part of the year.
  var SEASON = { Spring: 0.25, Summer: 0.55, Fall: 0.8 };
  function collect(sec) {
    var found = [];
    sec.querySelectorAll('li').forEach(function (li) {
      var spans = [];
      if (li.closest('.bibliography')) {
        var m = li.textContent.match(/\((\d{4})\)/);
        if (m) spans.push({ start: +m[1], end: +m[1], point: true });
      } else {
        li.querySelectorAll('em').forEach(function (em) {
          var m = em.textContent.match(/^\s*(?:(Spring|Summer|Fall)\s+)?(\d{4})(?:\s*[–-]+\s*(\d{4}|present))?\s*$/);
          if (!m) return;
          spans.push(m[3]
            ? { start: +m[2], end: m[3] === 'present' ? NOW : +m[3], ongoing: m[3] === 'present' }
            : { start: +m[2], end: +m[2], point: true, at: m[1] ? +m[2] + SEASON[m[1]] : undefined, season: m[1] });
        });
      }
      if (spans.length) found.push({ li: li, marks: spans });
    });
    return found;
  }
  function said(m) {
    return m.point ? (m.season ? m.season + ' ' : '') + m.start : m.start + '–' + (m.ongoing ? 'present' : m.end);
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

  // Half a dot's width, in years, with room to spare at phone width, and
  // the least gap between two marks sharing a row.
  var DOT = 0.3, GAP = 0.1;
  // Greedy interval stacking of marks by their drawn extent [lo, hi]: each
  // takes the first row where it clears the last mark by GAP.
  function stack(ms) {
    var ends = [];
    ms.slice().sort(function (a, b) { return a.lo - b.lo || (b.hi - b.lo) - (a.hi - a.lo); })
      .forEach(function (m) {
        var row = ends.findIndex(function (end) { return end + GAP <= m.lo; });
        if (row < 0) { row = ends.length; ends.push(0); }
        ends[row] = m.hi;
        m.row = row;
      });
    return ends.length;
  }

  var focus = function () {}, remeasure;

  function build() {
    var main = document.querySelector('main');
    if (!main || main.dataset.timeline) return;
    main.dataset.timeline = 'built';
    var tl = document.getElementById('timeline');
    var dls = tl ? Array.prototype.slice.call(tl.querySelectorAll(':scope > dl')) : [];
    var lists = dls.map(parse);
    var entries = [].concat.apply([], lists);

    // Each kind gets its own band of rows, in KINDS order; diamonds share one.
    var rows = 0, bands = [];
    KINDS.forEach(function (k) {
      var group = entries.filter(function (e) { return e.kind === k; });
      if (!group.length) return;
      var dots = group.every(function (e) { return e.point; });
      var n = dots ? 1 : assignRows(group);
      group.forEach(function (e) { e.row = (dots ? 0 : e.row) + rows; });
      bands.push({ label: LABELS[k], from: rows, n: n, sec: 'timeline', sub: SUBS[k] });
      rows += n;
    });

    // Then a band per other section, with as many rows as it takes for no
    // two marks to touch: a dot sits mid-year (or in its semester) and
    // dots that share a year stack, as do spans that overlap.
    Array.prototype.forEach.call(main.querySelectorAll(':scope > section'), function (sec) {
      if (sec === tl || sec.id === 'intro') return;
      var found = collect(sec);
      if (!found.length) return;
      var h1 = sec.querySelector('h1');
      var label = SHORT[sec.id] || (h1 ? h1.textContent : sec.id);
      var ms = [].concat.apply([], found.map(function (f) { return f.marks; }));
      ms.forEach(function (m) {
        if (m.point && m.at === undefined) m.at = m.start + 0.5;
        m.lo = m.point ? m.at - DOT : m.start;
        m.hi = m.point ? m.at + DOT : m.end;
      });
      var n = stack(ms);
      ms.forEach(function (m) { m.row += rows; });
      found.forEach(function (f) {
        entries.push({
          kind: 'other', row: rows, color: OTHER, org: label, item: f.li, marks: f.marks,
          date: f.marks.map(said).join(', ')
        });
      });
      bands.push({ label: label, from: rows, n: n, sec: sec.id });
      rows += n;
    });
    if (!entries.length) return;
    entries.forEach(function (e, i) { e.i = i; });

    // Years left to right; half a year of room around a diamond.
    var all = [].concat.apply([], entries.map(function (e) { return e.marks; }));
    var lo = Math.floor(Math.min.apply(null, all.map(function (m) { return m.point ? m.at - 0.5 : m.start; })));
    var hi = Math.ceil(Math.max.apply(null, all.map(function (m) { return m.point ? m.at + 0.5 : m.end; })));
    var x = function (t) { return (t - lo) / (hi - lo) * 100 + '%'; };

    // The strip. No colour legend: each entry's list item carries its
    // colour, and hovering either one names the other.
    var strip = document.createElement('div');
    strip.className = 'tl-strip';
    var plot = document.createElement('div');
    plot.className = 'tl-plot';
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

    // Each band of rows is a group, labelled in the plot's left margin; the
    // stylesheet sizes its rows, so a group can shrink when out of focus.
    bands.forEach(function (b) {
      b.el = document.createElement('div');
      b.el.className = 'tl-group';
      b.el.style.setProperty('--n', b.n);
      b.el.innerHTML = '<div class="tl-row-label">' + b.label + '</div>';
      plot.appendChild(b.el);
    });
    function groupOf(r) { return bands.find(function (b) { return r >= b.from && r < b.from + b.n; }); }

    var marks = entries.map(function (e) {
      return e.marks.map(function (s) {
        var m = document.createElement('div');
        m.className = 'tl-mark' + (e.kind === 'other' ? ' other' : '') + (s.point ? (e.kind === 'degree' ? ' point' : ' point dot') : '') + (s.ongoing ? ' ongoing' : '');
        m.dataset.i = e.i;
        m.style.setProperty('--c', e.color);
        var r = s.row === undefined ? e.row : s.row, g = groupOf(r);
        m.style.top = 'calc(' + (r - g.from) + ' * (var(--rh) + var(--gap)))';
        m.style.left = x(s.point ? s.at : s.start);
        if (!s.point) m.style.width = 'calc(' + x(s.end) + ' - ' + x(s.start) + ' - 2px)';
        m.title = e.date;
        g.el.appendChild(m);
        return m;
      });
    });
    var intro = document.getElementById('intro');
    main.insertBefore(strip, intro ? intro.nextSibling : main.firstChild);

    // The Timeline's lists, one per <dl>, each in its own order.
    dls.forEach(function (dl, k) {
      var ul = document.createElement('ul');
      ul.className = 'tl-list';
      lists[k].forEach(function (e) {
        var li = document.createElement('li');
        li.className = 'tl-item' + (e.kind === 'job' ? '' : ' study');
        li.style.setProperty('--c', e.color);
        li.innerHTML = '<div class="tl-date">' + e.date + '</div>' +
          e.html.map(function (h, j) { return j ? '<div class="tl-note">' + h + '</div>' : '<div class="tl-what">' + parts(h) + '</div>'; }).join('');
        ul.appendChild(li);
        e.item = li;
      });
      dl.parentNode.insertBefore(ul, dl);
      dl.classList.add('tl-source');
    });
    // Every entry, wherever it sits, answers to the strip.
    entries.forEach(function (e) {
      e.item.dataset.i = e.i;
      e.item.tabIndex = 0;
      if (e.kind === 'other') { e.item.classList.add('tl-hot'); e.item.style.setProperty('--c', e.color); }
    });

    // Expand the bands for the section (and subsection) being read; shrink
    // the rest. On the About section, or one with no band, expand them all.
    // With `now`, skip the animation and re-measure at once, so a jump can
    // scroll to a target that will not move.
    focus = function (sec, sub, now) {
      var on = bands.filter(function (b) { return b.sec === sec && (!sub || !b.sub || b.sub === sub); });
      if (!on.length) on = bands;
      if (now) strip.classList.add('now');
      bands.forEach(function (b) { b.el.classList.toggle('here', on.indexOf(b) >= 0); });
      clearTimeout(remeasure);
      if (now) {
        pinTop();
        requestAnimationFrame(function () { strip.classList.remove('now'); });
      } else remeasure = setTimeout(pinTop, 300);
    };
    focus(null);

    var active = null;
    function show(i) {
      if (i === active) return;
      if (active !== null) {
        marks[active].forEach(function (m) { m.classList.remove('on'); });
        entries[active].item.classList.remove('on');
      }
      active = i;
      strip.classList.toggle('active', i !== null);
      if (i === null) return;
      var e = entries[i];
      marks[i].forEach(function (m) { m.classList.add('on'); });
      e.item.classList.add('on');
      // One band from the entry's first date to its last.
      var a = Math.min.apply(null, e.marks.map(function (s) { return s.point ? s.at : s.start; }));
      var b = Math.max.apply(null, e.marks.map(function (s) { return s.point ? s.at : s.end; }));
      var point = a === b;
      band.style.setProperty('--c', e.color);
      band.style.left = x(a);
      band.style.width = point ? '0px' : 'calc(' + x(b) + ' - ' + x(a) + ')';
      var first = e.marks[0], last = e.marks[e.marks.length - 1];
      band.innerHTML = point || b - a <= 1
        ? '<span class="at">' + e.date + '</span>'
        : '<span class="from">' + first.start + '</span><span class="to">' + (last.ongoing ? 'present' : last.end) + '</span>';
    }
    function pick(ev) { var n = ev.target.closest && ev.target.closest('[data-i]'); return n ? +n.dataset.i : null; }
    main.addEventListener('mouseover', function (ev) { show(pick(ev)); });
    main.addEventListener('mouseleave', function () { show(null); });
    main.addEventListener('focusin', function (ev) { show(pick(ev)); });
    main.addEventListener('focusout', function () { show(null); });
    // Taps: highlight an entry and keep it until the next tap; a tap on a
    // strip mark also brings its entry into view.
    main.addEventListener('click', function (ev) {
      var i = pick(ev);
      show(i);
      if (i !== null && ev.target.closest('.tl-mark')) entries[i].item.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }

  // Pin the strip below the phone's header bar, whose height varies, and
  // record the strip's height so jumps land below it.
  function pinTop() {
    var nav = document.querySelector('nav.site');
    var top = nav && getComputedStyle(nav).position === 'sticky' ? nav.offsetHeight : 0;
    document.documentElement.style.setProperty('--strip-top', top + 'px');
    var strip = document.querySelector('.tl-strip');
    if (strip) document.documentElement.style.setProperty('--strip-h', strip.offsetHeight + 'px');
  }

  window.renderTimelines = function () {
    build();
    pinTop();
  };
  window.focusTimeline = function (sec, sub, now) { focus(sec, sub, now); };
  window.addEventListener('resize', pinTop);
})();
