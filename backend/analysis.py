"""
Rule-based text checks for a job posting.

This is separate from the ML model: the model gives one overall fraud
probability; these deterministic rules look for specific, well-known scam
patterns (upfront fees, payment requests, requests for OTP/bank details...)
and quote the exact text that matched. Nothing here changes the model's
probability or the thresholded prediction.

Guarantees:
* Every suspicious phrase is copied verbatim from the submitted text.
* A phrase preceded by a negation in the same sentence (e.g. "No registration
  fee is charged") is not reported for rules where negation flips the meaning.
* A posting with no matches returns empty lists - nothing is invented.
"""

import re
from dataclasses import dataclass

MAX_PHRASES = 15
_SEVERITY_ORDER = {"high": 0, "medium": 1, "low": 2}

# Fields scanned, in display order. "description" is the main posting text.
FIELD_LABELS = {
    "title": "Job title",
    "description": "Job description",
    "company_profile": "Company profile",
    "requirements": "Requirements",
    "benefits": "Benefits",
    "salary_range": "Salary range",
    "location": "Location",
    "industry": "Industry",
    "function": "Function",
    "employment_type": "Employment type",
    "required_experience": "Required experience",
    "required_education": "Required education",
}

_MONEY = r"(?:rs\.?|inr|₹|\$|usd)\s?\d[\d,]*(?:\.\d+)?"
_NEGATION = re.compile(r"\b(?:no|not|never|without|zero|free of)\b|n't\b", re.IGNORECASE)
_EMAIL = re.compile(r"[\w.+-]+@([\w-]+(?:\.[\w-]+)+)", re.IGNORECASE)
FREE_EMAIL_DOMAINS = {
    "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.in", "ymail.com", "outlook.com",
    "hotmail.com", "live.com", "rediffmail.com", "aol.com", "icloud.com", "protonmail.com", "proton.me",
}


@dataclass
class Rule:
    key: str
    signal: str            # short title shown on the results page
    explanation: str       # why it matters
    severity: str          # "high" | "medium" | "low"
    patterns: tuple        # compiled regular expressions
    negatable: bool        # skip matches preceded by "no/not/never..." in the same clause
    checklist: tuple       # (item, description) pairs added when the rule matches


def _rule(key, signal, explanation, severity, patterns, negatable=True, checklist=()):
    compiled = tuple(re.compile(p, re.IGNORECASE) for p in patterns)
    return Rule(key, signal, explanation, severity, compiled, negatable, checklist)


