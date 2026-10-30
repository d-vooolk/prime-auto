"""Дешёвая доводка статей: проверка кодом и картинки без просмотра глазами.

python auto.py lint <id,id,…>     найти в черновиках типичные ошибки нейросети (по REVIEW.md) — с цитатой места
python auto.py build <plan.json>  применить правки, сделать обложку и иллюстрацию, залить и записать (put)

plan.json — список заданий, по одному на статью (пишет Claude, читая только lint, заголовок и аннотацию):
[{
  "id": 61,
  "replace": [["точная цитата из статьи", "на что заменить"], …],      # правки по lint; "" — удалить
  "how": "Как это делаем мы: … Подробности и цены — на странице [Ремонт креплений](/uslugi/…).",  # без «> », после первого раздела
  "cover": {"scene": "…англ.", "title": "2–5 слов", "accent": "до 6 слов", "chips": […] | "compare": [a, b] | "badge": "…" | "warning": true},
  "cover_alt": "что на обложке по-русски",
  "image": {"prompt": "…англ., фотореалистично, без текста", "alt": "…", "caption": "короткая подпись", "after": "часть заголовка ## раздела"},
  "photo": {"url": "/uploads/library/…", "alt": "…", "caption": "…", "after": "часть заголовка ## раздела"}   # своё фото, если есть
}]
layout и accent_style обложки чередуются сами по id. Картинки — в $TEMP/prime-articles/a<id>/auto-*,
готовые не генерируются заново (повторный build после сбоя бесплатен по Leonardo). Статья с ошибкой
правки (цитата не найдена) не записывается — build печатает причину.

Запускать из tools/articles с PYTHONIOENCODING=utf-8.
"""
import json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import art, cover2, leo

LAYOUTS = ["left", "right", "center"]
STYLES = ["text", "bar_yellow", "bar_red"]
LINK = re.compile(r"(?<!!)\[([^\]]+)\]\(([^ )]+)")
INTERNAL = ("/uslugi", "/price", "/contacts", "/otzyvy", "/stati/", "/raboty")

# (что ищем, почему плохо) — ошибки, которые черновики повторяли раз за разом (REVIEW.md, «Наблюдения»)
PATTERNS = [
    (r"\d+\s*%|процент", "статистика/проценты — выдумка?"),
    (r"по статистике|в половине случаев|в разы|в \d+ из \d+|большинств\w+ случа", "выдуманная статистика"),
    (r"\d+\s*[–-]\s*\d+\s*минут", "диапазон минут: для запотевания норма 20–40"),
    (r"гаранти", "гарантия: только «на модули от 1 года», других сроков нет"),
    (r"засверл", "засверливание трещин не упоминаем — варим полимером"),
    (r"тониров|развал\w*[- ]+схожд|\bразвала?\b|оклейк\w* кузов", "этого мастерская не делает"),
    (r"\d[\d\s]*(?:тыс\.?\s*)?(?:час(?:ов|а)?|лет|года?)\b(?![а-я])", "срок службы в часах/годах — выдумка?"),
    (r"ГОСТ\s*[РP]?\s*\d|пункт\w*\s*\d|п\.\s*\d|ТР ТС|стать\w+\s*\d", "номер правила/ГОСТ — убрать"),
    (r"\b[PUBC]\d{4}\b", "код ошибки — выдумка?"),
    (r"ксенон[^.]{0,120}желт|желт[^.]{0,120}ксенон", "стареющий ксенон уходит в розовый, а не желтеет"),
    (r"матричн[^.]{0,120}ближн", "матрица — это дальний свет"),
    (r"проводк[^.]{0,80}(?:берёмся|беремся|устраним|отремонтируем|восстановим)", "за проводку машины не берёмся"),
    (r"драйвер[^.]{0,80}напряжени", "драйвер стабилизирует ток"),
]


def sentences(text):
    return re.split(r"(?<=[.!?])\s+|\n+", text)


