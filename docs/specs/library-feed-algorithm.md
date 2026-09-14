# Spec: Library Feed Ordering Algorithm

## Objective
Provide an editorial, varied feed layout on the "All" tab of the library section by interleaving Deep Dives, Insight Cards (grouped in rows), and Builder Logs. Instead of grouping all content of the same type together, content is distributed sequentially using a weighted round-robin strategy.

## Key Constraints
1. **Weights**: Default ratio is `6 : 2 : 1` (Deep Dives : Insight Rows : Builder Logs).
2. **Insight grouping**: Insight cards are short-form content. They must not render individually as full-width elements. Instead, they are batched into single slot units ("rows") of `5` cards.
3. **Inventory Exhaustion**: If a content type is fully consumed, the feed continues to interleave the remaining active types smoothly without leaving empty gaps or throwing runtime exceptions.
4. **Partial trailing rows**: If the total count of insight cards is not a multiple of `5`, the remaining trailing items (fewer than 5) are still outputted as a final partial row, rendering left-aligned.

## Work Example
Assume the inventory contains:
- 10 Deep Dives (D1 to D10)
- 12 Insight Cards (I1 to I12) -> split into 3 rows: Row A (I1-I5), Row B (I6-I10), Row C (I11-I12)
- 2 Builder Logs (B1 to B2)

Applying the 6:2:1 scheduler:
- **Round 1**:
  - Deep Dives (take min of 6, remaining 10): Output D1, D2, D3, D4, D5, D6. (4 DD remain)
  - Insight Rows (take min of 2, remaining 3): Output Row A, Row B. (1 Row remains)
  - Builder Logs (take min of 1, remaining 2): Output B1. (1 BL remains)
- **Round 2**:
  - Deep Dives (take min of 6, remaining 4): Output D7, D8, D9, D10. (0 DD remain)
  - Insight Rows (take min of 2, remaining 1): Output Row C. (0 Rows remain)
  - Builder Logs (take min of 1, remaining 1): Output B2. (0 BL remain)
- **Resulting Feed Slots**:
  `[D1, D2, D3, D4, D5, D6, Row A, Row B, B1, D7, D8, D9, D10, Row C, B2]`
