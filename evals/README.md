# Behavior evaluations

These fixtures are a small, repeatable review protocol, not an automated model leaderboard.

For a contract or trigger change:

1. Run the relevant prompt without the skill and save the result as the baseline.
2. Run the same prompt with the canonical skill enabled.
3. Score both outputs against every rubric item in `cases.json`.
4. Record host, model, date, input context, failures, and any reviewer disagreement in the pull request.
5. Prefer evidence from an implemented page and browser runtime when the task permits it.

Do not commit user conversations, private source code, credentials, local paths, or unredacted screenshots as eval inputs or outputs. Automated CI validates the fixture structure only; maintainers deliberately run model behavior evaluations when behavior changes.
