
import re

# Individual-message warning patterns.
PATTERNS = [
    {
        "category": "Possible coercion or blackmail",
        "level": "high",
        "patterns": [
            r"\b(if you|unless you)\b.{0,120}\b(share|leak|expose|post|publish)\b",
            r"\b(share|leak|expose|post|publish)\b.{0,100}\b(private|photos?|pictures?|secrets?)\b",
        ],
        "explanation": (
            "The message may contain threats involving "
            "disclosure of private information."
        ),
    },
    {
        "category": "Possible physical threat",
        "level": "high",
        "patterns": [
            r"\b(i will|i'll|gonna)\s+(hurt|kill|attack|hit)\b",
            r"\b(you will|you'll)\s+(regret|pay for)\b",
        ],
        "explanation": (
            "The message may contain language indicating "
            "physical harm or intimidation."
        ),
    },
    {
        "category": "Possible persistent unwanted contact",
        "level": "medium",
        "patterns": [
            r"\b(if you|when you)\s+block me\b",
            r"\b(create|make|use)\s+(another|new|fake)\s+account\b",
            r"\b(keep messaging|won't stop contacting)\b",
        ],
        "explanation": (
            "The message suggests possible attempts to "
            "continue contact despite boundaries."
        ),
    },
    {
        "category": "Possible intimidation",
        "level": "medium",
        "patterns": [
            r"\bi know (where|which)\b.{0,80}\b(live|college|school|work|stay|attend)\b",
            r"\bi('m| am) watching you\b",
            r"\bi know where you live\b",
        ],
        "explanation": (
            "The message may be using personal information "
            "to intimidate someone."
        ),
    },
]

# Patterns used to identify possible escalation.
PRESSURE_PATTERNS = [
    r"\bwhy (aren't|are not|won't|don't) you (replying|responding|answering)\b",
    r"\b(reply|respond|answer) (to me|now|immediately)\b",
    r"\byou (can't|cannot) ignore me\b",
    r"\bi('ve| have) (sent|been sending) you messages\b",
    r"\bi (keep|kept) (calling|texting|messaging) you\b",
    r"\bwhy are you ignoring me\b",
]

BOUNDARY_PATTERNS = [
    r"\b(if|when) you block me\b",
    r"\b(create|make|use) (another|new|fake) account\b",
    r"\bwon't stop (contacting|messaging|calling|texting) you\b",
    r"\bi('ll| will) keep (calling|texting|messaging)\b",
]

LEVEL_SCORE = {
    "low": 0,
    "medium": 1,
    "high": 2,
}


def matches_any(message, patterns):
    return any(
        re.search(pattern, message, re.IGNORECASE)
        for pattern in patterns
    )


def analyze_conversation(text: str):
    messages = [
        line.strip()
        for line in text.splitlines()
        if line.strip()
    ]

    findings = []

    # Stage 1: Analyze each message independently.
    for index, message in enumerate(messages, start=1):
        for rule in PATTERNS:
            if matches_any(message, rule["patterns"]):
                findings.append({
                    "message_number": index,
                    "message": message,
                    "category": rule["category"],
                    "level": rule["level"],
                    "explanation": rule["explanation"],
                })

    # Stage 2: Identify messages containing repeated pressure
    # or attempts to bypass boundaries.
    pressure_indices = [
        index
        for index, message in enumerate(messages, start=1)
        if matches_any(message, PRESSURE_PATTERNS)
    ]

    boundary_indices = [
        index
        for index, message in enumerate(messages, start=1)
        if matches_any(message, BOUNDARY_PATTERNS)
    ]

    # Two separate pressure messages may indicate a pattern.
    if len(pressure_indices) >= 2:
        latest_index = pressure_indices[-1]

        findings.append({
            "message_number": latest_index,
            "message": messages[latest_index - 1],
            "category": "Possible repeated communication pressure",
            "level": "medium",
            "explanation": (
                "Messages "
                + ", ".join(map(str, pressure_indices))
                + " contain repeated requests or pressure to respond. "
                "The pattern may be concerning depending on context."
            ),
        })

    # Detect possible boundary circumvention.
    if boundary_indices:
        latest_index = boundary_indices[-1]

        findings.append({
            "message_number": latest_index,
            "message": messages[latest_index - 1],
            "category": "Possible boundary circumvention",
            "level": "medium",
            "explanation": (
                "The conversation contains language suggesting "
                "continued contact or attempts to bypass blocking. "
                "Review messages "
                + ", ".join(map(str, boundary_indices))
                + " in context."
            ),
        })

    # Stage 3: Look for intimidation or threats appearing
    # after earlier pressure.
    threatening_categories = {
        "Possible coercion or blackmail",
        "Possible physical threat",
        "Possible intimidation",
    }

    threat_findings = [
        finding
        for finding in findings
        if finding["category"] in threatening_categories
    ]

    escalating_threats = [
        finding
        for finding in threat_findings
        if any(
            pressure_index < finding["message_number"]
            for pressure_index in pressure_indices
        )
    ]

    if escalating_threats:
        latest = max(
            escalating_threats,
            key=lambda finding: finding["message_number"]
        )

        findings.append({
            "message_number": latest["message_number"],
            "message": latest["message"],
            "category": "Possible escalation toward intimidation",
            "level": "high",
            "explanation": (
                "Earlier messages contain communication pressure, "
                "followed by language potentially involving "
                "intimidation or threats. This sequence warrants "
                "careful human review."
            ),
        })

    # Sort findings into conversation order.
    findings.sort(
        key=lambda finding: (
            finding["message_number"],
            -LEVEL_SCORE[finding["level"]],
        )
    )

    highest_score = max(
        (
            LEVEL_SCORE[finding["level"]]
            for finding in findings
        ),
        default=0,
    )

    overall_level = ["low", "medium", "high"][highest_score]

    flagged_messages = len({
        finding["message_number"]
        for finding in findings
    })

    return {
        "total_messages": len(messages),
        "flagged_messages": flagged_messages,
        "overall_level": overall_level,
        "findings": findings,
        "summary": (
            f"Reviewed {len(messages)} messages and identified "
            f"{len(findings)} potential warning signs, including "
            "possible multi-message behavioral patterns. "
            "These findings require human review and context."
        ),
        "recommendations": [
            "Preserve original messages and relevant timestamps.",
            "Avoid sharing additional sensitive information.",
            "Consider contacting a trusted person for support.",
            "If contact is unwanted, consider documenting and using platform blocking or reporting tools.",
            "If there is an immediate danger, contact local emergency services.",
        ],
        "disclaimer": (
            "DigitalShield AI uses explainable, predefined rules "
            "to screen text for potential warning signs. "
            "It cannot establish intent, identify speakers, "
            "or determine whether a situation is safe. "
            "Multi-message patterns assume the input order "
            "reflects the conversation sequence. "
            "Findings are not legal conclusions and require "
            "human review."
        ),
    }
