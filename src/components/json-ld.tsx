/** Renders schema.org JSON-LD; `<` is escaped so data can't close the tag. */
export function JsonLd({ graph }: { graph: readonly object[] }) {
  const data = { "@context": "https://schema.org", "@graph": graph };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
