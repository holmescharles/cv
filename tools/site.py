#!/usr/bin/env python3
"""Turn pandoc's single-page CV into the sidebar site: site.py index.html

Wraps the name and contact links into an About section, gathers Education,
Supplementary Education and Employment into one Timeline section, builds the
sidebar from the section headings (subsections nested under their section),
adds the timeline script, and stamps the CSS and script links with a content
hash so a rebuild is never served from cache.
"""
import hashlib
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSS = 'style/site.css'
JS = 'js/timeline.js'


# Every section is on the one page. Lay out the timeline, follow links to
# moved sections, and keep the sidebar marking the section and subsection
# being read as the page scrolls.
SCRIPT = """</main>
<script src="%s"></script>
<script>
renderTimelines();
// The three sections the Timeline replaced keep their links working.
var MOVED = { education: 'timeline-education', 'supplementary-education': 'timeline-training', employment: 'timeline-employment' };
function follow() {
  var id = location.hash.slice(1);
  if (MOVED[id]) location.replace('#' + MOVED[id]);
}
window.addEventListener('hashchange', follow);
follow();

var links = Array.prototype.slice.call(document.querySelectorAll('nav.site li a'));
var targets = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
var current = null, jumping = false, jumpEnd;
// A sidebar link jumps straight to its target: the strip takes the target
// section's layout first, so nothing shifts under the scroll, and the
// sidebar waits for the scroll to finish before following it again.
document.querySelector('nav.site').addEventListener('click', function (ev) {
  var a = ev.target.closest('a[href^="#"]');
  var t = a && document.getElementById(a.getAttribute('href').slice(1));
  if (!t) return;
  ev.preventDefault();
  history.pushState(null, '', a.getAttribute('href'));
  var sec = t.closest('main > section');
  focusTimeline(sec && sec.id, sec === t ? null : t.id, true);
  jumping = true;
  clearTimeout(jumpEnd);
  function done() {
    if (!jumping) return;
    clearTimeout(jumpEnd); jumping = false; current = null; spy();
  }
  // Scroll a frame later: the browser's scroll anchoring answers the
  // strip's change of height by nudging the page, and a nudge landing
  // after the scroll has begun cancels it.
  requestAnimationFrame(function () {
    t.scrollIntoView({ block: 'start' });
    jumpEnd = setTimeout(done, 1500);
    window.addEventListener('scrollend', done, { once: true });
  });
});

function spy() {
  if (jumping) return;
  // The section being read is the last one whose top has passed a line 40%%
  // of the way down the window (below the pinned strip, whose height
  // changes with the section, so the line must not follow it); at the very
  // bottom, the last one.
  var line = window.innerHeight * 0.4, top = null, sub = null;
  var atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
  targets.forEach(function (t, k) {
    if (!t || (t.getBoundingClientRect().top > line && !atEnd)) return;
    if (links[k].closest('ul.sub')) { if (top && top.contains(t)) sub = links[k]; }
    else { top = t; sub = null; }
  });
  if (window.scrollY < 2) { top = targets[0]; sub = null; }  // the top of the page is About
  var key = (top && top.id) + '/' + (sub && sub.getAttribute('href'));
  if (key === current) return;
  current = key;
  focusTimeline(top && top.id, sub && sub.getAttribute('href').slice(1));
  links.forEach(function (a) {
    var on = top && a.getAttribute('href') === '#' + top.id;
    if (on) {
      a.setAttribute('aria-current', 'location');
      // In the phone's header bar, bring the link into view by scrolling the
      // bar alone; scrollIntoView would also stop the page's own scroll.
      var ul = a.closest('ul');
      ul.scrollLeft = a.offsetLeft - ul.offsetLeft - (ul.clientWidth - a.offsetWidth) / 2;
    }
    else a.removeAttribute('aria-current');
    a.classList.toggle('here', a === sub);
  });
}
var ticking = false;
window.addEventListener('scroll', function () {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(function () { ticking = false; spy(); });
}, { passive: true });
window.addEventListener('resize', spy);
spy();
</script>
</body>"""


