# { "Depends": "py-genlayer:test" }

from genlayer import *
import hashlib
import json


class MemeBattle(gl.Contract):
    situations: DynArray[str]
    best_scores: TreeMap[Address, u32]
    lb_addrs: DynArray[Address]
    lb_scores: DynArray[u32]
    last_score: TreeMap[Address, u8]
    last_feedback: TreeMap[Address, str]
    total_rounds: u8
    max_lb: u32

    def __init__(self):
        self.total_rounds = u8(5)
        self.max_lb = u32(5)

        self.situations.append("When you try to explain to your parents what an NFT is")
        self.situations.append("Your face when the code works on the first try")
        self.situations.append("When you check your crypto wallet after the weekend")
        self.situations.append("When you try to explain blockchain to your grandma")
        self.situations.append("When gas fees cost more than the transaction")
        self.situations.append("When your friend says crypto is a pyramid scheme")
        self.situations.append("Your reaction to a pull request with 500 changes")
        self.situations.append('When the designer says: "Just move it 2 pixels"')

    @gl.public.view
    def get_total_rounds(self) -> u8:
        return self.total_rounds

    @gl.public.view
    def generate_situation(self, seed: str) -> str:
        if len(self.situations) == 0:
            return "No situations available."
        sender = gl.message.sender_address
        h = hashlib.sha256((seed + str(sender)).encode("utf-8")).digest()
        idx = int.from_bytes(h[:4], "big") % len(self.situations)
        return self.situations[idx]

    def _get_best(self, addr: Address) -> u32:
        try:
            return self.best_scores[addr]
        except Exception:
            return u32(0)

    def _set_last(self, addr: Address, score: int, feedback: str):
        if score < 0:
            score = 0
        if score > 10:
            score = 10
        fb = feedback.strip().replace("\n", " ")
        if len(fb) > 200:
            fb = fb[:200]
        self.last_score[addr] = u8(score)
        self.last_feedback[addr] = fb

    @gl.public.write
    def rate_answer(self, situation: str, answer: str) -> bool:
        sender = gl.message.sender_address
        a = answer.strip()
        if len(a) == 0:
            raise Rollback("Empty answer")
        if len(a) > 600:
            raise Rollback("Answer too long")

        prompt = (
            "You are a strict-but-fun meme judge.\n"
            "Score the player's meme response for humor and creativity.\n"
            "Return ONLY valid JSON with keys:\n"
            '  "score": integer from 0 to 10,\n'
            '  "feedback": string <= 200 chars.\n'
            "No markdown. No extra keys.\n\n"
            f"Situation:\n{situation}\n\n"
            f"Answer:\n{a}\n"
        )

        task = "Return JSON only."
        criteria = (
            "Output must be valid JSON only. "
            "Keys must be score (int 0..10) and feedback (string <= 200 chars). "
            "No extra keys. No markdown."
        )

        try:
            raw = gl.eq_principle_prompt_non_comparative(lambda: prompt, task=task, criteria=criteria)
            data = json.loads(raw)
            score = int(data.get("score", 5))
            feedback = str(data.get("feedback", "Nice!")).strip()
            self._set_last(sender, score, feedback)
        except Exception:
            h = hashlib.sha256((situation + "|" + a + "|" + str(sender)).encode("utf-8")).digest()
            score = int(h[0] % 6) + 5
            preset = {
                10: "Perfect. Meme wizard energy. 🔥",
                9: "Super creative and genuinely funny. 😂",
                8: "Solid meme. Good idea, could be punchier. 👍",
                7: "Not bad. A bit predictable, but it works. 🙂",
                6: "Okay. Try a weirder twist next time. 🤔",
                5: "Weak sauce. Go bolder and more original. 😅",
            }
            self._set_last(sender, score, preset.get(score, "Nice try!"))

        return True

    @gl.public.view
    def get_last_result(self, user_address: str) -> str:
        try:
            addr = Address(user_address)
        except Exception:
            return json.dumps({"score": 0, "rating": "0/10", "feedback": "Invalid address."})

        s = 0
        try:
            s = int(self.last_score[addr])
        except Exception:
            s = 0

        fb = ""
        try:
            fb = self.last_feedback[addr]
        except Exception:
            fb = ""

        return json.dumps({"score": s, "rating": f"{s}/10", "feedback": fb})

    def _lb_find(self, addr: Address) -> int:
        i = 0
        while i < len(self.lb_addrs):
            if self.lb_addrs[i] == addr:
                return i
            i += 1
        return -1

    def _lb_sort_and_trim(self):
        n = len(self.lb_scores)
        i = 0
        while i < n:
            j = 0
            while j + 1 < n:
                if int(self.lb_scores[j + 1]) > int(self.lb_scores[j]):
                    sa = self.lb_scores[j]
                    sb = self.lb_scores[j + 1]
                    aa = self.lb_addrs[j]
                    ab = self.lb_addrs[j + 1]
                    self.lb_scores[j] = sb
                    self.lb_scores[j + 1] = sa
                    self.lb_addrs[j] = ab
                    self.lb_addrs[j + 1] = aa
                j += 1
            i += 1

        limit = int(self.max_lb)
        while len(self.lb_scores) > limit:
            self.lb_scores.pop()
            self.lb_addrs.pop()

    @gl.public.write
    def submit_score(self, user_address: str, total_score: u32) -> bool:
        sender = gl.message.sender_address
        provided = Address(user_address)
        if provided != sender:
            raise Rollback("user_address must match sender")

        prev = int(self._get_best(sender))
        newv = int(total_score)
        if newv <= prev:
            return True

        self.best_scores[sender] = total_score

        idx = self._lb_find(sender)
        if idx == -1:
            self.lb_addrs.append(sender)
            self.lb_scores.append(total_score)
        else:
            self.lb_scores[idx] = total_score

        self._lb_sort_and_trim()
        return True

    @gl.public.view
    def get_leaderboard(self, limit: u32) -> str:
        lim = int(limit)
        if lim <= 0:
            lim = 1
        if lim > int(self.max_lb):
            lim = int(self.max_lb)

        rows = []
        i = 0
        while i < lim and i < len(self.lb_addrs):
            rows.append({"address": str(self.lb_addrs[i]), "score": int(self.lb_scores[i])})
            i += 1

        return json.dumps(rows)

    @gl.public.view
    def get_my_best_score(self) -> u32:
        return self._get_best(gl.message.sender_address)
