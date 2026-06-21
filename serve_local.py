from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os


ROOT = Path(__file__).resolve().parent
PORT = 4175


class QuietHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, format, *args):
        return


def main():
    os.chdir(ROOT)
    server = ThreadingHTTPServer(("0.0.0.0", PORT), QuietHandler)
    try:
        server.serve_forever()
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
