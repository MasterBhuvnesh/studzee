import {
  Detailsection,
  FAQsection,
  Featuressection,
  Feedbacksection,
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
    </>
  );
}
