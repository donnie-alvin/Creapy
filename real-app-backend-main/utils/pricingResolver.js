const MS_PER_DAY = 24 * 60 * 60 * 1000;

const startOfDay = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
};

const eachNight = (checkIn, checkOut) => {
  const nights = [];
  let cursor = startOfDay(checkIn);
  const end = startOfDay(checkOut);

  while (cursor && end && cursor < end) {
    nights.push(new Date(cursor));
    cursor = new Date(cursor.getTime() + MS_PER_DAY);
  }

  return nights;
};

const isWeekend = (night) => {
  const day = night.getDay();
  return day === 0 || day === 6;
};

const matchesDateRange = (night, rule) => {
  const start = startOfDay(rule?.startDate);
  const end = startOfDay(rule?.endDate);

  if (!start || !end) {
    return false;
  }

  return night >= start && night <= end;
};

const isWeekday = (night) => !isWeekend(night);

const getRulesByType = (pricingRules, type) =>
  pricingRules.filter((rule) => rule?.type === type && rule?.pricePerNight != null);

const resolveNightPrice = (night, pricingRules) => {
  const seasonalRule = getRulesByType(pricingRules, "seasonal").find((rule) =>
    matchesDateRange(night, rule)
  );
  if (seasonalRule) {
    return seasonalRule.pricePerNight;
  }

  const holidayRule = getRulesByType(pricingRules, "holiday").find((rule) => {
    if (rule.startDate && rule.endDate) {
      return matchesDateRange(night, rule);
    }

    return true;
  });
  if (holidayRule) {
    return holidayRule.pricePerNight;
  }

  const weekendRule = getRulesByType(pricingRules, "weekend").find(() => isWeekend(night));
  if (weekendRule) {
    return weekendRule.pricePerNight;
  }

  const weekdayRule = getRulesByType(pricingRules, "weekday").find(() => isWeekday(night));
  if (weekdayRule) {
    return weekdayRule.pricePerNight;
  }

  return null;
};

exports.resolvePrice = (room, checkIn, checkOut) => {
  const nights = eachNight(checkIn, checkOut);
  const pricingRules = Array.isArray(room?.pricingRules) ? room.pricingRules : [];

  for (const night of nights) {
    const matchedPrice = resolveNightPrice(night, pricingRules);
    if (matchedPrice != null) {
      return matchedPrice;
    }
  }

  return room?.basePricePerNight ?? null;
};
