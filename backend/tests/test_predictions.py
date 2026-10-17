"""
Regression tests for the ScamShield prediction API.

Run from the project root:
    backend\\.venv\\Scripts\\python.exe -m unittest discover -s backend\\tests -v

Two kinds of test data, kept separate on purpose:

* REAL LABELED DATA - backend/reference_predictions.json: 8 postings from the
  training dataset with the probabilities Colab computed. These check that
  Flask reproduces the notebook exactly (same artifacts, same preprocessing).

* SYNTHETIC EXAMPLES - SYNTHETIC_EXAMPLES below: hand-written postings. Their
  "intended_label" is what a human author meant them to be, not a dataset
  label. They check API behaviour and catch unexpected changes in the model's
  output ("expected_probability" is a snapshot of the current model). They say
  NOTHING about accuracy or real-world performance, and must not be used to
  tune the threshold. Misses are printed as a report; they are not failures.

All tests use an in-memory database, so no project data is touched.
"""

import json
import os
import re
import sys
import unittest
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
PROJECT_DIR = BACKEND_DIR.parent
sys.path.insert(0, str(BACKEND_DIR))
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["SECRET_KEY"] = "unit-tests"
os.environ.pop("SCAMSHIELD_THRESHOLD", None)

import app as backend  # noqa: E402

REFERENCE_FILE = BACKEND_DIR / "reference_predictions.json"
METADATA_FILE = BACKEND_DIR / "model_metadata.json"
FRONTEND_SERVICE = PROJECT_DIR / "src" / "services" / "analysisService.js"

API_ROUNDING = 1e-4      # /api/predict rounds fraud_probability to 4 decimals
SNAPSHOT_TOLERANCE = 1e-4
INTENDED_THRESHOLD = 0.55

RESPONSE_KEYS = {"success", "prediction", "label", "is_fraudulent", "fraud_probability",
                 "threshold", "disclaimer", "saved"}

# --------------------------------------------------------------------------- #
# SYNTHETIC EXAMPLES (not real data - see module docstring)
# --------------------------------------------------------------------------- #

