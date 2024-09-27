const format = (username, message) => {
  return {
    username,
    message,
    sent_at: Date.now(),
  };
};

module.exports = format;