RULES = (
    _rule(
        "upfront_payment",
        "Asks for money before you start",
        "The posting asks the candidate to pay before starting. An upfront recruitment or onboarding "
        "fee is a significant warning sign. Verify the employer independently and do not pay based "
        "on the posting.",
        "high",
        (
            r"\b(?:registration|processing|training|joining|onboarding|application|interview|"
            r"verification|kit|entry|membership|security)(?: processing)? (?:fees?|charges?)\b",
            r"\b(?:security|refundable|caution) deposit\b",
            r"\bdeposit (?:of )?" + _MONEY,
            r"\b(?:pay|send|transfer) (?:a |the |an )?(?:one[- ]time |small |nominal )?"
            r"(?:fee|deposit|amount|charge)\b",
            r"\b(?:pay|send|transfer) " + _MONEY,
            # Payment demanded without naming a fee, e.g. "Applicants must pay for AI tools".
            r"\b(?:must|need to|needs to|have to|has to|required to|asked to) (?:first )?"
            r"(?:pay|make (?:a |the )?payment|purchase|buy)\b",
            r"\bpay(?:ing)? for (?:the |your )?(?:\w+ ){0,2}(?:tools?|kit|training|software|course|"
            r"materials?|laptop|registration|verification|certificate|id card)\b",
            r"\b(?:completes?|after|upon) (?:the )?payment\b",
        ),
        checklist=(
            ("Confirm that no payment is required",
             "Ask the company's official HR contact, in writing, whether any fee is charged at any stage."),
        ),
    ),
    _rule(
        "payment_channel",
        "Mentions a payment method used in scams",
        "The posting asks for payment through a UPI ID, wallet, gift card, crypto or money-transfer "
        "service. These payments are hard to trace or reverse and are often used in job scams.",
        "high",
        # Payment *requests* only, so ordinary mentions (e.g. a fintech job about UPI) don't match.
        (
            r"\bUPI (?:ID|address|handle|number)\b",
            r"\b(?:via|by|through|on|to|using) (?:our |the |this |my )?UPI\b",
            # UPI handle such as name@okaxis - but not an email address like jobs@okta.com
            r"\b[\w.-]+@(?:okaxis|okhdfcbank|okicici|oksbi|ybl|ibl|axl|upi|paytm|apl)\b(?!\.\w)",
            r"\b(?:via|by|through|on|to|using) (?:paytm|phonepe|google pay|gpay)\b",
            r"\bpayment screenshot\b",
            r"\b(?:buy|purchase|send|pay (?:with|by|in|via)) (?:\w+ )?gift cards?\b",
            r"\b(?:pay|payment|send|deposit|transfer)\w* (?:in |via |by |using |with )?"
            r"(?:bitcoin|cryptocurrency|crypto|usdt)\b",
            r"\b(?:via|by|through|using) (?:western union|moneygram|wire transfer)\b",
        ),
        checklist=(
            ("Check where any money would go",
             "Never send money to a personal UPI ID, wallet, gift card or crypto address for a job."),
        ),
    ),
    _rule(
        "sensitive_data",
        "Asks for sensitive personal or financial details",
        "The posting asks for details such as an OTP, password, bank details or ID numbers. Sharing "
        "these before the employer is verified can lead to fraud or identity theft.",
        "high",
        (
            r"\bOTP\b",
            r"\baadh?aa?r(?: card| number| details)?\b",
            r"\bPAN (?:card|number)\b",
            r"\bbank (?:account )?(?:details|number)\b",
            r"\bCVV\b",
            r"\b(?:ATM|debit card|credit card|net ?banking) (?:pin|password|details)\b",
            r"\bsocial security number\b",
            r"\b(?:share|send|provide|give|tell|enter) (?:us )?(?:your |the )?(?:\w+ ){0,2}passwords?\b",
        ),
        checklist=(
            ("Hold back sensitive details",
             "Share ID or bank details only after a verified written offer, through the employer's "
             "official onboarding. Never share an OTP with anyone."),
        ),
    ),
    _rule(
        "no_screening",
        "Job offered without an interview or screening",
        "The posting offers a job or offer letter without an interview or any screening. Most "
        "employers assess candidates before making an offer, so this is a significant warning "
        "sign, especially alongside a request for money.",
        "high",
        (
            r"\bwithout (?:an |any )?(?:interviews?|screening|selection process|assessment)\b",
            r"\bno (?:interviews?|screening|selection process)(?: (?:is |are )?(?:needed|required))?\b",
            r"\b(?:immediate|instant|direct|on[- ]the[- ]spot|same[- ]day) (?:job )?"
            r"(?:offers?|offer letters?|selection|hiring)\b",
        ),
        checklist=(
            ("Ask about the selection process",
             "Ask the employer's official HR contact how candidates are assessed and who will interview you."),
        ),
    ),
    _rule(
        "refund_promise",
        "Promises that a payment will be refunded",
        "The posting says money paid by the candidate will be returned later. A promised refund is "
        "often used to make an upfront fee seem safe, and there is no way to confirm it from the posting.",
        "high",
        (
            # "fee will be refunded", "deposit is fully refundable" - but not "non-refundable"
            r"\b(?:fees?|deposits?|amount|payments?|charges?|money)\b (?:is |are |will be |shall be |"
            r"would be |gets |get )?(?:fully |completely |100% )?(?<!non-)(?<!non)refund(?:ed|able)\b",
            r"\brefund(?:ed)? (?:with|in|from|after|along with) (?:your |the )?(?:first |1st )?"
            r"(?:salary|month|payslip|stipend|paycheck)\b",
            r"\b(?:fully |100% )?(?<!non-)(?<!non)refundable (?:\w+ )?(?:fees?|deposits?|amount|charges?)\b",
        ),
        checklist=(
            ("Don't rely on a refund promise",
             "A promise to refund a fee later cannot be checked from the posting. Ask the employer's "
             "official HR contact in writing whether any payment is required at all."),
        ),
    ),
    _rule(
        "unrealistic_promises",
        "Promises that sound too easy",
        "The posting promises guaranteed selection or income, or high pay for little work or "
        "experience. Claims like these are common in scam postings; compare them with similar roles.",
        "medium",
        (
            r"\bguaranteed? (?:selection|income|job|placement|salary|returns?|payments?|payouts?)\b",
            r"\b(?:selection|income|payment|salary|returns?|payouts?) (?:is |are )?guaranteed\b",
            r"\b100% (?:guaranteed|returns?|job|placement)\b",
            r"\bno (?:experience|skills?|resume|qualifications?) (?:is |are )?(?:needed|required)\b",
            r"\b(?:earn|make) (?:up to )?" + _MONEY + r" (?:per|a|every|each) (?:day|hour|week)\b",
            r"\b(?:high|huge|unlimited) (?:salary|income|earnings?) guaranteed\b",
            r"\bdaily payouts?\b",
        ),
        negatable=False,
        checklist=(
            ("Compare the pay and promises",
             "Compare the pay with similar roles on trusted job portals. Real offers rarely guarantee "
             "selection or income."),
        ),
    ),
    _rule(
        "urgency",
        "Pressure to act quickly",
        "The posting uses deadlines or limited-availability claims. Pressure to act quickly can stop "
        "you from checking an offer properly.",
        "medium",
        (
            r"\burgent(?:ly)? (?:hiring|requirement|joining)\b",
            # Quote the whole pressure phrase, e.g. "Limited seats available; apply today".
            r"\blimited (?:seats|slots|vacancies|positions|period)(?: (?:available|left|only))?"
            r"(?:[;,.!-]? ?(?:so )?(?:apply|join|register|enrol+|book|hurry)(?: (?:today|now|immediately|fast))?)?",
            r"\b(?:seats|slots) are limited\b",
            r"\b(?:closes?|closing|expires?) (?:today|tonight)\b",
            r"\b(?:before|by) (?:today|tonight)\b",
            r"\bwithin (?:\d+|twenty[- ]four) (?:hours|hrs)\b",
            r"\bact now\b",
            r"\bimmediately to (?:lock|confirm|secure|activate|book)\b",
        ),
        negatable=False,
        checklist=(
            ("Take your time",
             "Deadlines like 'today only' are a pressure tactic. A real employer will give you time "
             "to verify the offer."),
        ),
    ),
    _rule(
        "informal_channel",
        "Uses chat apps instead of official channels",
        "The posting moves contact or interviews to WhatsApp, Telegram or chat. This makes the "
        "employer harder to verify than an official email address and a scheduled interview.",
        "medium",
        (
            r"\bwhats ?app\b",
            r"\btelegram\b",
            r"\binterview (?:will be )?(?:conducted )?(?:over|on|via) (?:\w+ )?chat\b",
        ),
        checklist=(
            ("Ask for a proper interview",
             "Request a video or in-person interview scheduled from an official company email address."),
        ),
    ),
    _rule(
        "suspicious_link",
        "Contains a link that hides where it goes",
        "Shortened links, direct chat-app links, bare IP addresses and app downloads hide the real "
        "destination and are often used for phishing or malware.",
        "medium",
        (
            r"\b(?:https?://)?(?:bit\.ly|tinyurl\.com|goo\.gl|cutt\.ly|rb\.gy|is\.gd|tiny\.cc|"
            r"shorturl\.at|t\.ly)/[\w-]+",
            r"\b(?:https?://)?(?:wa\.me|t\.me)/[\w+-]+",
            r"\bhttps?://\d{1,3}(?:\.\d{1,3}){3}\S*",
            r"\b[\w-]+\.apk\b",
        ),
        negatable=False,
        checklist=(
            ("Don't open unknown links",
             "Type the company's official website address yourself instead of using shortened or chat links, "
             "and never install an app (.apk) sent by a recruiter."),
        ),
    ),
    _rule(
        "secrecy",
        "Asks you to keep it secret or avoid the company",
        "Being told not to share the offer or not to contact the company directly stops you from "
        "verifying it.",
        "medium",
        (
            r"\bdo not (?:share|tell|disclose) (?:this|the) (?:opportunity|offer|message|job)\b",
            r"\bdon'?t (?:share|tell|disclose) (?:this|the) (?:opportunity|offer|message|job)\b",
            r"\b(?:do not|don'?t) contact the company(?: directly)?\b",
            r"\bkeep (?:this|it) (?:confidential|secret)\b",
        ),
        negatable=False,
        checklist=(
            ("Talk to someone you trust",
             "Discuss the offer with family, friends or your college placement cell before you respond."),
        ),
    ),
    _rule(
        "recruitment_earnings",
        "Earnings depend on recruiting others",
        "Pay linked to referring friends or joining a paid group suggests a pyramid or task scam, "
        "not a regular job.",
        "medium",
        (
            r"\brefer (?:\d+|two|three|four|five|ten) (?:friends|people|members|contacts)\b",
            r"\bpaid member(?:ship)? group\b",
        ),
        negatable=False,
        checklist=(
            ("Check how the pay is earned",
             "If earnings depend on recruiting others or joining a paid group, it is not a regular job."),
        ),
    ),
)

