module.exports = (req, res) => {
  res.json({
    status: 'Platform Active',
    ai: 'Local NLP Engine (TF-IDF) + SerpAPI Web Scraping',
    version: '3.0'
  });
};