SYNTHETIC_EXAMPLES = [
    # ---- intended: fraudulent ----
    {
        "id": "syn-fraud-registration-fee",
        "kind": "registration fee",
        "intended_label": 1,
        "expected_probability": 0.2665,
        "fields": {
            "title": "Web Development Intern",
            "job_description": "Congratulations! You have been selected for a 2 month paid web development internship at BrightPath Solutions. Stipend will be Rs. 15,000 per month. To confirm your seat you must first pay a one-time registration fee of Rs. 1,499 via UPI before today 6 PM. After payment we will share the offer letter and login credentials. Do not share this opportunity with anyone else, seats are limited. Reply with your full name, address and payment screenshot to confirm.",
        },
    },
    {
        "id": "syn-fraud-registration-fee-full",
        "kind": "registration fee",
        "intended_label": 1,
        "expected_probability": 0.4756,
        "fields": {
            "title": "Online Marketing Intern - Immediate Joining",
            "job_description": "You are selected without interview for our paid internship. Pay the registration and training kit fee of Rs. 2,000 today to receive your offer letter and ID card. The fee is non-refundable. Slots are limited and will close tonight.",
            "company_profile": "",
            "requirements": "No experience needed. Only a phone and payment of the registration fee.",
            "benefits": "Guaranteed certificate and Rs. 20,000 stipend. Earn from home.",
            "location": "IN, , Remote",
            "industry": "Marketing and Advertising",
            "function": "Marketing",
            "employment_type": "Part-time",
            "required_experience": "Not Applicable",
            "required_education": "Unspecified",
            "salary_range": "20000-40000",
        },
    },
    {
        "id": "syn-fraud-upi-deposit",
        "kind": "UPI payment request",
        "intended_label": 1,
        "expected_probability": 0.5936,
        "fields": {
            "title": "Data Entry Operator",
            "job_description": "Hello candidate, your profile has been shortlisted for a work from home data entry role paying Rs. 25,000 monthly. A refundable security deposit of Rs. 500 is required to activate your employee ID and project dashboard. Send the amount to the UPI id quickhire.hrcareers@okaxis immediately to lock the offer. The deposit is fully refundable after 15 days of joining. Share your Aadhaar number and a selfie for KYC verification.",
        },
    },
    {
        "id": "syn-fraud-upi-processing-full",
        "kind": "UPI payment request",
        "intended_label": 1,
        "expected_probability": 0.6320,
        "fields": {
            "title": "Customer Support Executive (Work From Home)",
            "job_description": "Your application is approved. To process your offer letter, transfer Rs. 1,200 processing charge to our HR UPI ID. After payment, send the screenshot on Telegram to receive your joining date. Training starts tomorrow.",
            "company_profile": "",
            "requirements": "Basic English. Must pay processing charge before onboarding.",
            "benefits": "Weekly payout, work from home, no targets.",
            "location": "IN, , ",
            "industry": "",
            "function": "Customer Service",
            "employment_type": "Full-time",
            "required_experience": "Entry level",
            "required_education": "High School or equivalent",
            "salary_range": "",
        },
    },
    {
        "id": "syn-fraud-wfh-reviewer",
        "kind": "work from home",
        "intended_label": 1,
        "expected_probability": 0.5575,
        "fields": {
            "title": "Product Reviewer (Part Time)",
            "job_description": "Urgent hiring for a part-time product reviewer. Work only 1 hour daily from home and earn Rs. 8,000 per day directly in your bank account. No interview, no experience needed, no resume required. You only need a smartphone and a bank account. Registration closes tonight, confirm your slot by sharing your OTP with our verification team. Payment guaranteed every Friday.",
        },
    },
    {
        "id": "syn-fraud-wfh-data-entry-full",
        "kind": "work from home",
        "intended_label": 1,
        "expected_probability": 0.9487,
        "fields": {
            "title": "Data Entry Clerk - Work From Home",
            "job_description": "Earn $500 weekly working from home typing simple forms. No experience required. Flexible hours, start today. To get started, reply with your full name, phone number and bank account details so we can set up your payroll.",
            "company_profile": "",
            "requirements": "Computer or smartphone with internet. Must be 18 or older.",
            "benefits": "Weekly pay, work from home, flexible schedule.",
            "location": "US, , ",
            "industry": "",
            "function": "Administrative",
            "employment_type": "Part-time",
            "required_experience": "Not Applicable",
            "required_education": "High School or equivalent",
            "salary_range": "",
        },
    },
    {
        "id": "syn-fraud-campus-drive",
        "kind": "processing charge",
        "intended_label": 1,
        "expected_probability": 0.1719,
        "fields": {
            "title": "Graduate Engineer Trainee",
            "job_description": "Dear Student, as part of our campus drive we are hiring final year students for the Graduate Engineer Trainee role with a package of Rs. 12 LPA. Your college placement cell has shared your number. To complete your application, deposit Rs. 2,500 as interview processing charge and send your college ID card photo on this number. Interview will be conducted over WhatsApp chat tomorrow. Do not contact the company directly, this drive is exclusive.",
        },
    },
    # ---- intended: legitimate ----
    {
        "id": "syn-legit-frontend-intern",
        "kind": "internship",
        "intended_label": 0,
        "expected_probability": 0.2020,
        "fields": {
            "title": "Frontend Engineering Intern",
            "job_description": "Krishna Infotech is hiring frontend engineering interns for a 6 month on-site internship in Pune. Stipend: Rs. 25,000 per month. Responsibilities: build and maintain React components, write unit tests, and work with the design team on accessibility improvements. Requirements: solid HTML, CSS and JavaScript basics; familiarity with React is a plus; portfolio or GitHub link required. Selection process: online coding round, technical interview, HR discussion. Apply only through our official career page at krishnainfotech.com/careers. We never ask for payment at any stage.",
        },
    },
    {
        "id": "syn-legit-frontend-intern-full",
        "kind": "internship",
        "intended_label": 0,
        "expected_probability": 0.1350,
        "fields": {
            "title": "Frontend Engineering Intern",
            "job_description": "Build and maintain React components, write unit tests, and work with the design team on accessibility improvements. Selection process: online coding round, technical interview and HR discussion. We never ask for payment at any stage.",
            "company_profile": "Krishna Infotech is a software services company with 300 employees, building web and mobile products for clients in healthcare and retail since 2009.",
            "requirements": "Solid HTML, CSS and JavaScript basics. Familiarity with React is a plus. Portfolio or GitHub link required.",
            "benefits": "Monthly stipend, mentorship from senior engineers, and a pre-placement offer for strong performers.",
            "location": "IN, MH, Pune",
            "industry": "Information Technology and Services",
            "function": "Engineering",
            "employment_type": "Other",
            "required_experience": "Internship",
            "required_education": "Some College Coursework Completed",
            "salary_range": "",
        },
    },
    {
        "id": "syn-legit-software-engineer-full",
        "kind": "full-time role",
        "intended_label": 0,
        "expected_probability": 0.0819,
        "fields": {
            "title": "Senior Software Engineer",
            "job_description": "Join our engineering team to design, build and maintain web services in Python and TypeScript. You will review code, improve our CI pipeline, and mentor junior engineers. Interview process: recruiter call, technical interview and a meeting with the team.",
            "company_profile": "We are a growing software company building digital products for our clients across Europe and Asia.",
            "requirements": "5+ years of professional software development. Experience with Python, SQL and cloud services. Clear written communication.",
            "benefits": "Health insurance, flexible hours, learning budget and 25 days of paid leave.",
            "location": "SG, 01, Singapore",
            "industry": "Computer Software",
            "function": "Engineering",
            "employment_type": "Full-time",
            "required_experience": "Mid-Senior level",
            "required_education": "Bachelor's Degree",
            "salary_range": "",
        },
    },
    {
        "id": "syn-legit-accountant-full",
        "kind": "full-time role",
        "intended_label": 0,
        "expected_probability": 0.2362,
        "fields": {
            "title": "Staff Accountant",
            "job_description": "We are looking for a Staff Accountant to manage month-end close, reconcile accounts, and prepare financial statements in partnership with our controller. You will also support the annual audit and help improve our reporting processes.",
            "company_profile": "Founded in 1998, we are a family-owned distributor of industrial equipment with offices in three states.",
            "requirements": "Bachelor's degree in accounting or finance. 2+ years of experience with general ledger accounting. Proficiency in Excel.",
            "benefits": "Medical, dental and vision insurance, 401(k) with company match, paid time off.",
            "location": "US, TX, Austin",
            "industry": "Wholesale",
            "function": "Accounting/Auditing",
            "employment_type": "Full-time",
            "required_experience": "Associate",
            "required_education": "Bachelor's Degree",
            "salary_range": "55000-65000",
        },
    },
    {
        "id": "syn-legit-nurse-full",
        "kind": "full-time role",
        "intended_label": 0,
        "expected_probability": 0.3219,
        "fields": {
            "title": "Registered Nurse - Medical/Surgical Unit",
            "job_description": "Provide direct patient care on our 32-bed medical/surgical unit, coordinate with physicians and the care team, and educate patients and families on discharge plans. Rotating 12-hour shifts.",
            "company_profile": "Our community hospital has served the region for over 60 years and is accredited by The Joint Commission.",
            "requirements": "Active state RN license, BLS certification, and at least one year of acute care experience.",
            "benefits": "Comprehensive health coverage, tuition reimbursement, retirement plan and shift differentials.",
            "location": "US, MN, Rochester",
            "industry": "Hospital & Health Care",
            "function": "Health Care Provider",
            "employment_type": "Full-time",
            "required_experience": "Associate",
            "required_education": "Bachelor's Degree",
            "salary_range": "",
        },
    },
]


