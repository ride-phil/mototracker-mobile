module.exports = ({ config }) => {
  const mapboxToken = process.env.MAPBOX_TOKEN ?? '';

  return {
    ...config,
    plugins: [
      [
        '@rnmapbox/maps',
        {
          RNMapboxMapsDownloadToken: mapboxToken,
        },
      ],
    ],
    extra: {
      ...config.extra,
      mapboxToken,
    },
  };
};