def lint_article(a):
    issues = []
    texts = [("title", a["title"]), ("excerpt", a["excerpt"]), ("body", a["body"])]
    texts += [(f"faq{i + 1}", f"{x['q']} {x['a']}") for i, x in enumerate(a["faq"])]
    for where, text in texts:
        for s in sentences(text):
            if s.startswith("!["):
                continue
            why = "; ".join(why for pattern, why in PATTERNS if re.search(pattern, s, re.I))
            if why:
                issues.append(f"[{where}] {why}: «{s.strip()[:300]}»")
    links = LINK.findall(a["body"])
    if not 3 <= len(links) <= 9:
        issues.append(f"ссылок {len(links)} — нужно 3–9 (лишние убрать, оставить по делу)")
    for text, href in links:
        if href.startswith("http"):
            if not href.startswith("https://vdf.by/catalog/"):
                issues.append(f"внешняя ссылка не на раздел каталога vdf.by: [{text}]({href})")
        elif not href.startswith(INTERNAL):
            issues.append(f"ссылка не на страницу услуги/статью: [{text}]({href})")
    if sum(h.startswith("https://vdf.by") for _, h in links) > 2:
        issues.append("больше двух ссылок на vdf.by")
    if len(a["title"]) > 70:
        issues.append(f"title {len(a['title'])} знаков — до 70")
    if len(a["meta_title"] or "") > 50:
        issues.append(f"meta_title {len(a['meta_title'])} знаков — до 50: «{a['meta_title']}»")
    if not 140 <= len(a["meta_description"] or "") <= 160:
        issues.append(f"meta_description {len(a['meta_description'] or '')} знаков — 140–160: «{a['meta_description']}»")
    if re.match(r"\s*в этой статье", a["excerpt"] or "", re.I):
        issues.append("excerpt начинается с «В этой статье» — начать с сути")
    if not 4 <= len(a["faq"]) <= 6:
        issues.append(f"вопросов в faq {len(a['faq'])} — нужно 4–6")
    if len(a["body"]) < 6500:
        issues.append(f"body {len(a['body'])} знаков — коротко")
    if "Как это делаем мы" in a["body"]:
        issues.append("блок «Как это делаем мы» уже есть — how не нужен")
    return issues


def load(ids):
    return [json.loads(line) for line in art.dump(ids).splitlines() if line.strip()]


def lint(ids):
    for a in load(ids):
        task = a.get("task") or {}
        print(f"=== {a['id']} | {a['title']}")
        print(f"запрос: {task.get('keyword', '')} | нюансы: {(task.get('notes') or '').strip()[:400]}")
        print(f"аннотация: {a['excerpt']}")
        print("разделы: " + " / ".join(re.findall(r"^## (.+)$", a["body"], re.M)))
        issues = lint_article(a)
        print("\n".join(f"- {x}" for x in issues) if issues else "- замечаний нет")
        print()


def insert_after_section(body, heading, block):
    """Вставить блок после первого абзаца раздела ## с заголовком, содержащим heading (или после первого раздела)"""
    parts = re.split(r"(?m)^(?=## )", body)
    idx = next((i for i, p in enumerate(parts) if p.startswith("## ") and heading and heading.lower() in p.splitlines()[0].lower()), None)
    if idx is None:
        idx = next((i for i, p in enumerate(parts) if p.startswith("## ")), len(parts) - 1)
    chunks = parts[idx].rstrip("\n").split("\n\n")
    at = min(2, len(chunks))  # заголовок + первый абзац
    chunks.insert(at, block)
    parts[idx] = "\n\n".join(chunks) + "\n\n"
    return "".join(parts).rstrip() + "\n"


