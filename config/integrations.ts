/**
 * Where the WordPress plugin and its guide live. The plugin isn't in the WordPress plugin directory
 * yet, so a site installs it from this file (Plugins → Add New → Upload Plugin).
 */
export const WORDPRESS_PLUGIN_URL =
  "https://github.com/revnix/rext-wp-plugin/archive/refs/tags/v1.0.0.zip";
export const WORDPRESS_PLUGIN_VERSION = "1.0.0";
export const WORDPRESS_GUIDE_URL = "https://rext.ai/wordpress";

/** The REST namespace the plugin answers on, under the site's address. */
export const WORDPRESS_PLUGIN_PATH = "/wp-json/rext-ai/v1/";

/** A request for a platform we don't connect to yet goes to the team's inbox. */
export const INTEGRATION_REQUEST_URL =
  "mailto:contact@rext.ai?subject=Integration%20request&body=The%20platform%20I%20publish%20on%3A%20";
