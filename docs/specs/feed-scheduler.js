/**
 * Weighted round-robin feed scheduler reference implementation.
 * 
 * Ratios:
 * - deepDive: 6
 * - insightRow: 2
 * - builderLog: 1
 * 
 * @param {Array} deepDives Sorted array of deep dive items.
 * @param {Array} insightCards Sorted array of individual insight cards.
 * @param {Array} builderLogs Sorted array of builder log items.
 * @param {Object} weights Ratio configuration.
 * @param {number} insightRowSize Maximum number of cards per insight row.
 * @returns {Array} List of interleaved feed slots.
 */
function buildLibraryFeed(
  deepDives,
  insightCards,
  builderLogs,
  weights = { deepDive: 6, insightRow: 2, builderLog: 1 },
  insightRowSize = 5
) {
  // Group insight cards into rows of up to insightRowSize
  const insightRows = [];
  for (let i = 0; i < insightCards.length; i += insightRowSize) {
    insightRows.push(insightCards.slice(i, i + insightRowSize));
  }

  const slots = [];
  
  let ddIndex = 0;
  let irIndex = 0;
  let blIndex = 0;

  while (
    ddIndex < deepDives.length ||
    irIndex < insightRows.length ||
    blIndex < builderLogs.length
  ) {
    let itemsAdded = 0;

    // 1. Take Deep Dives
    const ddTake = Math.min(weights.deepDive, deepDives.length - ddIndex);
    for (let k = 0; k < ddTake; k++) {
      slots.push({ type: 'deepDive', item: deepDives[ddIndex++] });
      itemsAdded++;
    }

    // 2. Take Insight Rows
    const irTake = Math.min(weights.insightRow, insightRows.length - irIndex);
    for (let k = 0; k < irTake; k++) {
      slots.push({ type: 'insightRow', items: insightRows[irIndex++] });
      itemsAdded++;
    }

    // 3. Take Builder Logs
    const blTake = Math.min(weights.builderLog, builderLogs.length - blIndex);
    for (let k = 0; k < blTake; k++) {
      slots.push({ type: 'builderLog', item: builderLogs[blIndex++] });
      itemsAdded++;
    }

    // Guard against infinite loop
    if (itemsAdded === 0) {
      break;
    }
  }

  return slots;
}

module.exports = {
  buildLibraryFeed
};
