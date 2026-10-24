
import re

PATTERNS = [
    {
        "category": "Possible coercion or blackmail",
        "level": "high",
        "patterns": [
            r"\b(if you|unless you)\b.{0,120}\b(share|leak|expose|post|publish)\b",
            r"\b(share|leak|expose|post|publish)\b.{0,100}\b(private|photos?|pictures?|secrets?)\b",
        ],
        "explanation": "The message may contain threats involving disclosure of private information.",
    },
    {
        "category": "Possible physical threat",
        "level": "high",
        "patterns": [
            r"\b(i will|i'll|gonna)\s+(hurt|kill|attack|hit)\b",
            r"\b(you will|you'll)\s+(regret|pay for)\b",
        ],
        "explanation": "The message may contain language indicating physical harm or intimidation.",
    },
    {
        "category": "Possible persistent unwanted contact",
        "level": "medium",
        "patterns": [
            r"\b(if you|when you)\s+block me\b",
            r"\b(create|make|use)\s+(another|new|fake)\s+account\b",
            r"\b(keep messaging|won't stop contacting)\b",
        ],
        "explanation": "The message suggests possible attempts to continue contact despite boundaries.",
    },
    {
        "category": "Possible intimidation",
        "level": "medium",
        "patterns": [
            r"\bi know (where|which)\b.{0,80}\b(live|college|school|work|stay|attend)\b",
            r"\bi('m| am) watching you\b",
            r"\bi know where you live\b",
        ],
        "explanation": "The message may be using personal information to intimidate someone.",
    },
]

LEVEL_SCORE = {"low": 0, "medium": 1, "high": 2}


def analyze_conversation(text: str):
    messages = [
        line.strip()
        for line in text.splitlines()
        if line.strip()
    ]

    findings = []

    for index, message in enumerate(messages, start=1):
        for rule in PATTERNS:
            if any(
                re.search(pattern, message, re.IGNORECASE)
                for pattern in rule["patterns"]
            ):
                findings.append({
                    "message_number": index,
                    "message": message,
                    "category": rule["category"],
                    "level": rule["level"],
                    "explanation": rule["explanation"],
                })

    highest_score = max(
        (LEVEL_SCORE[item["level"]] for item in findings),
        default=0,
    )

    overall_level = ["low", "medium", "high"][highest_score]

    return {
        "total_messages": len(messages),
        "flagged_messages": len(set(
            item["message_number"] for item in findings
        )),
        "overall_level": overall_level,
        "findings": findings,
        "summary": (
            f"Reviewed {len(messages)} messages and identified "
            f"{len(findings)} potential warning signs. "
            "These findings require human review and context."
        ),
        "recommendations": [
            "Preserve original messages and relevant timestamps.",
            "Avoid sharing additional sensitive information.",
            "Consider contacting a trusted person for support.",
            "If there is an immediate danger, contact local emergency services.",
        ],
        "disclaimer": (
            "This is a limited rule-based screening tool, not a "
            "diagnosis, legal determination, or guarantee of safety. "
            "An unflagged message may still be harmful."
        ),
    }
