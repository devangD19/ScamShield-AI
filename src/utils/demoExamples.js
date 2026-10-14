/**
 * DEMO sample inputs for the Analyze page.
 *
 * IMPORTANT: these are *inputs only*. Selecting one merely fills the form;
 * no prediction is generated locally. The result always comes from the
 * backend model after the user presses "Analyze Job".
 */
export const DEMO_EXAMPLES = [
  {
    id: 'registration-fee',
    title: 'Internship registration fee',
    tag: 'Registration fee',
    jobTitle: 'Web Development Intern',
    companyName: 'BrightPath Solutions',
    recruiterEmail: 'hr@brightpath-careers.in',
    source: 'WhatsApp',
    description:
      'Congratulations! You have been selected for a 2 month paid web development internship at BrightPath Solutions. ' +
      'Stipend will be Rs. 15,000 per month. To confirm your seat you must first pay a one-time registration fee of Rs. 1,499 ' +
      'via UPI before today 6 PM. After payment we will share the offer letter and login credentials. Do not share this opportunity ' +
      'with anyone else, seats are limited. Reply with your full name, address and payment screenshot to confirm.',
  },
  {
    id: 'upi-deposit',
    title: 'UPI deposit for onboarding',
    tag: 'UPI deposit',
    jobTitle: 'Data Entry Operator',
    companyName: 'QuickHire Consultancy',
    recruiterEmail: 'onboarding@quickhire-consult.co',
    source: 'Telegram',
    description:
      'Hello candidate, your profile has been shortlisted for a work from home data entry role paying Rs. 25,000 monthly. ' +
      'A refundable security deposit of Rs. 500 is required to activate your employee ID and project dashboard. Send the amount ' +
      'to the UPI id quickhire.hrcareers@okaxis immediately to lock the offer. The deposit is fully refundable after 15 days of joining. ' +
      'Share your Aadhaar number and a selfie for KYC verification.',
  },
  {
    id: 'work-from-home',
    title: 'Suspicious work-from-home job',
    tag: 'Work from home',
    jobTitle: 'Product Reviewer (Part Time)',
    companyName: 'Global Reach Media',
    recruiterEmail: 'careers@globalreachmedia.work',
    source: 'Other',
    description:
      'Urgent hiring for a part-time product reviewer. Work only 1 hour daily from home and earn Rs. 8,000 per day directly in your bank account. ' +
      'No interview, no experience needed, no resume required. You only need a smartphone and a bank account. Registration closes tonight, ' +
      'confirm your slot by sharing your OTP with our verification team. Payment guaranteed every Friday.',
  },
  {
    id: 'fake-campus',
    title: 'Fake campus recruitment message',
    tag: 'Campus recruitment',
    jobTitle: 'Graduate Engineer Trainee',
    companyName: 'TataLine Motors',
    recruiterEmail: 'campus.recruitment2026@gmail.com',
    source: 'WhatsApp',
    description:
      'Dear Student, as part of our campus drive we are hiring final year students for the Graduate Engineer Trainee role with a package of Rs. 12 LPA. ' +
      'Your college placement cell has shared your number. To complete your application, deposit Rs. 2,500 as interview processing charge and send your ' +
      'college ID card photo on this number. Interview will be conducted over WhatsApp chat tomorrow. Do not contact the company directly, this drive is exclusive.',
  },
  {
    id: 'unrealistic-salary',
    title: 'Unrealistic salary promise',
    tag: 'Salary promise',
    jobTitle: 'Social Media Intern',
    companyName: 'NovaDigital Hub',
    recruiterEmail: 'hr.novadigital@gmail.com',
    source: 'Other',
    description:
      'High salary guaranteed! Earn Rs. 60,000 per month working 2 hours a day as a social media intern. Freshers welcome, no skills needed, ' +
      'daily payouts, fully automatic income. Just refer 5 friends and join our paid member group by paying Rs. 999 entry fee. ' +
      'We guarantee 100% returns and instant offer letters. Limited slots available, act now.',
  },
  {
    id: 'legitimate-internship',
    title: 'Legitimate internship description',
    tag: 'Looks genuine',
    jobTitle: 'Frontend Engineering Intern',
    companyName: 'Krishna Infotech Pvt Ltd',
    recruiterEmail: 'internships@krishnainfotech.com',
    source: 'Internshala',
    description:
      'Krishna Infotech is hiring frontend engineering interns for a 6 month on-site internship in Pune. ' +
      'Stipend: Rs. 25,000 per month. Responsibilities: build and maintain React components, write unit tests, and work with the design team ' +
      'on accessibility improvements. Requirements: solid HTML, CSS and JavaScript basics; familiarity with React is a plus; portfolio or GitHub link ' +
      'required. Selection process: online coding round, technical interview, HR discussion. Apply only through our official career page at ' +
      'krishnainfotech.com/careers. We never ask for payment at any stage.',
  },
];
