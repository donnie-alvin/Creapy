const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const prisma = require("../utils/prisma");

const mapSavedSearchId = (savedSearch) => ({
  ...savedSearch,
  _id: savedSearch.id,
});

exports.createSavedSearch = catchAsync(async (req, res, next) => {
  const saved = await prisma.savedSearch.create({
    data: {
      userId: req.user.id,
      name: req.body.name,
      criteria: req.body.criteria,
      notifyBy: "email",
      isActive: true,
    },
  });

  res.status(201).json({ status: "success", data: mapSavedSearchId(saved) });
});

exports.getMySavedSearches = catchAsync(async (req, res, next) => {
  const searches = await prisma.savedSearch.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
  });

  res
    .status(200)
    .json({ status: "success", results: searches.length, data: searches.map(mapSavedSearchId) });
});

exports.deleteSavedSearch = catchAsync(async (req, res, next) => {
  const search = await prisma.savedSearch.findUnique({
    where: { id: req.params.id },
  });
  if (!search) return next(new AppError("Saved search not found", 404));
  if (search.userId !== req.user.id) {
    return next(new AppError("You do not own this saved search", 403));
  }
  await prisma.savedSearch.delete({
    where: { id: req.params.id },
  });
  res.status(204).json({ status: "success", data: null });
});
