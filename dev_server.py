from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import sys


class COIRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        self.send_header("Cross-Origin-Resource-Policy", "cross-origin")
        super().end_headers()


if __name__ == "__main__":
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass

    server = ThreadingHTTPServer(("127.0.0.1", port), COIRequestHandler)
    print(f"COI dev server running at http://127.0.0.1:{port}")
    print("Press Ctrl+C to stop")
    server.serve_forever()
