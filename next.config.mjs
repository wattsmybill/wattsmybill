/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Icons and the manifest are served from public/, which defaults to a
        // four-hour max-age. That is why swapping the artwork left phones and
        // browsers showing the previous icon long after it was deployed, and an
        // installed app kept its icon indefinitely. Filenames now carry a
        // version suffix, and these headers make sure a stale copy is at least
        // revalidated rather than served blind.
        source: "/:file(icon-.*\\.png|apple-touch-icon.*\\.png|favicon.*\\.(?:png|ico)|logo.*\\.png|site\\.webmanifest)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
