import {
  Contactsection,
  Detailsection,
  FAQsection,
  Featuressection,
  Feedbacksection,
  Footersection,
  Herosection,
  Navbarsection,
  Previewsection,
  Pricesection,
} from '@/components/section/';

export default function Home() {
  return (
    <>
      <Navbarsection />
      <Herosection />
      <Previewsection />
      <Featuressection />
      <Detailsection />
      <Feedbacksection />
      <Pricesection />
      <FAQsection />
      <Contactsection />
      <Footersection />
    </>
  );
}
