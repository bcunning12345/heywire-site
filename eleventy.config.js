import { HtmlBasePlugin } from "@11ty/eleventy";

// PATH_PREFIX lets the same build run at the root of a domain ("/") or under a
// sub-path such as GitHub Pages ("/heywire-site/"). Templates always write
// root-relative URLs; the plugin rewrites them in the output.
const pathPrefix = process.env.PATH_PREFIX || "/";

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(HtmlBasePlugin);

  // Static assets are copied through untouched.
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/assets/icons/favicon.ico": "favicon.ico" });

  // Simple helper for the current year in the footer.
  eleventyConfig.addShortcode("year", () => String(new Date().getFullYear()));

  return {
    pathPrefix,
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "dist",
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
