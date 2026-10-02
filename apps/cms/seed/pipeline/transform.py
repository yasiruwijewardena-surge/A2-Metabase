"""Merge scraped real metadata with original body copy into seed/data files."""
import json, re, os, sys

CMS = "/Users/yasiruwijewardena/Desktop/work/L2 Assignments/Assignment 2/apps/cms"
D = os.path.join(CMS, "seed", "data")

posts   = json.load(open("real-posts.json"))
cases   = json.load(open("real-cases.json"))
authors = json.load(open("real-authors.json"))
IMAP    = json.load(open("industry-map.json"))
bodies  = json.load(open("bodies.json")) if os.path.exists("bodies.json") else {}
cbodies = json.load(open("case-bodies.json")) if os.path.exists("case-bodies.json") else {}


def clip(s, n):
    """Trim to n characters on a word boundary; schema caps headline at 300."""
    s = (s or "").strip()
    if len(s) <= n: return s
    cut = s[:n].rsplit(" ", 1)[0]
    return cut.rstrip(" ,;:") + "\u2026"

def titlecase_slug(s):
    small = {"and","of","the","in","for","to","a","an"}
    parts = s.split("-")
    return " ".join(w if w in small and i else w.capitalize() for i, w in enumerate(parts))

# ---- tags: not in the original. Derived from title/excerpt keywords, which is
# ---- the SITE-ANALYSIS 6.3 improvement (a real second filter dimension).
TAG_RULES = [
 ("AI",            r"\bAI\b|artificial intelligence|LLM|agent|Metabot|GPT|Claude"),
 ("Security",      r"security|vulnerab|CVE|breach|auth|permission"),
 ("Open Source",   r"open.?source|community|contribut|license|OSS"),
 ("Embedding",     r"embed|white.?label|multi.?tenant|SDK|iframe"),
 ("Performance",   r"perform|speed|fast|slow|cache|caching|optimi|latency"),
 ("SQL",           r"\bSQL\b|quer(y|ies)|snippet|join"),
 ("Dashboards",    r"dashboard|chart|visuali|graph|report"),
 ("Self-service",  r"self.?serv|non.?technical|everyone|democrati|business user"),
 ("Data modeling", r"model|semantic|schema|metric|definition|warehouse|dbt"),
 ("Hiring",        r"hir|career|team|job|analyst role|interview"),
]
def tags_for(text):
    t = [name for name, pat in TAG_RULES if re.search(pat, text, re.I)]
    return t[:3] or ["Analytics"]

# ---- authors ---------------------------------------------------------------
author_by_slug = {a["slug"]: a for a in authors}
out_authors = [{
    "name": a["name"],
    "slug": a["slug"],
    "role": "Contributor",
    "bio": f"Writes for the Metabase blog.",
    "avatarUrl": a["avatar"],
} for a in authors]

# ---- taxonomies ------------------------------------------------------------
cats = sorted({p["category"] for p in posts if p["category"]})
CAT_DESC = {
 "News":"Announcements, releases and company updates.",
 "Engineering":"How we build and run the product.",
 "Analytics and BI":"Practice and craft of working with data.",
 "Product":"Features, workflows and what they are for.",
 "Data explorations":"Analyses of public and internal datasets.",
 "Using Metabase":"Practical guides for getting more out of it.",
}
all_tags = sorted({t for p in posts for t in tags_for(p["title"] + " " + (p["excerpt"] or ""))})

industries = sorted({IMAP.get(c["industry"]) for c in cases if c.get("industry") and IMAP.get(c["industry"])})
IND_DESC = {
 "SaaS & Developer Tools":"Software products sold to businesses and developers.",
 "Financial Services":"Banks, lenders, payments, fintech and investment platforms.",
 "Education":"Schools, universities and learning platforms.",
 "Healthcare":"Providers, telehealth and health technology.",
 "eCommerce & Retail":"Online and physical retail, travel and hospitality.",
 "Logistics & Transport":"Freight, shipping, fleet and mobility.",
 "Manufacturing":"Industrial production, supply chain and connected devices.",
 "Nonprofit":"Charities, NGOs and social enterprises.",
}

