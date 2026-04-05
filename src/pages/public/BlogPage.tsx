import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageMeta, SITE_URL } from "@/hooks/usePageMeta";

const posts = [
  {
    slug: "como-criar-perfil-profissional",
    title: "Como criar um perfil profissional de sucesso",
    excerpt: "Dicas essenciais para montar um anúncio que converte: fotos, descrição e preços.",
    date: "2026-03-15",
  },
  {
    slug: "seguranca-online-profissionais",
    title: "Segurança online para profissionais independentes",
    excerpt: "Boas práticas para proteger sua identidade e privacidade na internet.",
    date: "2026-03-10",
  },
  {
    slug: "programa-afiliados-como-funciona",
    title: "Programa de Afiliados: como funciona?",
    excerpt: "Entenda como indicar profissionais e ganhar comissões recorrentes na Rubi Girls.",
    date: "2026-03-05",
  },
];

export default function BlogPage() {
  const { t, lang } = useLanguage();

  usePageMeta({
    title: t("blog.title"),
    description: "Tips, news and guides for independent professionals. Read the Rubi Girls blog.",
    path: "/blog",
    breadcrumbs: [
      { name: "Home", url: SITE_URL },
      { name: t("blog.title"), url: `${SITE_URL}/blog` },
    ],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "Rubi Girls Blog",
      description: "Tips, news and guides for independent professionals.",
      url: `${SITE_URL}/blog`,
      publisher: {
        "@type": "Organization",
        name: "Rubi Girls",
        url: SITE_URL,
      },
      blogPost: posts.map((post) => ({
        "@type": "BlogPosting",
        headline: post.title,
        description: post.excerpt,
        datePublished: post.date,
        url: `${SITE_URL}/blog/${post.slug}`,
      })),
    },
  });

  const dateLocale = lang === "pt" ? "pt-BR" : lang === "es" ? "es-ES" : lang === "fr" ? "fr-FR" : lang === "de" ? "de-DE" : "en-GB";

  return (
    <div className="container mx-auto px-4 py-12 animate-fade-in">
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-muted-foreground">
        <ol className="flex items-center gap-1.5">
          <li><Link to="/" className="hover:text-foreground transition-colors">Home</Link></li>
          <li className="text-border">/</li>
          <li className="text-foreground">{t("blog.title")}</li>
        </ol>
      </nav>

      <div className="mb-10">
        <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">{t("blog.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("blog.desc")}</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <article
            key={post.slug}
            className="rounded-lg border border-border bg-card p-6 flex flex-col transition-colors hover:border-primary/30"
          >
            <h2 className="font-display text-lg font-semibold text-foreground leading-snug">
              {post.title}
            </h2>
            <p className="mt-2 flex-1 text-sm text-muted-foreground leading-relaxed">
              {post.excerpt}
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" aria-hidden="true" />
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString(dateLocale)}
              </time>
            </div>
          </article>
        ))}
      </div>

      <section className="mt-16 mx-auto max-w-xl text-center rounded-lg border border-primary/20 bg-primary/5 p-8">
        <h2 className="font-display text-xl font-bold text-foreground">{t("blog.cta_title")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("blog.cta_desc")}</p>
        <Button variant="premium" className="mt-4" asChild>
          <Link to="/cadastro?role=professional">{t("blog.cta_button")}</Link>
        </Button>
      </section>
    </div>
  );
}