def model_fields(fields):
    """API request body -> the dict build_model_text() expects (description key)."""
    out = {k: v for k, v in fields.items() if k != "job_description"}
    out["description"] = fields["job_description"]
    return out


# --------------------------------------------------------------------------- #
# Shared fixtures: load the real artifacts once (takes a few seconds)
# --------------------------------------------------------------------------- #

STATE = backend.load_artifacts()
APP = backend.create_app(state=STATE)


def raw_probability(fields):
    """Unrounded P(fraud) computed directly, outside the HTTP layer."""
    text = backend.build_model_text(model_fields(fields), STATE.text_columns)
    return float(STATE.model.predict_proba(STATE.vectorizer.transform([text]))[0][STATE.fraud_index])


class ApiTestCase(unittest.TestCase):
    def setUp(self):
        self.client = APP.test_client()

    def predict(self, body, **kwargs):
        return self.client.post("/api/predict", json=body, **kwargs)

    def assert_valid_prediction(self, response):
        self.assertEqual(response.status_code, 200, response.get_data(as_text=True))
        data = response.get_json()
        self.assertTrue(RESPONSE_KEYS <= data.keys(), f"missing keys: {RESPONSE_KEYS - data.keys()}")
        self.assertIs(data["success"], True)
        self.assertIsInstance(data["is_fraudulent"], bool)
        self.assertGreaterEqual(data["fraud_probability"], 0.0)
        self.assertLessEqual(data["fraud_probability"], 1.0)
        self.assertEqual(data["threshold"], STATE.threshold)
        expected_label = "Potentially Fraudulent" if data["is_fraudulent"] else "Likely Legitimate"
        expected_prediction = "Fraudulent" if data["is_fraudulent"] else "Legitimate"
        self.assertEqual(data["label"], expected_label)
        self.assertEqual(data["prediction"], expected_prediction)
        return data


