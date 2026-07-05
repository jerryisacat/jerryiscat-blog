export default async (request, context) => {
  const url = new URL(request.url);

  // Only route the canonical homepage. Keep existing Chinese URLs stable.
  if (url.pathname !== "/" && url.pathname !== "/index.html") {
    return context.next();
  }

  const cookie = request.headers.get("cookie") || "";
  const savedLanguage = /(?:^|;\s*)jerryiscat-blog-language=(en|zh-cn)(?:;|$)/.exec(cookie)?.[1];

  if (savedLanguage === "zh-cn") {
    return context.next();
  }

  if (savedLanguage === "en" || prefersEnglish(request.headers.get("accept-language") || "")) {
    const target = new URL("/en/", url);
    target.search = url.search;
    target.hash = url.hash;
    return Response.redirect(target, 302);
  }

  return context.next();
};

function prefersEnglish(acceptLanguage) {
  if (!acceptLanguage) return false;

  const languages = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, qPart] = part.trim().split(";q=");
      return {
        tag: tag.toLowerCase(),
        q: qPart === undefined ? 1 : Number.parseFloat(qPart) || 0,
      };
    })
    .filter(({ tag }) => tag)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of languages) {
    if (tag.startsWith("en")) return true;
    if (tag.startsWith("zh")) return false;
  }

  return false;
}