taxonomies = {
 "_note":"Categories, author names and industries are real metadata from metabase.com. Industries are mapped from the original's 17 free-text values to a curated vocabulary (SITE-ANALYSIS.md 6.1). Tags do not exist on the original and are derived here (6.3).",
 "categories":[{"name":c,"description":CAT_DESC.get(c,"")} for c in cats],
 "tags":[{"name":t} for t in all_tags],
 "industries":[{"name":n,"displayOrder":i+1,"description":IND_DESC.get(n,"")} for i,n in enumerate(industries)],
 "useCases":[
   {"name":"Business Intelligence","displayOrder":1,"description":"Self-service analytics for your own team."},
   {"name":"Embedded Analytics","displayOrder":2,"description":"Customer-facing analytics inside your product."}],
 "authors": out_authors,
}
json.dump(taxonomies, open(os.path.join(D,"taxonomies.json"),"w"), indent=2)

# ---- companies (real, from case studies) -----------------------------------
def company_name(slug, title):
    m = re.match(r"^([A-Z][\w&.'-]*(?:\s+[A-Z][\w&.'-]*){0,3})\b", title or "")
    if m and len(m.group(1)) > 2: return m.group(1).strip()
    return titlecase_slug(slug)

seen, companies = set(), []
for c in cases:
    nm = company_name(c["slug"], c.get("claim") or "")
    if nm.lower() in seen: nm = titlecase_slug(c["slug"])
    if nm.lower() in seen: continue
    seen.add(nm.lower())
    c["_company"] = nm
    companies.append({
        "name": nm,
        "industry": IMAP.get(c.get("industry")) or "SaaS & Developer Tools",
        "employees": c.get("employees"),
        "headquarters": c.get("headquarters"),
        "description": c.get("companyDescription"),
        "logoUrl": c.get("companyLogo"),
    })

# fictional companies + people, used only for testimonials
fict = json.load(open("fictional.json")) if os.path.exists("fictional.json") else {"companies":[],"people":[]}
json.dump({
  "_note":"Companies carrying case studies are real organisations from metabase.com, with their real industry, size and headquarters. The companies and people attached to testimonials are fictional: the quotes are original, and attributing invented statements to real named people would be fabricating records.",
  "companies": companies + fict.get("companies",[]),
  "people": fict.get("people",[]),
}, open(os.path.join(D,"companies.json"),"w"), indent=2)

# ---- posts -----------------------------------------------------------------
out_posts = []
for p in sorted(posts, key=lambda x: x["publishedDate"] or "", reverse=True):
    body = bodies.get(p["slug"])
    if not body: continue
    out_posts.append({
        "title": p["title"], "slug": p["slug"],
        "excerpt": p["excerpt"], "category": p["category"],
        "tags": tags_for(p["title"] + " " + (p["excerpt"] or "")),
        "author": author_by_slug.get(p["authorSlug"], {}).get("name"),
        "publishedDate": p["publishedDate"],
        "readTimeMinutes": p["readTimeMinutes"],
        "coverImageUrl": p["coverImage"],
        "body": body,
    })
for i, p in enumerate(out_posts[:3]): p["featured"] = True
json.dump(out_posts, open(os.path.join(D,"posts.json"),"w"), indent=2)

# ---- case studies ----------------------------------------------------------
out_cases = []
for c in cases:
    cb = cbodies.get(c["slug"])
    if not cb: continue
    uc = []
    if "Business Intelligence" in (c.get("useCases") or ""): uc.append("Business Intelligence")
    if "Embedded Analytics" in (c.get("useCases") or ""): uc.append("Embedded Analytics")
    out_cases.append({
        "title": clip(c.get("claim") or c["slug"].replace("-", " ").title(), 255),
        "slug": c["slug"],
        "headline": clip(c.get("headline") or c.get("claim"), 300),
        "company": c["_company"], "useCases": uc or ["Business Intelligence"],
        "heroImageUrl": c.get("heroImage"),
        "publishedDate": cb.get("publishedDate","2026-01-01"),
        "challenge": cb["challenge"], "solution": cb["solution"], "results": cb["results"],
        "metrics": cb.get("metrics",[]), "body": cb["body"],
    })
for c in out_cases[:3]: c["featured"] = True
json.dump(out_cases, open(os.path.join(D,"case-studies.json"),"w"), indent=2)

print(f"  taxonomies : {len(cats)} categories, {len(all_tags)} tags, {len(industries)} industries, {len(out_authors)} authors")
print(f"  companies  : {len(companies)} real + {len(fict.get('companies',[]))} fictional")
print(f"  posts      : {len(out_posts)}/{len(posts)} (needs a body in bodies.json)")
print(f"  cases      : {len(out_cases)}/{len(cases)} (needs an entry in case-bodies.json)")
