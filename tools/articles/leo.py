"""Генерация картинки в Leonardo: python leo.py <выход.png> "<промпт>" [ширина высота]"""
import json, os, sys, time, urllib.request

KEY_FILE = os.path.expanduser("~/Desktop/leonardo.txt")
_key = None


def key():
    """Переменная LEONARDO_API_KEY, файл ~/Desktop/leonardo.txt или настройки на сервере (админка, «Настройки»)"""
    global _key
    if not _key:
        _key = os.environ.get("LEONARDO_API_KEY") or (open(KEY_FILE, encoding="utf8").read().strip() if os.path.exists(KEY_FILE) else "")
    if not _key:
        import art
        art.ensure_server_script()
        _key = art.ssh(f"{art.RUN} leokey").strip()
    return _key
API = "https://cloud.leonardo.ai/api/rest/v1"
MODEL = "7b592283-e8a7-4c5a-9ba6-d18c31f258b9"  # Lucid Origin
NEGATIVE = "text, letters, words, watermark, logo, signature, caption, cartoon, illustration, blurry, deformed, extra wheels"


def call(method, path, body=None):
    req = urllib.request.Request(API + path, method=method, data=json.dumps(body).encode() if body else None,
                                 headers={"authorization": f"Bearer {key()}", "content-type": "application/json", "accept": "application/json", "user-agent": "prime-auto-covers/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def generate(out, prompt, width=1344, height=768):
    job = call("POST", "/generations", {"modelId": MODEL, "prompt": prompt, "negative_prompt": NEGATIVE,
                                         "width": width, "height": height, "num_images": 1, "contrast": 3.5})
    gid = job["sdGenerationJob"]["generationId"]
    for _ in range(90):
        time.sleep(4)
        g = call("GET", f"/generations/{gid}")["generations_by_pk"]
        if g["status"] == "COMPLETE":
            url = g["generated_images"][0]["url"]
            with urllib.request.urlopen(urllib.request.Request(url, headers={"user-agent": "prime-auto-covers/1.0"}), timeout=120) as r, open(out, "wb") as f:
                f.write(r.read())
            return out
        if g["status"] == "FAILED":
            raise RuntimeError("generation failed")
    raise TimeoutError(gid)


if __name__ == "__main__":
    w, h = (int(sys.argv[3]), int(sys.argv[4])) if len(sys.argv) > 4 else (1344, 768)
    print(generate(sys.argv[1], sys.argv[2], w, h))
