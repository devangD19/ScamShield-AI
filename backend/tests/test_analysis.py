"""
Regression tests for the rule-based result sections returned by /api/predict:
warning_signals, suspicious_phrases, verification_checklist, recommended_actions.

These rules are deterministic text checks, separate from the ML model. The
postings below are SYNTHETIC (hand-written), so the tests check behaviour,
not accuracy.

Run from the project root:
    backend\\.venv\\Scripts\\python.exe -m unittest discover -s backend\\tests -v
"""

import unittest
from unittest import mock

from test_predictions import (  # also sets up the in-memory DB and loads the artifacts once
    APP, RESPONSE_KEYS, STATE, SYNTHETIC_EXAMPLES, backend, model_fields, raw_probability,
)

import analysis

ANALYSIS_KEYS = {"warning_signals", "suspicious_phrases", "verification_checklist", "recommended_actions"}
BASE_ITEMS = [item for item, _ in analysis.BASE_CHECKLIST]

SUSPICIOUS = {
    "title": "Data Entry Operator",
    "job_description": (
        "Hello candidate, your profile has been shortlisted for a work from home data entry role. "
        "A refundable security deposit of Rs. 500 is required to activate your employee ID. "
        "Send the amount to the UPI id quickhire.hr@okaxis immediately to lock the offer. "
        "Share your Aadhaar number and the OTP you receive for KYC verification."
    ),
    "recruiter_email": "quickhire.jobs@gmail.com",
}

LEGITIMATE = {
    "title": "Senior Software Engineer",
    "job_description": (
        "Join our engineering team to design, build and maintain web services in Python. "
        "Interview process: recruiter call, technical interview and a meeting with the team. "
        "We never ask candidates for payment, and there is no registration fee at any stage."
    ),
    "company_profile": "We are a growing software company building digital products for our clients.",
    "requirements": "5+ years of professional software development.",
    "employment_type": "Full-time",
    "recruiter_email": "careers@example-software.com",
}

NEUTRAL = {"job_description": "Office assistant needed to answer phones, file documents and greet visitors."}


def submitted_text(body):
    return {k: v for k, v in body.items() if isinstance(v, str)}


