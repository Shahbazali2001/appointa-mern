/**
 * Higher-order function to handle asynchronous route handlers in Express.
 * Catches any errors and passes them to Express's next() error handling middleware.
 *
 * @param {Function} requestHandler - The async controller function (req, res, next)
 * @returns {Function} Express middleware function
 */
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };
export default asyncHandler;

