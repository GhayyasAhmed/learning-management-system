type Props = {
  title: string;
  description?: string;
  keywords?: string;
};

// Per-page <title>/<meta> tags, hoisted into <head> automatically (React 19
// document metadata support). `description`/`keywords` are optional and
// conditionally rendered so a route that already supplies its own
// description via Next's Metadata API (generateMetadata / a route
// `metadata` export) can omit it here to avoid a duplicate
// <meta name="description"> tag. `viewport` is intentionally NOT rendered
// here — it's owned once, globally, by the `viewport` export in
// app/layout.tsx, so this component doesn't emit a second, duplicate
// viewport meta tag on every page.
const Heading = ({ title, description, keywords }: Props) => {
  return (
    <>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}
    </>
  );
};

export default Heading;