# --------------------------------------------------------------------------- #
# Artifacts, metadata and configuration
# --------------------------------------------------------------------------- #

class ArtifactTests(unittest.TestCase):
    def test_artifacts_load_without_errors(self):
        self.assertTrue(STATE.ready, STATE.errors)

    def test_fraud_column_is_class_1(self):
        classes = list(STATE.model.classes_)
        self.assertEqual(sorted(classes), [0, 1])
        self.assertEqual(STATE.fraud_index, classes.index(1))

    def test_vectorizer_matches_model_and_metadata(self):
        metadata = json.loads(METADATA_FILE.read_text(encoding="utf-8"))
        vocab = len(STATE.vectorizer.vocabulary_)
        self.assertEqual(vocab, STATE.model.n_features_in_)
        self.assertEqual(vocab, metadata["vectorizer_features"])

    def test_vectorizer_is_not_refitted_by_predictions(self):
        before = dict(STATE.vectorizer.vocabulary_)
        APP.test_client().post("/api/predict", json={"job_description": "brandnewword123 xyzzyplugh"})
        self.assertEqual(STATE.vectorizer.vocabulary_, before)

    def test_operational_threshold_is_055_not_reported_metrics_threshold(self):
        metadata = json.loads(METADATA_FILE.read_text(encoding="utf-8"))
        self.assertEqual(metadata["target_decision_threshold_flask"], INTENDED_THRESHOLD)
        self.assertEqual(metadata["decision_threshold_for_reported_metrics"], 0.5)
        self.assertEqual(STATE.threshold, INTENDED_THRESHOLD)

    def test_threshold_env_override_and_invalid_values(self):
        try:
            os.environ["SCAMSHIELD_THRESHOLD"] = "0.7"
            state = backend.load_artifacts()
            self.assertTrue(state.ready)
            self.assertEqual(state.threshold, 0.7)
            for bad in ("abc", "0", "1", "1.5", "-0.2"):
                os.environ["SCAMSHIELD_THRESHOLD"] = bad
                self.assertFalse(backend.load_artifacts().ready, f"threshold {bad!r} was accepted")
        finally:
            os.environ.pop("SCAMSHIELD_THRESHOLD", None)

    def test_text_columns_match_frontend_payload_names(self):
        """Every model column must be sent by src/services/analysisService.js under its exact name."""
        source = FRONTEND_SERVICE.read_text(encoding="utf-8")
        mapping = re.search(r"OPTIONAL_MODEL_FIELDS = \{(.*?)\};", source, re.S)
        self.assertIsNotNone(mapping, "OPTIONAL_MODEL_FIELDS not found in analysisService.js")
        sent = set(re.findall(r":\s*'([a-z_]+)'", mapping.group(1)))
        sent |= {"title", "description"}  # title is sent as "title"; description as "job_description"
        self.assertIn("job_description:", source)
        self.assertEqual(sent, set(STATE.text_columns))


