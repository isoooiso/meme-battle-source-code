# { "Depends": "py-genlayer:test" }

from genlayer import *
from dataclasses import dataclass
import hashlib
import json
import typing


@allow_storage
@dataclass
class LeaderboardEntry:
    address: Address
    score: u32


class MemeBattle(gl.Contract):
    situations: DynArray[str]
    best_scores: TreeMap[Address, u32]
    leaderboard: DynArray[LeaderboardEntry]
    total_rounds: u8
    max_leaderboard_size: u32
    last_scores: TreeMap[Address, u8]
    last_feedback: TreeMap[Address, str]

    def __init__(self):
        self.situations = DynArray[str]()
        self.best_scores = TreeMap[Address, u32]()
        self.leaderboard = DynArray[LeaderboardEntry]()
        self.last_scores = TreeMap[Address, u8]()
        self.last_feedback = TreeMap[Address, str]()
        self.total_rounds = 5
        self.max_leaderboard_size = 5

        self.situations.append('When you try to explain to your parents what an NFT is')
        self.situations.append('Your face when the code works on the first try')
        self.situations.append('When you check your crypto wallet balance after the weekend')
        self.situations.append('When you try to explain blockchain to your grandma')
        self.situations.append("When gas fees cost more than the transaction itself")
        self.situations.append('When your friend says crypto is a pyramid scheme')
        self.situations.append('Your reaction to a pull request with 500 changes')
        self.situations.append('When the designer says: "Just move it 2 pixels"')

    @gl.public.view
    def get_total_rounds(self) -> int:
        return int(self.total_rounds)

    @gl.public.view
    def generate_situation(self, seed: str) -> str:
        if len(self.situations) == 0:
            return 'No situations available.'
        sender = gl.message.sender_address
        h = hashlib.sha256((seed + str(sender)).encode('utf-8')).digest()
        idx = int.from_bytes(h[:4], 'big') % len(self.situations)
        return self.situations[idx]

    @gl.public.write
    def rate_answer(self, situation: str, answer: str) -> bool:
        sender = gl.message.sender_address

        prompt = (
            "You are the judge in a solo meme game. "
            "Score the player's meme response for humor and creativity.

"
            "Return ONLY valid JSON (no markdown, no extra text) with keys:
"
            '  "score": integer from 0 to 10,
'
            '  "feedback": a short single-paragraph string (max 200 chars).

'
            "Situation:
"
            f"{situation}

"
            "Player answer:
"
            f"{answer}
"
        )

        task = "Return JSON only."
        criteria = (
            "The response must be valid JSON and nothing else. "
            "It must contain keys score (integer 0..10) and feedback (string, <=200 chars). "
            "No extra keys. No markdown. No newlines in feedback."
        )

        score = 5
        feedback = "Nice try! Add more absurdity and a sharper punchline."
        try:
            raw = gl.eq_principle_prompt_non_comparative(
                lambda: prompt,
                task=task,
                criteria=criteria,
            )
            data = json.loads(raw)
            score = int(data.get("score", 5))
            if score < 0:
                score = 0
            if score > 10:
                score = 10
            feedback = str(data.get("feedback", feedback)).strip().replace("\n", " ")
            if len(feedback) > 200:
                feedback = feedback[:200]
        except Exception:
            h = hashlib.sha256((situation + "|" + answer + "|" + str(sender)).encode("utf-8")).digest()
            score = int(h[0] % 6) + 5
            preset = {
                10: "Perfect. Meme wizard energy. 🔥",
                9: "Super creative and genuinely funny. 😂",
                8: "Solid meme. Good idea, could be punchier. 👍",
                7: "Not bad. A bit predictable, but it works. 🙂",
                6: "Okay. Try a weirder twist next time. 🤔",
                5: "Weak sauce. Go bolder and more original. 😅",
            }
            feedback = preset.get(score, feedback)

        self.last_scores[sender] = score
        self.last_feedback[sender] = feedback
        return True

    @gl.public.view
    def get_last_result(self, user_address: str) -> dict[str, typing.Any]:
        try:
            addr = Address(user_address)
        except Exception:
            return {"score": 0, "feedback": "Invalid address.", "rating": "0/10"}

        score = int(self.last_scores.get(addr, 0))
        feedback = self.last_feedback.get(addr, "")
        return {"score": score, "feedback": feedback, "rating": f"{score}/10"}

    @gl.public.write
    def submit_score(self, user_address: str, total_score: int) -> bool:
        sender = gl.message.sender_address
        try:
            provided = Address(user_address)
        except Exception:
            return False
        if provided != sender:
            return False
        if total_score < 0:
            return False

        prev_best = int(self.best_scores.get(sender, 0))
        new_score = int(total_score)

        if new_score <= prev_best:
            return True

        self.best_scores[sender] = new_score
        self._upsert_leaderboard(sender, new_score)
        return True

    def _upsert_leaderboard(self, addr: Address, score: int):
        entries: list[LeaderboardEntry] = []
        found = False
        for e in self.leaderboard:
            if e.address == addr:
                entries.append(LeaderboardEntry(address=addr, score=score))
                found = True
            else:
                entries.append(e)

        if not found:
            entries.append(LeaderboardEntry(address=addr, score=score))

        entries.sort(key=lambda x: int(x.score), reverse=True)

        new_lb = DynArray[LeaderboardEntry]()
        limit = int(self.max_leaderboard_size)
        for i, e in enumerate(entries):
            if i >= limit:
                break
            new_lb.append(e)

        self.leaderboard = new_lb

    @gl.public.view
    def get_leaderboard(self, limit: int) -> list[dict[str, typing.Any]]:
        lim = int(limit)
        if lim <= 0:
            return []
        if lim > int(self.max_leaderboard_size):
            lim = int(self.max_leaderboard_size)

        out: list[dict[str, typing.Any]] = []
        for i, e in enumerate(self.leaderboard):
            if i >= lim:
                break
            out.append({"address": str(e.address), "score": int(e.score)})
        return out

    @gl.public.view
    def get_my_best_score(self) -> int:
        sender = gl.message.sender_address
        return int(self.best_scores.get(sender, 0))