class RuleAnalysisApiTests(unittest.TestCase):
    def setUp(self):
        self.client = APP.test_client()

    def predict(self, body):
        response = self.client.post("/api/predict", json=body)
        self.assertEqual(response.status_code, 200, response.get_data(as_text=True))
        return response.get_json()

    def assert_phrases_are_verbatim(self, body, data):
        texts = submitted_text(body)
        for phrase in data["suspicious_phrases"]:
            api_field = "job_description" if phrase["field"] == "description" else phrase["field"]
            self.assertIn(api_field, texts, f"phrase points at a field that was not submitted: {phrase}")
            self.assertIn(phrase["text"], texts[api_field], f"phrase not found verbatim: {phrase}")

    # ---- response shape -------------------------------------------------- #

    def test_response_keeps_existing_fields_and_adds_four_sections(self):
        data = self.predict(SUSPICIOUS)
        self.assertTrue(RESPONSE_KEYS <= data.keys())
        self.assertTrue(ANALYSIS_KEYS <= data.keys())
        for key in ANALYSIS_KEYS:
            self.assertIsInstance(data[key], list)
        for signal in data["warning_signals"]:
            self.assertTrue({"id", "signal", "explanation", "severity", "source", "evidence"} <= signal.keys())
            self.assertEqual(signal["source"], "rule_based")
            self.assertIn(signal["severity"], ("high", "medium", "low"))
        for item in data["verification_checklist"]:
            self.assertTrue(item["item"] and item["description"])
        for step in data["recommended_actions"]:
            self.assertIsInstance(step, str)

    def test_rules_do_not_change_model_probability_or_verdict(self):
        for ex in SYNTHETIC_EXAMPLES:
            with self.subTest(ex["id"]):
                data = self.predict(ex["fields"])
                self.assertAlmostEqual(data["fraud_probability"], raw_probability(ex["fields"]), delta=1e-4)
                self.assertEqual(data["is_fraudulent"], raw_probability(ex["fields"]) >= STATE.threshold)

    # ---- suspicious job --------------------------------------------------- #

    def test_suspicious_job_returns_all_four_sections(self):
        data = self.predict(SUSPICIOUS)
        ids = [s["id"] for s in data["warning_signals"]]
        for expected in ("upfront_payment", "payment_channel", "sensitive_data", "urgency", "free_email"):
            self.assertIn(expected, ids)
        phrases = [p["text"] for p in data["suspicious_phrases"]]
        for expected in ("security deposit of Rs. 500", "refundable security deposit", "to the UPI id",
                         "quickhire.hr@okaxis", "Aadhaar number", "OTP", "immediately to lock",
                         "quickhire.jobs@gmail.com"):
            self.assertIn(expected, phrases)
        self.assertGreater(len(data["verification_checklist"]), len(BASE_ITEMS))
        self.assertTrue(any(a.startswith("Do not pay any fee") for a in data["recommended_actions"]))
        self.assert_phrases_are_verbatim(SUSPICIOUS, data)

    def test_signals_are_ordered_by_severity(self):
        order = {"high": 0, "medium": 1, "low": 2}
        severities = [order[s["severity"]] for s in self.predict(SUSPICIOUS)["warning_signals"]]
        self.assertEqual(severities, sorted(severities))

    def test_every_phrase_in_every_synthetic_example_is_verbatim(self):
        for ex in SYNTHETIC_EXAMPLES:
            with self.subTest(ex["id"]):
                self.assert_phrases_are_verbatim(ex["fields"], self.predict(ex["fields"]))

    def test_all_synthetic_scams_get_at_least_one_signal(self):
        for ex in SYNTHETIC_EXAMPLES:
            if ex["intended_label"] == 1:
                with self.subTest(ex["id"]):
                    self.assertTrue(self.predict(ex["fields"])["warning_signals"])

    def test_model_miss_with_rule_signals_gets_a_caution_message(self):
        """Registration-fee example: the model scores it below 0.55, the rules still warn."""
        ex = next(e for e in SYNTHETIC_EXAMPLES if e["id"] == "syn-fraud-registration-fee")
        data = self.predict(ex["fields"])
        self.assertIs(data["is_fraudulent"], False)
        self.assertIn("upfront_payment", [s["id"] for s in data["warning_signals"]])
        self.assertIn("below the alert threshold, but the rule-based checks found warning signs",
                      data["recommended_actions"][0])

    # ---- legitimate job / no phrases ------------------------------------- #

    def test_legitimate_job_has_empty_signal_and_phrase_lists(self):
        data = self.predict(LEGITIMATE)
        self.assertEqual(data["warning_signals"], [])
        self.assertEqual(data["suspicious_phrases"], [])
        self.assertEqual([c["item"] for c in data["verification_checklist"]], BASE_ITEMS)
        self.assertTrue(data["recommended_actions"])

    def test_all_synthetic_legitimate_examples_have_no_signals(self):
        for ex in SYNTHETIC_EXAMPLES:
            if ex["intended_label"] == 0:
                with self.subTest(ex["id"]):
                    data = self.predict(ex["fields"])
                    self.assertEqual(data["warning_signals"], [])
                    self.assertEqual(data["suspicious_phrases"], [])

    def test_text_with_no_suspicious_phrases(self):
        data = self.predict(NEUTRAL)
        self.assertEqual(data["warning_signals"], [])
        self.assertEqual(data["suspicious_phrases"], [])
        self.assertEqual([c["item"] for c in data["verification_checklist"]], BASE_ITEMS)
        if not data["is_fraudulent"]:
            self.assertTrue(data["recommended_actions"][0].startswith("No specific warning signs were found"))

    # ---- missing optional fields ----------------------------------------- #

    def test_description_only_request_still_gets_all_sections(self):
        data = self.predict({"job_description": SUSPICIOUS["job_description"]})
        self.assertTrue(ANALYSIS_KEYS <= data.keys())
        self.assertIn("upfront_payment", [s["id"] for s in data["warning_signals"]])
        self.assertNotIn("free_email", [s["id"] for s in data["warning_signals"]])

    def test_empty_and_null_optional_fields_equal_omitted_fields(self):
        optional = [c for c in STATE.text_columns if c not in ("title", "description")]
        omitted = self.predict(SUSPICIOUS)
        for filler in ("", None):
            with self.subTest(filler=filler):
                body = {**SUSPICIOUS, **{c: filler for c in optional}}
                data = self.predict(body)
                for key in ANALYSIS_KEYS:
                    self.assertEqual(data[key], omitted[key])

    def test_phrases_in_optional_fields_are_found_and_attributed(self):
        body = {"job_description": "Customer support role.", "benefits": "Daily payouts directly to your account."}
        phrases = self.predict(body)["suspicious_phrases"]
        self.assertIn({"text": "Daily payouts", "field": "benefits", "signal": "unrealistic_promises"}, phrases)

    # ---- safety ----------------------------------------------------------- #

    def test_rule_failure_does_not_break_prediction(self):
        with mock.patch.object(backend.rule_checks, "analyze_posting", side_effect=RuntimeError("boom")):
            response = self.client.post("/api/predict", json=SUSPICIOUS)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(RESPONSE_KEYS <= data.keys())
        self.assertFalse(ANALYSIS_KEYS & data.keys())


