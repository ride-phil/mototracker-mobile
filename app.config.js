module.exports = ({ config }) => {
  const mapboxDownloadToken = process.env.MAPBOX_DOWNLOAD_TOKEN ?? '';
  const mapboxPublicToken   = process.env.MAPBOX_TOKEN ?? '';

  return {
    ...config,
    plugins: [
      [
        '@rnmapbox/maps',
        {
          RNMapboxMapsDownloadToken: mapboxDownloadToken,
        },
      ],
    ],
    extra: {
      ...config.extra,
      mapboxToken: mapboxPublicToken,
    },
  };
};
