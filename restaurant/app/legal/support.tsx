import { LegalDocumentScreen } from '@/components/legal/LegalDocumentScreen';
import { SUPPORT_SECTIONS } from '@/lib/legal/support-copy';
import { LEGAL_URLS } from '@/lib/legal/urls';

export default function SupportScreen() {
  return (
    <LegalDocumentScreen
      title="Support"
      updated="Updated 26 October 2026"
      publicUrl={LEGAL_URLS.support}
      sections={SUPPORT_SECTIONS}
      email
    />
  );
}