class RuleUnitTests(unittest.TestCase):
    def signals(self, text, **extra):
        return {s["id"]: s["evidence"] for s in
                analysis.analyze_posting({"description": text, **extra})["warning_signals"]}

    def test_negated_mentions_are_not_reported(self):
        self.assertEqual(self.signals("There is no registration fee and we will never ask for your OTP."), {})
        self.assertEqual(self.signals("We do not charge any processing fee."), {})

    def test_negation_does_not_hide_a_later_clause(self):
        found = self.signals("No registration fee, but you must pay a security deposit of Rs. 500.")
        self.assertEqual(found, {"upfront_payment": ["must pay", "security deposit of Rs. 500"]})

    def test_ordinary_payment_words_in_a_real_job_are_not_flagged(self):
        text = ("Build UPI payment features for our fintech app. Experience with the Paytm SDK, "
                "gift card systems and crypto wallets is a plus. Process wire transfers for clients.")
        self.assertEqual(self.signals(text), {})

    def test_upi_handle_and_amount_are_flagged(self):
        found = self.signals("Send Rs 999 to hr.jobs@okaxis to confirm.")
        self.assertEqual(found["upfront_payment"], ["Send Rs 999"])
        self.assertEqual(found["payment_channel"], ["hr.jobs@okaxis"])

    def test_payment_demand_without_a_named_fee_is_flagged(self):
        """Wording from a real user submission that the first version of the rules missed."""
        text = ("Applicants must pay for AI tools at time of Registration and document-verification before "
                "receiving their offer letter. Guaranteed selection is promised to everyone who completes payment.")
        found = self.signals(text)
        self.assertEqual(found["upfront_payment"], ["must pay for AI tools", "completes payment"])
        self.assertEqual(found["unrealistic_promises"], ["Guaranteed selection"])

    def test_password_requests_and_suspicious_links_are_flagged(self):
        found = self.signals("Fill the form at bit.ly/job-form2026, chat on wa.me/919812345678, "
                             "send us your email password and install hr_app.apk. Or visit http://192.168.4.20/apply")
        self.assertEqual(found["sensitive_data"], ["send us your email password"])
        self.assertEqual(found["suspicious_link"],
                         ["bit.ly/job-form2026", "wa.me/919812345678", "hr_app.apk", "http://192.168.4.20/apply"])

    def test_ordinary_mentions_of_pay_passwords_and_links_are_not_flagged(self):
        text = ("Salary is paid monthly. We never ask you to pay for training. You will not need to buy a "
                "laptop; one is provided. Reset your password on first login to our HR portal. "
                "Apply at https://careers.example.com/jobs/123.")
        self.assertEqual(self.signals(text), {})

    def test_interview_invitation_without_red_flags_has_no_signals(self):
        text = ("Congratulations, you have been shortlisted for the AIML intern role. Your interview is "
                "scheduled for 21/10/2026. Please bring your updated resume and a government ID proof.")
        self.assertEqual(self.signals(text, title="AIML Intern"), {})

    def test_free_email_only_for_webmail_domains(self):
        self.assertIn("free_email", self.signals("Contact hr.talent@gmail.com for details"))
        self.assertEqual(self.signals("Contact careers@infosys.com for details"), {})
        self.assertEqual(self.signals("Email jobs@okta.com or hr@paytm.com to apply."), {})
        result = analysis.analyze_posting({"description": "Office role."}, recruiter_email="hr@company.co.in")
        self.assertEqual(result["warning_signals"], [])

    def test_phrases_are_unique_and_capped(self):
        text = " ".join(["Pay the registration fee via UPI. Share your OTP."] * 30)
        phrases = analysis.analyze_posting({"description": text})["suspicious_phrases"]
        texts = [p["text"].lower() for p in phrases]
        self.assertEqual(len(texts), len(set(texts)))
        self.assertLessEqual(len(phrases), analysis.MAX_PHRASES)

    def test_empty_input_returns_empty_lists_and_base_checklist(self):
        result = analysis.analyze_posting({})
        self.assertEqual(result["warning_signals"], [])
        self.assertEqual(result["suspicious_phrases"], [])
        self.assertEqual([c["item"] for c in result["verification_checklist"]], BASE_ITEMS)

    def test_recommendations_follow_model_verdict(self):
        clean = analysis.analyze_posting({"description": "Office assistant role."}, is_fraudulent=True)
        self.assertIn("no specific warning phrases were matched", clean["recommended_actions"][0])
        both = analysis.analyze_posting({"description": "Pay the registration fee today."}, is_fraudulent=True)
        self.assertIn("rule-based checks also found warning signs", both["recommended_actions"][0])


