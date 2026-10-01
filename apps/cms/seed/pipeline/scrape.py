"""Fetch real metadata from metabase.com. Metadata only - no article bodies."""
import json, re, sys, time, urllib.request, html
from concurrent.futures import ThreadPoolExecutor

UA = "Mozilla/5.0 (compatible; assignment-research/1.0)"

def fetch(url, tries=3):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=25) as r:
                return r.read().decode("utf-8", "replace")
        except Exception as e:
            if i == tries - 1:
                print(f"    FAIL {url}: {e}", file=sys.stderr); return None
            time.sleep(1.5 * (i + 1))

def jsonld(doc):
    out = []
    for m in re.findall(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', doc, re.S):
        try:
            d = json.loads(m)
            out.extend(d.get("@graph", [d]) if isinstance(d, dict) else d)
        except Exception:
            pass
    return out

def post_meta(url):
    doc = fetch(url)
    if not doc: return None
    art = next((n for n in jsonld(doc) if n.get("@type") == "BlogPosting"), None)
    if not art: return None
    # read time + author slug come from the rendered page, not the JSON-LD
    rt = re.search(r'(\d+)\s*min read', doc)
    au = re.search(r'/blog/authors/([a-z0-9-]+)"', doc)
    avatar = re.search(r'(https://cdn\.metabase\.com/images/posts/blog-authors/[^"]+)', doc)
    return {
        "slug": url.rsplit("/", 1)[-1],
        "title": html.unescape(art.get("headline", "")),
        "excerpt": html.unescape(art.get("description", "")),
        "category": art.get("articleSection"),
        "publishedDate": (art.get("datePublished") or "")[:10],
        "coverImage": art.get("image"),
        "readTimeMinutes": int(rt.group(1)) if rt else None,
        "authorSlug": au.group(1) if au else None,
        "authorAvatar": avatar.group(1) if avatar else None,
    }

def case_meta(url):
    doc = fetch(url)
    if not doc: return None
    text = re.sub(r"<[^>]+>", " ", re.sub(r"<(script|style)[^>]*>.*?</\1>", "", doc, flags=re.S))
    text = html.unescape(re.sub(r"\s+", " ", text))
    def field(label, nxt):
        m = re.search(rf"{label}\s+(.*?)\s+(?:{nxt})", text)
        return m.group(1).strip() if m else None
    og = re.search(r'<meta property="og:title" content="([^"]*)"', doc)
    desc = re.search(r'<meta name="description" content="([^"]*)"', doc)
    img = re.search(r'<meta property="og:image" content="([^"]*)"', doc)
    return {
        "slug": url.rsplit("/", 1)[-1],
        "title": html.unescape(og.group(1)) if og else None,
        "headline": html.unescape(desc.group(1)) if desc else None,
        "heroImage": img.group(1) if img else None,
        "companyDescription": field("Company", "Industry"),
        "industry": field("Industry", "Employees|Headquarters|Key use"),
        "employees": field("Employees", "Headquarters|Key use|Industry"),
        "headquarters": field("Headquarters", "Key use|The Challenge|Industry"),
        "useCases": field("Key use cases", "The Challenge|Why |The data"),
    }

def run(urls, fn, label):
    print(f"  fetching {len(urls)} {label} ...")
    with ThreadPoolExecutor(max_workers=5) as ex:
        res = [r for r in ex.map(fn, urls) if r]
    print(f"  got {len(res)}/{len(urls)}")
    return res

urls = [u.strip() for u in open("urls.txt")]
posts = [u for u in urls if "/blog/" in u and "/authors/" not in u]
cases = [u for u in urls if "/case-studies/" in u and u.rstrip("/").endswith("case-studies") is False]

p = run(posts, post_meta, "blog posts")
json.dump(p, open("real-posts.json", "w"), indent=1)
c = run(cases, case_meta, "case studies")
json.dump(c, open("real-cases.json", "w"), indent=1)
print(f"\n  wrote real-posts.json ({len(p)}) and real-cases.json ({len(c)})")
