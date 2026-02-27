const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const SavedSearch = require("../models/savedSearchModel");

exports.createSavedSearch = catchAsync(async (req, res, next) => {
  // tenant only; middleware enforces
  const payload = {
    user: req.user._id,
    name: req.body.name,
    criteria: req.body.criteria,
    notifyBy: "email",
    isActive: true,
  };

  const saved = await SavedSearch.create(payload);
  res.status(201).json({ status: "success", data: saved });
});

exports.getMySavedSearches = catchAsync(async (req, res, next) => {
  const searches = await SavedSearch.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ status: "success", results: searches.length, data: searches });
});

exports.deleteSavedSearch = catchAsync(async (req, res, next) => {
  const search = await SavedSearch.findById(req.params.id);
  if (!search) return next(new AppError("Saved search not found", 404));
  if (search.user.toString() !== req.user._id.toString()) {
    return next(new AppError("You do not own this saved search", 403));
  }
  await SavedSearch.findByIdAndDelete(req.params.id);
  res.status(204).json({ status: "success", data: null });
});