FREE_EMAIL_RULE = _rule(
    "free_email",
    "Recruiter uses a free personal email address",
    "Most companies recruit from an email address on their own domain. A free webmail address is "
    "not proof of fraud, but it is easy for anyone to create.",
    "low",
    (),
    checklist=(
        ("Check the email domain",
         "Confirm the recruiter's email domain matches the company's official website."),
    ),
)

INVALID_DOMAIN_RULE = _rule(
    "invalid_contact_domain",
    "Contact email uses a domain that cannot exist",
    "The contact email ends in a reserved domain (such as .invalid, .test or example.com) that "
    "cannot be registered, so it cannot belong to a real company. It may be a typo or placeholder, "
    "but you cannot verify the employer through it.",
    "high",
    (),
    checklist=(
        ("Find a working contact yourself",
         "Look up the company's official website and contact details independently; do not rely on "
         "the email address in the posting."),
    ),
)

# Reserved for documentation/testing and never registrable (RFC 2606, RFC 6761).
RESERVED_TLDS = {"invalid", "test", "example", "localhost", "local"}
RESERVED_DOMAINS = {"example.com", "example.net", "example.org"}

EMAIL_RULES = (INVALID_DOMAIN_RULE, FREE_EMAIL_RULE)

BASE_CHECKLIST = (
    ("Verify the company exists",
     "Find its official website and registration details yourself (for Indian companies, the MCA "
     "company search) instead of using links or numbers in the posting."),
    ("Find the job on the official careers page",
     "Check that the same role is listed on the company's own website or verified LinkedIn page."),
    ("Confirm the recruiter's identity",
     "Look for an email address on the company's official domain and a recruiter profile you can verify."),
)