# --------------------------------------------------------------------------- #
# Health
# --------------------------------------------------------------------------- #

class HealthTests(ApiTestCase):
    def test_health_reports_ready(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["status"], "ok")
        self.assertIs(data["ready"], True)
        self.assertIs(data["model_loaded"], True)
        self.assertIs(data["vectorizer_loaded"], True)
        self.assertEqual(data["errors"], [])
        self.assertEqual(data["threshold"], INTENDED_THRESHOLD)


# --------------------------------------------------------------------------- #
# REAL LABELED DATA: Colab reference predictions
# --------------------------------------------------------------------------- #

class ReferencePredictionTests(ApiTestCase):
    @classmethod
    def setUpClass(cls):
        cls.references = json.loads(REFERENCE_FILE.read_text(encoding="utf-8"))

    def test_reference_file_has_eight_postings(self):
        self.assertEqual(len(self.references), 8)

    def test_backend_preprocessing_reproduces_colab_probabilities(self):
        for ref in self.references:
            with self.subTest(job_id=ref["job_id"]):
                got = raw_probability({**ref["inputs"], "job_description": ref["inputs"]["description"]})
                # The reference file stores 6 decimals.
                self.assertAlmostEqual(got, ref["calculated_fraud_probability"], delta=5e-7)

    def test_api_returns_colab_probabilities_and_labels(self):
        for ref in self.references:
            with self.subTest(job_id=ref["job_id"]):
                inputs = dict(ref["inputs"])
                body = {"job_description": inputs.pop("description"), **inputs}
                data = self.assert_valid_prediction(self.predict(body))
                self.assertAlmostEqual(data["fraud_probability"], ref["calculated_fraud_probability"],
                                       delta=API_ROUNDING)
                expected = ref["calculated_fraud_probability"] >= STATE.threshold
                self.assertEqual(data["is_fraudulent"], expected)

    def test_optional_fields_change_the_model_input(self):
        """Sending all 12 fields must not give the same score as title + description only."""
        ref = self.references[0]
        full = {**ref["inputs"], "job_description": ref["inputs"]["description"]}
        short = {"title": full["title"], "job_description": full["job_description"]}
        self.assertNotAlmostEqual(raw_probability(full), raw_probability(short), delta=1e-3)


# --------------------------------------------------------------------------- #
# Request handling
# --------------------------------------------------------------------------- #

