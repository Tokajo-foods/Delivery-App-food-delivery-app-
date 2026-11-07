import { LegalDocumentScreen } from '@/components/legal/LegalDocumentScreen';
import { PRIVACY_SECTIONS } from '@/lib/legal/privacy-copy';
import { LEGAL_URLS } from '@/lib/legal/urls';

export default function PrivacyPolicyScreen() {
  return (
    <LegalDocumentScreen
      title="Privacy Policy"
      updated="Effective 8 November 2026"
      summary="How the restaurant app uses outlet, order, and account information."
      publicUrl={LEGAL_URLS.privacy}
      sections={PRIVACY_SECTIONS}
    />
  );
}
