"""Работа со статьями на проде prime-auto.by.

python art.py list                     черновики нейросети (id, проверена ли, factcheck — повторная проверка нейросетью по фактам, обложка, заголовок)
python art.py factcheck <id,id,…>      поставить черновики на повторную проверку нейросетью-редактором с «Фактами» (сервер, ~$0.01 за статью)
python art.py dump <id,id,…> <файл>    выгрузить несколько статей разом (JSON по строке на статью)
python art.py get <id> <файл.json>     выгрузить статью (title, meta_*, excerpt, body, faq, cover, task — задание)
python art.py put <id> <файл.json>     записать изменённые поля (те же ключи) и пометить «проверено Claude»
python art.py upload <картинка>        залить WebP в var/uploads/2026/10 → печатает адрес /uploads/2026/10/…
python art.py audit <id,id,…>          картинки статей: адреса /uploads открываются и залиты из своей папки a<id>
python art.py published                опубликованные статьи (для перелинковки и против дублей)
python art.py photos                   фото работ мастерской из библиотеки (адрес — машина и работы)
python art.py sync-queue               поставить все проверенные черновики в очередь публикации (по id)
python art.py publish-queue <id,id,…>  задать порядок публикации целиком (только проверенные черновики)

На Windows запускать с PYTHONIOENCODING=utf-8.
"""
import hashlib, os, subprocess, sys, tempfile
from PIL import Image

SSH = ["ssh", "-i", os.path.expanduser("~/.ssh/vdf_deploy"), "root@93.125.12.160"]
SITE = "/var/www/prime-auto"
RUN = f"cd {SITE} && docker compose run --rm -T --no-deps tools node scripts/.claude-art.mjs"
HERE = os.path.dirname(os.path.abspath(__file__))


def ssh(cmd, stdin=None):
    r = subprocess.run(SSH + [cmd], input=stdin, capture_output=True)
    out = r.stdout.decode("utf8", "replace")
    err = "\n".join(l for l in r.stderr.decode("utf8", "replace").splitlines() if "Container" not in l)
    if r.returncode:
        sys.exit(f"ошибка: {err or out}")
    return out


def scp(local, remote):
    subprocess.run(["scp", "-q", "-i", os.path.expanduser("~/.ssh/vdf_deploy"), local, f"root@93.125.12.160:{remote}"], check=True)


def ensure_server_script():
    scp(os.path.join(HERE, "art-server.mjs"), f"{SITE}/scripts/.claude-art.mjs")


def main():
    cmd, args = sys.argv[1], sys.argv[2:]
    if cmd == "upload":
        src = args[0]
        img = Image.open(src).convert("RGB")
        if max(img.size) > 1600:
            img.thumbnail((1600, 1600), Image.LANCZOS)
        # свой временный файл на каждый вызов: агенты заливают параллельно
        fd, tmp = tempfile.mkstemp(suffix=".webp")
        os.close(fd)
        try:
            img.save(tmp, "WEBP", quality=84)
            digest = hashlib.sha1(open(tmp, "rb").read()).hexdigest()[:16]
            name = f"{digest}-{img.size[0]}x{img.size[1]}.webp"
            scp(tmp, f"{SITE}/var/uploads/2026/10/{name}")
        finally:
            os.remove(tmp)
        print(f"/uploads/2026/10/{name}")
        return
    if cmd == "audit":
        return audit([int(x) for x in args[0].split(",")])
    ensure_server_script()
    if cmd == "list":
        print(ssh(f"{RUN} list"), end="")
    elif cmd == "get":
        out = ssh(f"{RUN} get {int(args[0])}")
        open(args[1], "w", encoding="utf8").write(out)
        print("saved", args[1])
    elif cmd == "put":
        scp(args[1], f"{SITE}/scripts/.claude-put-{int(args[0])}.json")
        print(ssh(f"{RUN} put {int(args[0])} scripts/.claude-put-{int(args[0])}.json; rm -f {SITE}/scripts/.claude-put-{int(args[0])}.json"), end="")
    elif cmd in ("published", "photos", "sync-queue"):
        print(ssh(f"{RUN} {cmd}"), end="")
    elif cmd == "factcheck":
        print(ssh(f"{RUN} factcheck {args[0]}"), end="")
    elif cmd == "dump":
        open(args[1], "w", encoding="utf8").write(dump(args[0]))
        print("saved", args[1])
    elif cmd == "publish-queue":
        print(ssh(f"{RUN} publish-queue {args[0]}"), end="")
    else:
        sys.exit(__doc__)


def dump(ids):
    """Статьи <id,id,…> одной строкой JSON каждая (для auto.py)"""
    ensure_server_script()
    return ssh(f"{RUN} dump {ids}")


WORK = os.path.join(tempfile.gettempdir(), "prime-articles")


def encoded_hash(path):
    """Тот же хеш, что даёт upload: так видно, из какой папки залита картинка"""
    import io
    img = Image.open(path).convert("RGB")
    if max(img.size) > 1600:
        img.thumbnail((1600, 1600), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, "WEBP", quality=84)
    return hashlib.sha1(buf.getvalue()).hexdigest()[:16]


def audit(ids):
    import glob, json, re, urllib.request
    ensure_server_script()
    problems = 0
    for i in ids:
        a = json.loads(ssh(f"{RUN} get {i}"))
        local = {encoded_hash(f) for f in glob.glob(os.path.join(WORK, f"a{i}", "*"))
                 if re.search(r"\.(png|webp|jpg)$", f) and not f.endswith("-bg.png")}
        urls = [a["cover"]] + re.findall(r"\]\((/uploads/[^ )]+)", a["body"])
        for u in urls:
            why = ""
            if not u or not u.startswith("/uploads/"):
                why = "не /uploads/ (Git Bash испортил путь?)"
            else:
                try:
                    req = urllib.request.Request("https://prime-auto.by" + u, method="HEAD", headers={"user-agent": "audit"})
                    if urllib.request.urlopen(req, timeout=20).status != 200:
                        why = "не открывается"
                except Exception as error:
                    why = f"не открывается: {error}"
                if not why and u.startswith("/uploads/2026/") and u.split("/")[-1][:16] not in local:
                    why = f"не найдена среди картинок {WORK}/a{i} — возможно, чужая"
            if why:
                problems += 1
                print(f"{i}: {u} — {why}")
    print(f"проверено статей: {len(ids)}, проблем: {problems}")


if __name__ == "__main__":
    main()