class RequestHandlingTests(ApiTestCase):
    BASE = {"title": "Data Entry Operator",
            "job_description": "Send a refundable deposit by UPI to activate your work from home job."}

    def prob(self, body):
        return self.assert_valid_prediction(self.predict(body))["fraud_probability"]

    def test_empty_or_null_optional_fields_equal_omitted_fields(self):
        omitted = self.prob(self.BASE)
        empty = {**self.BASE, **{c: "" for c in STATE.text_columns if c not in ("title", "description")}}
        nulls = {**self.BASE, **{c: None for c in STATE.text_columns if c not in ("title", "description")}}
        self.assertEqual(self.prob(empty), omitted)
        self.assertEqual(self.prob(nulls), omitted)

    def test_display_only_fields_do_not_affect_score(self):
        base = self.prob(self.BASE)
        extra = {**self.BASE, "company_name": "Totally Real Corp", "recruiter_email": "a@b.co", "source": "Telegram"}
        self.assertEqual(self.prob(extra), base)

    def test_unknown_fields_are_ignored(self):
        self.assertEqual(self.prob({**self.BASE, "department": "Sales", "salary": 9}), self.prob(self.BASE))

    def test_whitespace_is_trimmed(self):
        padded = {"title": "  Data Entry Operator  ", "job_description": "\n" + self.BASE["job_description"] + "  "}
        self.assertEqual(self.prob(padded), self.prob(self.BASE))

    def test_description_only_is_accepted(self):
        self.prob({"job_description": self.BASE["job_description"]})

    def test_invalid_requests_return_400(self):
        cases = {
            "missing description": {"title": "x"},
            "empty description": {"job_description": "   "},
            "description not a string": {"job_description": 123},
            "optional model field not a string": {"job_description": "valid text", "requirements": ["a"]},
            "display field not a string": {"job_description": "valid text", "company_name": 5},
            "description too long": {"job_description": "a" * (backend.MAX_TEXT_LENGTH + 1)},
            "optional field too long": {"job_description": "valid text", "benefits": "a" * (backend.MAX_TEXT_LENGTH + 1)},
            "JSON array": [1, 2, 3],
            "JSON string": "just text",
        }
        for name, body in cases.items():
            with self.subTest(name):
                response = self.predict(body)
                self.assertEqual(response.status_code, 400)
                self.assertIs(response.get_json()["success"], False)
                self.assertEqual(response.get_json()["error"], "invalid_request")

    def test_malformed_or_missing_body_returns_400(self):
        for name, kwargs in {"malformed JSON": {"data": "{bad", "content_type": "application/json"},
                             "empty body": {"data": ""},
                             "form-encoded": {"data": {"job_description": "x"}}}.items():
            with self.subTest(name):
                response = self.client.post("/api/predict", **kwargs)
                self.assertEqual(response.status_code, 400)
                self.assertIs(response.get_json()["success"], False)

    def test_invalid_token_returns_401(self):
        response = self.predict(self.BASE, headers={"Authorization": "Bearer not-a-real-token"})
        self.assertEqual(response.status_code, 401)

    def test_signed_in_prediction_is_saved_to_history(self):
        account = {"full_name": "Test User", "email": "regression@example.com", "password": "testpass123"}
        self.assertIn(self.client.post("/api/v1/auth/register", json=account).status_code, (200, 201))
        login = self.client.post("/api/v1/auth/login", json={"email": account["email"], "password": account["password"]})
        token = login.get_json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        data = self.assert_valid_prediction(self.predict(self.BASE, headers=headers))
        self.assertIs(data["saved"], True)
        history = self.client.get("/api/v1/history", headers=headers)
        self.assertEqual(history.status_code, 200)
        self.assertIn(data["id"], [item["id"] for item in history.get_json()["items"]])


# --------------------------------------------------------------------------- #
# Threshold behaviour (stub model, so the probability is exact)
# --------------------------------------------------------------------------- #

class _FixedModel:
    classes_ = [0, 1]

    def __init__(self, probability):
        self.probability = probability

    def predict_proba(self, _features):
        return [[1 - self.probability, self.probability]]


class _PassThroughVectorizer:
    def transform(self, texts):
        return texts


def app_with_probability(probability, threshold=INTENDED_THRESHOLD):
    state = backend.ModelState()
    state.model = _FixedModel(probability)
    state.vectorizer = _PassThroughVectorizer()
    state.fraud_index = 1
    state.threshold = threshold
    state.text_columns = list(STATE.text_columns)
    return backend.create_app(state=state).test_client()


