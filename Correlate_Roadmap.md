# Correlate — Build Roadmap

## Phase 0: Foundation (Weeks 1-2)
- Set up daily check-in only (mood/energy/free text) — no integrations yet
- Basic storage schema (the normalized signal table)
- Ship a bare-bones version to yourself first — you are user #1, and you need ~2-3 weeks of your own data before the statistical engine has anything to chew on. **Start your own data collection on day one, in parallel with building.**

## Phase 1: Statistical Engine Core (Weeks 3-5)
- Build lag-correlation pipeline on synthetic/sample data first (don't wait for real data to validate the math)
- Implement confidence tiering logic
- Unit-test extensively — this is the trust-critical layer, bugs here are product-breaking, not cosmetic

## Phase 2: First Real Data Source Beyond Check-in (Weeks 6-7)
- Add Google Calendar integration (meeting density as first cross-domain signal)
- Run the statistical engine against your own real check-in + calendar data
- This is your first real "does this actually produce a true, interesting insight" test

## Phase 3: Insight Communication Layer (Weeks 8-9)
- Build the LLM layer strictly on top of structured engine output
- Test extensively for hallucination/embellishment — try to break it, feed it edge cases (very low sample size, borderline confidence) and confirm it hedges appropriately

## Phase 4: CSV Import Sources (Weeks 10-12)
- Screen time CSV import + parsing
- Spending CSV import + categorization
- Re-run full pipeline with 3+ signal types active

## Phase 5: Client Polish + Private Beta (Weeks 13-16)
- Build the daily surface UI
- Recruit 10-20 beta users (friends, forums like r/QuantifiedSelf, r/dataisbeautiful)
- Instrument the success metrics from the PRD from day one of beta

## Phase 6+ (Months 5+): Post-MVP
- Native health/screen-time API integrations (replace manual CSV)
- Bank aggregation API (Plaid or regional equivalent) to replace manual CSV
- Local-first statistical engine (on-device) for privacy differentiation
- B2B aggregate/anonymized version exploration

## Milestone Checkpoints (self-accountability)
- **End of Week 5:** statistical engine produces at least one correct, non-obvious insight on synthetic test data
- **End of Week 9:** LLM layer never fabricates a number across 50 manual test runs
- **End of Week 16:** at least 10 real beta users, at least 3 report a genuinely surprising/useful insight about themselves