def stamp(rel):
    return rel + '?v=' + hashlib.sha1((ROOT / rel).read_bytes()).hexdigest()[:8]


def take(s, sid, title, body):
    """Cut section `sid` out of s; return (rest, the part of it matching body)."""
    m = re.search(rf'<section id="{sid}" class="level1">\s*<h1>{title}</h1>\s*{body}\s*</section>\s*', s, flags=re.S)
    if not m:
        sys.exit(f'site.py: {title} section not found')
    return s[:m.start()] + s[m.end():], m.group(1)


def kind(dl, k):
    return dl.replace('<dl>', f'<dl data-kind="{k}">', 1)


def main(path):
    p = Path(path)
    s = p.read_text()

    s, n = re.subn(r'(<header id="title-block-header">.*?</header>\s*<div class="preamble">.*?</div>)',
                   r'<section id="intro">\1</section>', s, count=1, flags=re.S)
    if n != 1:
        sys.exit('site.py: name and contact block not found')

    # One Timeline section under one strip: degrees, training and jobs, each
    # list under its own subheading and tagged with its kind for timeline.js.
    # The PDFs keep the three sections apart.
    edu = take(s, 'education', 'Education', r'(<dl>.*?</dl>)')
    s = edu[0]
    sup = take(s, 'supplementary-education', 'Supplementary Education', r'<ul>(.*?)</ul>')
    s = sup[0]
    # Training is a bullet list ("Name[, Institution], <em>years</em>"); make
    # it a dated list, the name in bold as the jobs' titles are.
    def dated(m):
        name, _, rest = m.group(1).partition(', ')
        return f'<dt>{m.group(2)}</dt>\n<dd><strong>{name}</strong>' + (f', {rest}' if rest else '') + '</dd>'
    training = '<dl>\n' + re.sub(r'<li>(.*?),\s*<em>([^<]*)</em></li>', dated, sup[1]).strip() + '\n</dl>'
    jobs = re.search(r'<section id="employment" class="level1">\s*<h1>Employment</h1>\s*(<dl>.*?</dl>)', s, flags=re.S)
    if not jobs:
        sys.exit('site.py: Employment section not found')
    s = (s[:jobs.start()] + '<section id="timeline" class="level1">\n<h1>Timeline</h1>\n'
         + '<h2 id="timeline-education">Education</h2>\n' + kind(edu[1], 'degree')
         + '\n<h2 id="timeline-training">Supplementary Education</h2>\n' + kind(training, 'training')
         + '\n<h2 id="timeline-employment">Employment</h2>\n' + kind(jobs.group(1), 'job') + s[jobs.end():])

    # The sidebar names each section exactly as its heading does, with its
    # subsections (pandoc's level-2 sections, or an <h2> with an id) beneath.
    links = ['<li><a href="#intro">About</a></li>']
    starts = [m for m in re.finditer(r'<section id="([^"]+)" class="level1">\s*<h1>(.*?)</h1>', s)]
    for k, m in enumerate(starts):
        body = s[m.end():starts[k + 1].start() if k + 1 < len(starts) else len(s)]
        subs = re.findall(r'<section id="([^"]+)" class="level2">\s*<h2>(.*?)</h2>|<h2 id="([^"]+)">(.*?)</h2>', body)
        sub = ''.join(f'<li><a href="#{a or c}">{b or d}</a></li>' for a, b, c, d in subs)
        links.append(f'<li><a href="#{m.group(1)}">{m.group(2)}</a>' + (f'<ul class="sub">{sub}</ul>' if sub else '') + '</li>')
    nav = ('<nav class="site"><a class="name" href="#intro">Chuck Holmes</a><ul>'
           + ''.join(links) + '</ul></nav>\n<main>')
    s = s.replace('<body>\n', '<body>\n' + nav, 1)
    s = s.replace('</body>', SCRIPT % stamp(JS), 1)
    s = s.replace(f'href="{CSS}"', f'href="{stamp(CSS)}"', 1)
    s = s.replace('<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes" />',
                  '<meta name="viewport" content="width=device-width, initial-scale=1" />')
    p.write_text(s)


if __name__ == '__main__':
    main(sys.argv[1])
