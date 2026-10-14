import { API_BASE_URL, ApiError, request } from './api.js';

/**
 * Analysis API
 *
 * POST {VITE_API_BASE_URL}/api/predict  (Flask backend in /backend)
 * Contract documented in docs/API_CONTRACT.md.
 * The backend applies the decision threshold; the UI only displays the
 * returned prediction and fraud probability. When signed in, the backend
 * also saves the analysis to the user's history.
 * Only the title and description are used by the model; company, email
 * and source are stored for the history view.
 */
export async function analyzeJob(formValues) {
  const payload = {
    job_description: formValues.description?.trim() ?? '',
    title: formValues.jobTitle?.trim() ?? '',
    company_name: formValues.companyName?.trim() ?? '',
    recruiter_email: formValues.recruiterEmail?.trim() ?? '',
    source: formValues.source ?? '',
  };

  const data = await request({
    method: 'post',
    // This endpoint is not under the /api/v1 prefix used by the other services.
    baseURL: API_BASE_URL,
    url: '/api/predict',
    data: payload,
  });

  const probability = data.fraud_probability;
  if (
    data.success !== true ||
    typeof data.is_fraudulent !== 'boolean' ||
    typeof probability !== 'number' ||
    !Number.isFinite(probability) ||
    probability < 0 ||
    probability > 1
  ) {
    throw new ApiError('The analysis service returned an incomplete prediction.', {
      kind: 'invalid',
      details: data,
    });
  }

  return {
    ...data,
    job_title: payload.title,
    company_name: payload.company_name,
    created_at: data.created_at ?? new Date().toISOString(),
  };
}
