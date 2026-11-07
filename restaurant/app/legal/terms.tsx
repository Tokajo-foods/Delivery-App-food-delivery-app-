import { LegalDocumentScreen } from '@/components/legal/LegalDocumentScreen';
import { TERMS_SECTIONS } from '@/lib/legal/terms-copy';
import { LEGAL_URLS } from '@/lib/legal/urls';

export default function TermsScreen() {
  return (
    <LegalDocumentScreen
      title="Terms of Use"
      updated="Effective 8 November 2026"
      summary="The rules for listing your kitchen, taking orders, and getting paid."
      publicUrl={LEGAL_URLS.terms}
      sections={TERMS_SECTIONS}
    />
  );
}
