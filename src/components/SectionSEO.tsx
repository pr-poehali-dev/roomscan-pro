import { Helmet } from "react-helmet-async";
import { getSectionSEO, SITE_NAME, SITE_URL } from "@/lib/seo";

interface Props {
  sectionId: string;
}

/**
 * Динамические meta-теги для текущей секции.
 * Обновляет <title>, description, keywords, OG/Twitter, JSON-LD breadcrumbs и WebPage.
 */
export default function SectionSEO({ sectionId }: Props) {
  const seo = getSectionSEO(sectionId);
  const url = `${SITE_URL}/#${seo.id}`;

  // Breadcrumb structured data
  const breadcrumbLD = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Главная",
        item: SITE_URL,
      },
      ...(seo.id === "home"
        ? []
        : [
            {
              "@type": "ListItem",
              position: 2,
              name: seo.label,
              item: url,
            },
          ]),
    ],
  };

  // WebPage structured data
  const pageLD = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: seo.title,
    description: seo.description,
    url,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };

  return (
    <Helmet>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      {seo.keywords && <meta name="keywords" content={seo.keywords} />}
      <link rel="canonical" href={url} />

      <meta property="og:type" content="website" />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={SITE_NAME} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />

      <script type="application/ld+json">
        {JSON.stringify(breadcrumbLD)}
      </script>
      <script type="application/ld+json">{JSON.stringify(pageLD)}</script>
    </Helmet>
  );
}
