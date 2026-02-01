# Meme Battle – GenLayer Intelligent Contract

File: `meme_battle_contract.py`

## Public methods
- `generate_situation(seed: str) -> str` (view)
- `rate_answer(situation: str, answer: str) -> bool` (write)
- `get_last_result(user_address: str) -> { score, feedback, rating }` (view)
- `submit_score(user_address: str, total_score: int) -> bool` (write)
- `get_leaderboard(limit: int) -> [{ address, score }, ...]` (view)
- `get_my_best_score() -> int` (view)

## Notes
- `rate_answer` uses GenLayer’s non-comparative equivalence principle to get an LLM-generated score and feedback.
- The last rating is stored per player and can be fetched with `get_last_result` after the transaction is accepted.