def _negated(text, start):
    """True if a negation word appears earlier in the same clause, close to the match."""
    window = re.split(r"[.!?\n;:,]|\bbut\b", text[max(0, start - 40):start], flags=re.IGNORECASE)[-1]
    return bool(_NEGATION.search(window))


def _clean(phrase):
    return phrase.strip(" \t\r\n.,;:!?\"'()[]")


def _email_rule(domain):
    """Which email rule (if any) applies to a contact domain."""
    domain = domain.lower().rstrip(".")
    if domain.rsplit(".", 1)[-1] in RESERVED_TLDS or any(
            domain == d or domain.endswith("." + d) for d in RESERVED_DOMAINS):
        return INVALID_DOMAIN_RULE.key
    if domain in FREE_EMAIL_DOMAINS:
        return FREE_EMAIL_RULE.key
    return None


def _drop_contained(spans):
    """Remove spans that lie inside a longer span from the same field (e.g. a duplicate sub-phrase)."""
    return [
        s for s in spans
        if not any(o is not s and o.field == s.field and o.start <= s.start and s.end <= o.end
                   and (o.end - o.start) > (s.end - s.start) for o in spans)
    ]


@dataclass
class Match:
    rule: str
    field: str
    start: int
    end: int
    phrase: str     # verbatim text from the submission


FIELD_ORDER = list(FIELD_LABELS) + ["recruiter_email"]


def find_matches(fields, recruiter_email=""):
    """Return {rule_key: [Match, ...]}: verbatim evidence from the submitted text, in reading order."""
    found = []
    for name in FIELD_LABELS:
        text = fields.get(name) or ""
        if not text:
            continue
        for rule in RULES:
            for pattern in rule.patterns:
                for m in pattern.finditer(text):
                    if rule.negatable and _negated(text, m.start()):
                        continue
                    phrase = _clean(m.group(0))
                    if phrase:
                        start = m.start() + m.group(0).index(phrase)
                        found.append(Match(rule.key, name, start, start + len(phrase), phrase))
        for m in _EMAIL.finditer(text):
            key = _email_rule(m.group(1))
            if key:
                found.append(Match(key, name, m.start(), m.end(), m.group(0)))

    email = (recruiter_email or "").strip()
    if "@" in email:
        key = _email_rule(email.rsplit("@", 1)[-1])
        if key:
            found.append(Match(key, "recruiter_email", 0, len(email), email))

    # Within one rule, overlapping matches in the same field become one quote, sliced verbatim
    # from the original text (e.g. "fee will be refunded" + "refunded with your first salary").
    texts = {**{name: fields.get(name) or "" for name in FIELD_LABELS}, "recruiter_email": email}
    matches = {}
    for match in sorted(found, key=lambda m: (FIELD_ORDER.index(m.field), m.start)):
        items = matches.setdefault(match.rule, [])
        last = items[-1] if items else None
        if last and last.field == match.field and match.start < last.end:
            last.end = max(last.end, match.end)
            last.phrase = texts[last.field][last.start:last.end]
        else:
            items.append(match)
    return matches


