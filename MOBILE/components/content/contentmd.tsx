import type { ContentSection } from '@/types/api';
import React from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';

// Exported so screens that need to render a raw markdown string directly
// (rather than through the typed ContentSection blocks below) can reuse the
// same web fallback instead of duplicating the platform check.
export const EnrichedMarkdownText =
  Platform.OS !== 'web'
    ? require('react-native-enriched-markdown').EnrichedMarkdownText
    : ({ markdown }: { markdown: string; flavor?: string }) => (
        <Text>{markdown}</Text>
      );

type Props = {
  content: ContentSection[];
};

export const Content = ({ content }: Props) => {
  const [wrap, setWrap] = React.useState(false);

  return (
    <ScrollView className="px-1 py-3">
      {content.map((section, sectionIndex) => (
        <View key={`${section.title}-${sectionIndex}`} className="mb-6">
          {/* Title */}
          <Text className="mb-2 font-product-bold text-xl text-zinc-800">
            {section.title}
          </Text>

          {/* Blocks */}
          {section.content.map((block, blockIndex) => {
            switch (block.type) {
              case 'text':
                return (
                  <Text
                    key={`text-${blockIndex}`}
                    className="mb-2 font-sans text-base leading-7 text-zinc-700"
                  >
                    {block.value}
                  </Text>
                );

              case 'list':
                return (
                  <View key={`list-${blockIndex}`} className="mb-2">
                    {block.items.map((item, idx) => (
                      <View
                        key={`list-${blockIndex}-${idx}`}
                        className="mb-1 flex-row"
                      >
                        <Text className="mr-2">•</Text>
                        <Text className="flex-1 font-sans text-zinc-700">
                          {item}
                        </Text>
                      </View>
                    ))}
                  </View>
                );

              case 'table':
                return (
                  <View
                    key={`table-${blockIndex}`}
                    className="mb-3 mt-2 border border-zinc-300"
                  >
                    {/* Header */}
                    <View className="flex-row bg-zinc-200">
                      {block.headers.map((header, idx) => (
                        <Text
                          key={`header-${blockIndex}-${idx}`}
                          className="flex-1 border-r border-zinc-300 p-2 font-sans font-semibold text-zinc-800"
                        >
                          {header}
                        </Text>
                      ))}
                    </View>

                    {/* Rows */}
                    {block.rows.map((row, rIdx) => (
                      <View
                        key={`row-${blockIndex}-${rIdx}`}
                        className="flex-row"
                      >
                        {row.map((cell, cIdx) => (
                          <Text
                            key={`cell-${blockIndex}-${rIdx}-${cIdx}`}
                            className="flex-1 border-r border-t border-zinc-300 p-2 font-sans text-zinc-700"
                          >
                            {cell}
                          </Text>
                        ))}
                      </View>
                    ))}
                  </View>
                );

              case 'formula':
                return (
                  <View key={`formula-${blockIndex}`} className="my-3">
                    <EnrichedMarkdownText
                      flavor="github"
                      markdown={`$$${block.value}$$`}
                    />
                  </View>
                );

              case 'code': {
                const lines = block.value.split('\n');

                return (
                  <View
                    key={`code-${blockIndex}`}
                    className="my-4 rounded-xl border border-zinc-300 bg-zinc-50"
                  >
                    {/* Header */}
                    <View className="flex-row items-center justify-between border-b border-zinc-200 px-3 py-2">
                      <Text className="font-sans text-xs text-zinc-500">
                        code
                      </Text>

                      <Text
                        onPress={() => setWrap(!wrap)}
                        className="font-sans text-xs text-blue-500"
                      >
                        {wrap ? 'Unwrap' : 'Wrap'}
                      </Text>
                    </View>

                    <ScrollView
                      horizontal={!wrap}
                      showsHorizontalScrollIndicator={false}
                    >
                      <View className="p-3">
                        {lines.map((line, idx) => {
                          const trimmed = line.trim();

                          const isComment =
                            trimmed.startsWith('#') ||
                            trimmed.startsWith('//') ||
                            trimmed.startsWith('/*') ||
                            trimmed.startsWith('*') ||
                            trimmed.endsWith('*/');

                          return (
                            <Text
                              key={`line-${blockIndex}-${idx}`}
                              style={{
                                fontFamily: 'monospace',
                                flexWrap: wrap ? 'wrap' : 'nowrap',
                                width: wrap ? '100%' : 'auto',
                                lineHeight: 18,
                              }}
                              className="font-sans text-xs"
                            >
                              {/* Line number */}
                              <Text className="mr-2 font-sans text-zinc-400">
                                {/* {String(idx + 1).padStart(3, " ")}{" "} */}
                                -{' '}
                              </Text>

                              {/* Code */}
                              <Text
                                className={
                                  isComment ? 'text-zinc-400' : 'text-zinc-800'
                                }
                              >
                                {line || ' '}
                              </Text>
                            </Text>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>
                );
              }

              default:
                return null;
            }
          })}
        </View>
      ))}
    </ScrollView>
  );
};