def make_images(job, folder):
    """Обложка и иллюстрация; готовые файлы не перегенерируются. Две попытки на сбой Leonardo."""
    os.makedirs(folder, exist_ok=True)
    i = job["id"]
    spec = dict(job["cover"], layout=LAYOUTS[i % 3], accent_style=STYLES[(i // 3) % 3])
    cover = os.path.join(folder, "auto-cover.webp")
    illus = os.path.join(folder, "auto-illus.png")
    for attempt in range(2):
        try:
            if not os.path.exists(cover):
                cover2.render(spec, cover)
            if job.get("image") and not os.path.exists(illus):
                leo.generate(illus, job["image"]["prompt"] + ", photorealistic, natural light, high detail, no text")
            break
        except Exception as error:
            if attempt:
                raise
            print(f"{i}: Leonardo: {error} — повтор")
    return cover, (illus if job.get("image") else None)


def upload(path):
    out = subprocess.run([sys.executable, os.path.join(HERE, "art.py"), "upload", path], capture_output=True, text=True, encoding="utf8")
    url = out.stdout.strip().splitlines()[-1] if out.stdout.strip() else ""
    if out.returncode or not url.startswith("/uploads/"):
        raise RuntimeError(f"upload {path}: {out.stderr or out.stdout}")
    return url


def build(plan_path):
    plan = json.load(open(plan_path, encoding="utf8"))
    articles = {a["id"]: a for a in load(",".join(str(j["id"]) for j in plan))}
    done = []
    for job in plan:
        i = job["id"]
        a = articles.get(i)
        if not a:
            print(f"{i}: нет статьи")
            continue
        if "проверено Claude" in (a.get("notes") or ""):
            print(f"{i}: уже проверена — пропуск")
            continue
        try:
            fields = ["title", "meta_title", "meta_description", "excerpt", "body"]
            for old, new in job.get("replace", []):
                hit = [f for f in fields if old in (a[f] or "")]
                faq_hit = [x for x in a["faq"] if old in x["q"] or old in x["a"]]
                if not hit and not faq_hit:
                    raise ValueError(f"не найдено для замены: «{old[:80]}»")
                for f in hit:
                    a[f] = a[f].replace(old, new)
                for x in faq_hit:
                    x["q"], x["a"] = x["q"].replace(old, new), x["a"].replace(old, new)
            a["body"] = re.sub(r"[ \t]+\n", "\n", re.sub(r"\n{3,}", "\n\n", a["body"]))
            if job.get("how") and "Как это делаем мы" not in a["body"]:
                a["body"] = insert_after_section(a["body"], "", "> " + job["how"].lstrip("> ").strip())
            folder = os.path.join(art.WORK, f"a{i}")
            cover, illus = make_images(job, folder)
            a["cover"] = upload(cover)
            a["cover_alt"] = job.get("cover_alt") or a["title"]
            has_image = re.search(r"!\[[^\]]*\]\(/uploads/", a["body"])
            if job.get("photo") and job["photo"]["url"] not in a["body"]:
                p = job["photo"]
                a["body"] = insert_after_section(a["body"], p.get("after", ""), f'![{p["alt"]}]({p["url"]} "{p["caption"]}")')
            if illus and not has_image:
                im = job["image"]
                url = upload(illus)
                a["body"] = insert_after_section(a["body"], im.get("after", ""), f'![{im["alt"]}]({url} "Иллюстрация: {im["caption"]}")')
            work = os.path.join(art.WORK, "work", f"{i}.json")
            os.makedirs(os.path.dirname(work), exist_ok=True)
            json.dump({k: a[k] for k in fields + ["faq", "cover", "cover_alt"]}, open(work, "w", encoding="utf8"), ensure_ascii=False, indent=1)
            out = subprocess.run([sys.executable, os.path.join(HERE, "art.py"), "put", str(i), work], capture_output=True, text=True, encoding="utf8")
            if out.returncode:
                raise RuntimeError(out.stderr or out.stdout)
            left = [x for x in lint_article(a) if not x.startswith("блок «Как это")]
            print(f"{i}: записана | обложка {LAYOUTS[i % 3]}/{STYLES[(i // 3) % 3]} | осталось замечаний lint: {len(left)}")
            done.append(i)
        except Exception as error:
            print(f"{i}: НЕ записана — {error}")
    print("записаны:", ",".join(map(str, done)))


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    {"lint": lint, "build": build}[sys.argv[1]](sys.argv[2])
