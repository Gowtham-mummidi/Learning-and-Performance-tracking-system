module.exports = (req, res) => {
  const { topic } = req.body || {};
  res.json({
    topics: [
      `${topic || 'study'} explained simply`,
      `${topic || 'study'} tutorial for beginners`,
      `${topic || 'study'} crash course`,
      `${topic || 'study'} examples and problems`,
      `Learn ${topic || 'study'} step by step`,
      `${topic || 'study'} study guide`
    ]
  });
};
