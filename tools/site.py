#!/usr/bin/env python3
"""Turn pandoc's single-page CV into the sidebar site: site.py index.html

Wraps the name and contact links into an About section, folds Education
into Employment so the two share one timeline, builds the sidebar from the
section headings, adds the timeline script, and stamps the CSS and script
links with a content hash so a rebuild is never served from cache.
"""
import hashlib
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSS = 'style/site.css'
JS = 'js/timeline.js'


# Mark the current section's link, keep each section starting at the top,
# and lay out the timelines in the section now showing.
SCRIPT = """</main>
<script src="%s"></script>
<script>
function markCurrent() {
  var id = location.hash.slice(1) || 'intro';
  if (!document.getElementById(id)) id = 'intro';
  document.querySelectorAll('nav.site a').forEach(function (a) {
    if (a.getAttribute('href') === '#' + id && !a.classList.contains('name')) {
      a.setAttribute('aria-current', 'page');
      a.scrollIntoView({ inline: 'center', block: 'nearest' });
    }
    else a.removeAttribute('aria-current');
  });
  window.scrollTo(0, 0);
  renderTimelines();
}
window.addEventListener('hashchange', markCurrent);
markCurrent();
</script>
</body>"""


def stamp(rel):
    return rel + '?v=' + hashlib.sha1((ROOT / rel).read_bytes()).hexdigest()[:8]


def main(path):
    p = Path(path)
    s = p.read_text()

    s, n = re.subn(r'(<header id="title-block-header">.*?</header>\s*<div class="preamble">.*?</div>)',
                   r'<section id="intro">\1</section>', s, count=1, flags=re.S)
    if n != 1:
        sys.exit('site.py: name and contact block not found')

    # One timeline strip for both: the degree list moves into the Employment
    # section, each list under its own subheading. The PDFs keep them as two
    # sections.
    m = re.search(r'<section id="education" class="level1">\s*<h1>Education</h1>\s*(<dl>.*?</dl>)\s*</section>\s*', s, flags=re.S)
    if not m or s.count('<h1>Employment</h1>') != 1:
        sys.exit('site.py: Education or Employment section not found')
    s = s[:m.start()] + s[m.end():]
    s = s.replace('<h1>Employment</h1>', '<h1>Education &amp; Employment</h1>\n<h2>Education</h2>\n'
                  + m.group(1) + '\n<h2>Employment</h2>', 1)

    links = ['<li><a href="#intro">About</a></li>']
    for sid, title in re.findall(r'<section id="([^"]+)" class="level1">\s*<h1>(.*?)</h1>', s):
        # The sidebar names each section exactly as its heading does.
        links.append(f'<li><a href="#{sid}">{title}</a></li>')
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