class ThresholdTests(unittest.TestCase):
    def verdict(self, probability, threshold=INTENDED_THRESHOLD):
        response = app_with_probability(probability, threshold).post("/api/predict", json={"job_description": "x"})
        self.assertEqual(response.status_code, 200)
        return response.get_json()

    def test_probability_at_threshold_is_flagged(self):
        data = self.verdict(0.55)
        self.assertIs(data["is_fraudulent"], True)
        self.assertEqual(data["label"], "Potentially Fraudulent")

    def test_probability_just_below_threshold_is_not_flagged(self):
        data = self.verdict(0.5499)
        self.assertIs(data["is_fraudulent"], False)
        self.assertEqual(data["label"], "Likely Legitimate")

    def test_reported_metrics_threshold_050_is_not_used(self):
        # 0.52 would be "fraud" at 0.50, but the API uses 0.55.
        self.assertIs(self.verdict(0.52)["is_fraudulent"], False)

    def test_configured_threshold_is_respected(self):
        self.assertIs(self.verdict(0.65, threshold=0.7)["is_fraudulent"], False)
        self.assertIs(self.verdict(0.70, threshold=0.7)["is_fraudulent"], True)

    def test_unavailable_model_returns_503(self):
        state = backend.ModelState()
        state.errors.append("Model file not found")
        response = backend.create_app(state=state).test_client().post("/api/predict", json={"job_description": "x"})
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.get_json()["error"], "model_unavailable")


# --------------------------------------------------------------------------- #
# SYNTHETIC EXAMPLES: behaviour + snapshot + false-negative report
# --------------------------------------------------------------------------- #

class SyntheticExampleTests(ApiTestCase):
    def test_examples_are_well_formed(self):
        ids = [ex["id"] for ex in SYNTHETIC_EXAMPLES]
        self.assertEqual(len(ids), len(set(ids)))
        for ex in SYNTHETIC_EXAMPLES:
            self.assertTrue(ex["id"].startswith("syn-"), "synthetic ids must start with 'syn-'")
            self.assertIn(ex["intended_label"], (0, 1))

    def test_api_response_and_threshold_logic(self):
        for ex in SYNTHETIC_EXAMPLES:
            with self.subTest(ex["id"]):
                data = self.assert_valid_prediction(self.predict(ex["fields"]))
                self.assertAlmostEqual(data["fraud_probability"], raw_probability(ex["fields"]), delta=API_ROUNDING)
                self.assertEqual(data["is_fraudulent"], raw_probability(ex["fields"]) >= STATE.threshold)

    def test_probabilities_match_snapshot(self):
        """Fails if the model or preprocessing changed. If that change was intended, update the snapshot."""
        for ex in SYNTHETIC_EXAMPLES:
            with self.subTest(ex["id"]):
                self.assertIsNotNone(ex["expected_probability"], "snapshot missing")
                self.assertAlmostEqual(raw_probability(ex["fields"]), ex["expected_probability"],
                                       delta=SNAPSHOT_TOLERANCE)

    def test_report_false_negatives_and_false_positives(self):
        """Prints how the current model treats the synthetic examples. Misses are reported, not failed."""
        rows, false_negatives, false_positives = [], [], []
        for ex in SYNTHETIC_EXAMPLES:
            p = raw_probability(ex["fields"])
            flagged = p >= STATE.threshold
            if ex["intended_label"] == 1 and not flagged:
                false_negatives.append(ex["id"])
            if ex["intended_label"] == 0 and flagged:
                false_positives.append(ex["id"])
            outcome = "Potentially Fraudulent" if flagged else "Likely Legitimate"
            miss = " <-- FALSE NEGATIVE" if ex["id"] in false_negatives else (
                " <-- FALSE POSITIVE" if ex["id"] in false_positives else "")
            rows.append(f"  {ex['id']:36} intended={ex['intended_label']}  P={p:.4f}  {outcome}{miss}")
        print("\n\nSYNTHETIC EXAMPLES (hand-written; not evidence of accuracy) "
              f"- threshold {STATE.threshold}\n" + "\n".join(rows))
        print(f"  False negatives (scams shown as Likely Legitimate): {len(false_negatives)} "
              f"of {sum(e['intended_label'] == 1 for e in SYNTHETIC_EXAMPLES)} -> {false_negatives or 'none'}")
        print(f"  False positives (legitimate shown as Potentially Fraudulent): {len(false_positives)} "
              f"of {sum(e['intended_label'] == 0 for e in SYNTHETIC_EXAMPLES)} -> {false_positives or 'none'}")


if __name__ == "__main__":
    unittest.main()
