import {
  Detailsection,
  Featuressection,
  Herosection,
  Navbarsection,
  Previewsection,
} from '@/components/section/';

export default function Home() {
  return (
    <>
      <Navbarsection />
      <Herosection />
      <Previewsection />
      <Featuressection />
      <Detailsection />
    </>
  );
}
