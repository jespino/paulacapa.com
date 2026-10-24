"""Servidor estático local con soporte de Range (necesario para vídeo en Safari/iOS)."""
import os
import re
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class RangeHandler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map,
                      ".webm": "video/webm", ".mp4": "video/mp4"}

    def send_head(self):
        self._range = None
        m = re.match(r"bytes=(\d*)-(\d*)$", self.headers.get("Range", ""))
        path = self.translate_path(self.path)
        if not m or not os.path.isfile(path):
            return super().send_head()
        size = os.path.getsize(path)
        start, end = m.group(1), m.group(2)
        if start:
            start, end = int(start), int(end) if end else size - 1
        else:
            start, end = size - int(end), size - 1
        end = min(end, size - 1)
        if start > end or start >= size:
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{size}")
            self.end_headers()
            return None
        f = open(path, "rb")
        f.seek(start)
        self._range = end - start + 1
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(self._range))
        self.end_headers()
        return f

    def copyfile(self, source, outputfile):
        if not self._range:
            return super().copyfile(source, outputfile)
        left = self._range
        while left > 0:
            chunk = source.read(min(64 * 1024, left))
            if not chunk:
                break
            outputfile.write(chunk)
            left -= len(chunk)

    def end_headers(self):
        self.send_header("Accept-Ranges", "bytes")
        # Evita que el navegador sirva CSS/JS antiguos mientras se edita
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()


if __name__ == "__main__":
    root, port = sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 8000
    server = ThreadingHTTPServer(("0.0.0.0", port), partial(RangeHandler, directory=root))
    print(f"Sirviendo {root} en http://0.0.0.0:{port}", flush=True)
    server.serve_forever()
