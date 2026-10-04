"""Extract bounded reference text; reads stdin, executes no document content."""
import re
import sys
from html.parser import HTMLParser


class Text(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self.skip += 1

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self.skip = max(0, self.skip - 1)

    def handle_data(self, data):
        if not self.skip and data.strip():
            self.parts.append(data.strip())


parser = Text()
parser.feed(sys.stdin.read())
pattern = re.compile(sys.argv[1], re.I)
limit = int(sys.argv[2]) if len(sys.argv) > 2 else 10
hits = 0
for i, part in enumerate(parser.parts):
    if pattern.search(part):
        print(" ".join(parser.parts[max(0, i - 1):i + 2])[:1800])
        hits += 1
        if hits >= limit:
            break
if not hits:
    print("No matching reference text.", file=sys.stderr)
    sys.exit(2)