def _recommended_actions(keys, is_fraudulent):
    actions = []
    if is_fraudulent and keys:
        actions.append("Treat this listing as high risk: the model score is above the alert threshold "
                       "and the rule-based checks also found warning signs.")
    elif is_fraudulent:
        actions.append("The model flagged this listing from its overall wording, although no specific "
                       "warning phrases were matched. Verify the employer before going further.")
    elif keys:
        actions.append("The model score is below the alert threshold, but the rule-based checks found "
                       "warning signs. Do not rely on the score alone; verify before you respond.")
    else:
        actions.append("No specific warning signs were found and the model score is below the alert "
                       "threshold. This is not a guarantee, so still verify the employer before sharing "
                       "personal details.")
    if keys & {"upfront_payment", "payment_channel", "recruitment_earnings", "refund_promise"}:
        actions.append("Do not pay any fee, deposit or charge based on this posting, even if a refund is promised.")
    if "sensitive_data" in keys:
        actions.append("Do not share OTPs, bank or card details, or ID documents such as Aadhaar or PAN "
                       "until you have verified the employer. Never share an OTP with anyone.")
    if keys & {"informal_channel", "free_email", "secrecy", "suspicious_link", "invalid_contact_domain"}:
        actions.append("Contact the company using details from its official website, not the phone "
                       "number, chat or email in this message, and ask them to confirm the opening.")
    actions.append("Apply through the company's official careers page or a trusted job portal where possible.")
    if is_fraudulent or keys & {"upfront_payment", "payment_channel", "sensitive_data", "refund_promise"}:
        actions.append("If you have already paid or shared details, contact your bank immediately. In India "
                       "you can report it at cybercrime.gov.in or by calling 1930.")
    return actions


def analyze_posting(fields, recruiter_email="", is_fraudulent=False):
    """
    Build the four result-page sections from the submitted text.

    `fields` uses the model's column names ("description", "title", ...).
    `is_fraudulent` is the model's thresholded verdict; it only shapes the wording
    of the recommendations and never changes the probability.
    """
    matches = find_matches(fields, recruiter_email)
    all_rules = RULES + EMAIL_RULES
    rules = {rule.key: rule for rule in all_rules}
    rule_order = [rule.key for rule in all_rules]

    # Most severe first; ties keep the order rules are defined in.
    triggered = sorted(matches, key=lambda k: (_SEVERITY_ORDER[rules[k].severity], rule_order.index(k)))

    warning_signals = []
    for key in triggered:
        rule = rules[key]
        evidence = list(dict.fromkeys(m.phrase for m in matches[key]))
        warning_signals.append({
            "id": key,
            "signal": rule.signal,
            "explanation": rule.explanation,
            "severity": rule.severity,
            "source": "rule_based",
            "evidence": evidence,
        })

    # Highlighted phrases: one entry per distinct quote, skipping text already inside a longer quote.
    candidates = _drop_contained([m for key in triggered for m in matches[key]])
    suspicious_phrases, seen = [], set()
    for match in candidates:
        if match.phrase.lower() in seen or len(suspicious_phrases) >= MAX_PHRASES:
            continue
        seen.add(match.phrase.lower())
        suspicious_phrases.append({"text": match.phrase, "field": match.field, "signal": match.rule})

    checklist = [{"item": item, "description": desc} for item, desc in BASE_CHECKLIST]
    for key in triggered:
        for item, desc in rules[key].checklist:
            checklist.append({"item": item, "description": desc})

    return {
        "warning_signals": warning_signals,
        "suspicious_phrases": suspicious_phrases,
        "verification_checklist": checklist,
        "recommended_actions": _recommended_actions(set(triggered), is_fraudulent),
    }
