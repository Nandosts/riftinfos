#!/usr/bin/env python3
import http.server
import socketserver
import urllib.error
import urllib.request
from pathlib import Path

PORTA = 4173
DIRETORIO_BASE = Path(__file__).resolve().parent
API_REMOTA = "https://z6ywq6r3ub.execute-api.us-east-1.amazonaws.com"


class ServidorRiftForjas(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIRETORIO_BASE), **kwargs)

    def do_GET(self):
        if self.path.startswith("/api/"):
            self.encaminhar_api()
            return
        super().do_GET()

    def encaminhar_api(self):
        url_destino = f"{API_REMOTA}{self.path}"
        requisicao = urllib.request.Request(
            url_destino,
            headers={
                "Accept": "application/json",
                "Origin": "https://riftstream.com.br",
                "User-Agent": "Mozilla/5.0",
            },
        )
        try:
            with urllib.request.urlopen(requisicao, timeout=10) as resposta:
                corpo = resposta.read()
                status = resposta.status
                tipo_conteudo = resposta.headers.get(
                    "Content-Type", "application/json; charset=utf-8"
                )
        except urllib.error.HTTPError as erro:
            corpo = erro.read()
            status = erro.code
            tipo_conteudo = erro.headers.get(
                "Content-Type", "application/json; charset=utf-8"
            )
        except Exception as erro:
            corpo = f'{{"error": "{str(erro)}"}}'.encode("utf-8")
            status = 502
            tipo_conteudo = "application/json; charset=utf-8"

        self.send_response(status)
        self.send_header("Content-Type", tipo_conteudo)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(corpo)))
        self.end_headers()
        self.wfile.write(corpo)


class ServidorTCPReutilizavel(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True


if __name__ == "__main__":
    with ServidorTCPReutilizavel(("127.0.0.1", PORTA), ServidorRiftForjas) as httpd:
        print(f"Servidor Rift Forjas ativo em http://127.0.0.1:{PORTA}/")
        httpd.serve_forever()

