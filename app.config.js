module.exports = ({ config }) => {
  const mapboxDownloadToken = process.env.MAPBOX_DOWNLOAD_TOKEN ?? '';
  const mapboxPublicToken   = process.env.MAPBOX_TOKEN ?? '';

  return {
    ...config,
    android: {
      ...config.android,
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
    },
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
