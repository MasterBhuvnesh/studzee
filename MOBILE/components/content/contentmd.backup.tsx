import type { ContentSection } from '@/types/api';
import { Text } from 'react-native';

type Props = {
  content: ContentSection[];
};

// const markdown = `
// # Welcome to Markdown!

// This is a paragraph with **bold**, *italic*, and [links](https://reactnative.dev).

// - List item one
// - List item two
//   - Nested item
// `;
export const Content = ({ content }: Props) => {
  return (
    <Text className="font-sans text-base leading-7 text-zinc-700">
      {/* <EnrichedMarkdownText
  flavor="github"
  markdown={markdown}
  onLinkPress={({ url }) => Linking.openURL(url)}
  markdownStyle={{
    table: {
      fontSize: 14,
      borderColor: '#E5E7EB',
      borderRadius: 8,
      headerBackgroundColor: '#F3F4F6',
      headerFontFamily: 'System-Bold',
      cellPaddingHorizontal: 12,
      cellPaddingVertical: 8,
    },
  }}
/> */}
      {JSON.stringify(content)}
    </Text>
  );
};