APEXNOVA = {
    "title": "Software Trainee",
    "job_description": (
        "ApexNova Solutions is hiring software trainees. "
        "Pay ₹3,500 for mandatory onboarding and laptop delivery. "
        "The fee will be refunded with your first salary. "
        "Freshers can get an immediate offer without an interview. "
        "Limited seats available; apply today. "
        "Contact email: hr@apexnova-example.invalid"
    ),
    "company_name": "ApexNova Solutions",
    "recruiter_email": "hr@apexnova-example.invalid",
}

REALISTIC_DETAILS = {
    "title": "Junior Data Analyst",
    "company_profile": "Northwind Analytics builds reporting dashboards for retail clients.",
    "requirements": "SQL, Excel and basic Python. Good communication skills.",
    "benefits": "Health insurance and a learning budget.",
    "location": "IN, KA, Bengaluru",
    "employment_type": "Full-time",
    "required_experience": "Entry level",
    "required_education": "Bachelor's Degree",
    "salary_range": "400000-550000",
    "recruiter_email": "talent@northwind-analytics.com",
}


class ScenarioTests(unittest.TestCase):
    """The eight scenarios requested for the rule-based warnings (all postings are synthetic)."""

    def setUp(self):
        self.client = APP.test_client()

    def predict(self, body):
        response = self.client.post("/api/predict", json=body)
        self.assertEqual(response.status_code, 200, response.get_data(as_text=True))
        return response.get_json()

    def signals(self, data):
        return {s["id"]: s for s in data["warning_signals"]}

    def assert_evidence_is_verbatim(self, body, data):
        texts = submitted_text(body)
        for signal in data["warning_signals"]:
            for quote in signal["evidence"]:
                self.assertTrue(any(quote in t for t in texts.values()), f"invented evidence: {quote!r}")
        for phrase in data["suspicious_phrases"]:
            api_field = "job_description" if phrase["field"] == "description" else phrase["field"]
            self.assertIn(phrase["text"], texts[api_field])

    # 1
    def test_apexnova_listing(self):
        data = self.predict(APEXNOVA)
        found = self.signals(data)
        expected = {
            "upfront_payment": ("high", ["Pay ₹3,500"]),
            "no_screening": ("high", ["immediate offer", "without an interview"]),
            "refund_promise": ("high", ["fee will be refunded with your first salary"]),
            "invalid_contact_domain": ("high", ["hr@apexnova-example.invalid"]),
            "urgency": ("medium", ["Limited seats available; apply today"]),
        }
        self.assertEqual(set(found), set(expected), "unexpected or missing warning")
        for key, (severity, evidence) in expected.items():
            with self.subTest(key):
                self.assertEqual(found[key]["severity"], severity)
                self.assertEqual(found[key]["evidence"], evidence)
        phrases = [p["text"] for p in data["suspicious_phrases"]]
        for quote in ("Pay ₹3,500", "without an interview", "fee will be refunded with your first salary",
                      "Limited seats available; apply today", "hr@apexnova-example.invalid"):
            self.assertIn(quote, phrases)
        self.assertEqual(len(phrases), len({p.lower() for p in phrases}), "duplicate phrases")
        self.assert_evidence_is_verbatim(APEXNOVA, data)
        # The rules never touch the model output.
        self.assertAlmostEqual(data["fraud_probability"], raw_probability(APEXNOVA), delta=1e-4)
        self.assertEqual(data["threshold"], 0.55)

    # 2
    def test_legitimate_posting_without_matching_patterns(self):
        body = {**REALISTIC_DETAILS, "job_description": (
            "Analyse sales data, maintain weekly dashboards and present findings to the client team. "
            "Selection: online test, two interviews and a reference check. Apply today on our careers page.")}
        data = self.predict(body)
        self.assertEqual(data["warning_signals"], [])
        self.assertEqual(data["suspicious_phrases"], [])

    # 3
    def test_upfront_fee_without_urgency(self):
        data = self.predict({"title": "Office Assistant", "job_description":
                             "Selected candidates pay a one-time training fee of Rs. 2,000 before joining."})
        found = self.signals(data)
        self.assertEqual(found["upfront_payment"]["severity"], "high")
        self.assertNotIn("urgency", found)
        self.assertNotIn("refund_promise", found)

    # 4
    def test_urgency_without_fee(self):
        data = self.predict({"title": "Sales Executive", "job_description":
                             "Urgent hiring for sales executives. Limited seats available, apply now."})
        found = self.signals(data)
        self.assertEqual(found["urgency"]["severity"], "medium")
        self.assertEqual(found["urgency"]["evidence"], ["Urgent hiring", "Limited seats available, apply now"])
        for key in ("upfront_payment", "refund_promise", "payment_channel"):
            self.assertNotIn(key, found)

    # 5
    def test_refund_promise_for_mandatory_fee(self):
        data = self.predict({"job_description": "A mandatory security deposit of ₹5,000 is required. "
                                                "The deposit is fully refundable after three months."})
        found = self.signals(data)
        self.assertEqual(found["refund_promise"]["severity"], "high")
        self.assertEqual(found["refund_promise"]["evidence"], ["deposit is fully refundable"])
        self.assertIn("upfront_payment", found)

    def test_non_refundable_fee_is_not_a_refund_promise(self):
        found = self.signals(self.predict({"job_description": "Pay the kit fee of Rs. 999. The fee is non-refundable."}))
        self.assertIn("upfront_payment", found)
        self.assertNotIn("refund_promise", found)

    # 6
    def test_suspicious_contact_domain(self):
        for email in ("hr@apexnova-example.invalid", "jobs@example.com", "careers@acme.test", "hr@mail.example.org"):
            with self.subTest(email):
                data = self.predict({"job_description": "Office assistant role in Pune.", "recruiter_email": email})
                found = self.signals(data)
                self.assertEqual(found["invalid_contact_domain"]["severity"], "high")
                self.assertEqual(found["invalid_contact_domain"]["evidence"], [email])

    def test_unfamiliar_but_valid_domains_are_not_flagged(self):
        for email in ("hr@apexnova.in", "talent@northwind-analytics.com", "jobs@examplecorp.com", "hr@test-labs.io"):
            with self.subTest(email):
                data = self.predict({"job_description": "Office assistant role in Pune.", "recruiter_email": email})
                self.assertEqual(data["warning_signals"], [])

    # 7
    def test_missing_and_empty_optional_fields(self):
        optional = [c for c in STATE.text_columns if c not in ("title", "description")]
        minimal = {"job_description": APEXNOVA["job_description"]}
        base = self.predict(minimal)
        for filler in ("", None):
            with self.subTest(filler=filler):
                data = self.predict({**minimal, **{c: filler for c in optional},
                                     "title": filler, "company_name": filler, "recruiter_email": filler})
                self.assertEqual(data["warning_signals"], base["warning_signals"])
                self.assertEqual(data["suspicious_phrases"], base["suspicious_phrases"])
        # The email is still found in the description text even without the recruiter_email field.
        self.assertIn("invalid_contact_domain", self.signals(base))

    # 8
    def test_realistic_job_with_explicit_payment_demand(self):
        body = {**REALISTIC_DETAILS, "job_description": (
            "Analyse sales data and maintain weekly dashboards for the client team. Before your joining date "
            "you must pay Rs. 4,500 for software licences and background verification.")}
        data = self.predict(body)
        found = self.signals(data)
        self.assertEqual(list(found), ["upfront_payment"])
        self.assertEqual(found["upfront_payment"]["evidence"], ["must pay Rs. 4,500"])
        self.assert_evidence_is_verbatim(body, data)


if __name__ == "__main__":
    unittest.main()
