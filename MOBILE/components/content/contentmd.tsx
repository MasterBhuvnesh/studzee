import React from "react";
import { ScrollView, Text, View } from "react-native";
import { EnrichedMarkdownText } from "react-native-enriched-markdown";

type ContentBlock =
  | { type: "text"; value: string }
  | { type: "list"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "formula"; value: string }
  | { type: "code"; value: string };

type Section = {
  title: string;
  content: ContentBlock[];
};

type Props = {
  content: Section[];
};

export const Content = ({ content }: Props) => {
  const [wrap, setWrap] = React.useState(false);

  return (
    <ScrollView className="px-1 py-3">
      {content.map((section, sectionIndex) => (
        <View
          key={`${section.title}-${sectionIndex}`}
          className="mb-6"
        >
          {/* Title */}
          <Text className="text-xl font-product-bold mb-2 text-zinc-800">
            {section.title}
          </Text>

          {/* Blocks */}
          {section.content.map((block, blockIndex) => {
            switch (block.type) {
              case "text":
                return (
                  <Text
                    key={`text-${blockIndex}`}
                    className="text-base leading-7 text-zinc-700 mb-2 font-sans"
                  >
                    {block.value}
                  </Text>
                );

              case "list":
                return (
                  <View key={`list-${blockIndex}`} className="mb-2">
                    {block.items.map((item, idx) => (
                      <View
                        key={`list-${blockIndex}-${idx}`}
                        className="flex-row mb-1"
                      >
                        <Text className="mr-2">•</Text>
                        <Text className="flex-1 text-zinc-700 font-sans">
                          {item}
                        </Text>
                      </View>
                    ))}
                  </View>
                );

              case "table":
                return (
                  <View
                    key={`table-${blockIndex}`}
                    className="border border-zinc-300 mb-3 mt-2"
                  >
                    {/* Header */}
                    <View className="flex-row bg-zinc-200">
                      {block.headers.map((header, idx) => (
                        <Text
                          key={`header-${blockIndex}-${idx}`}
                          className="flex-1 p-2 font-semibold text-zinc-800 border-r border-zinc-300 font-sans"
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
                            className="flex-1 p-2 text-zinc-700 border-t border-r border-zinc-300 font-sans"
                          >
                            {cell}
                          </Text>
                        ))}
                      </View>
                    ))}
                  </View>
                );

              case "formula":
                return (
                  <View key={`formula-${blockIndex}`} className="my-3">
                    <EnrichedMarkdownText
                      flavor="github"
                      markdown={`$$${block.value}$$`}
                    />
                  </View>
                );

              case "code": {
                const lines = block.value.split("\n");

                return (
                  <View
                    key={`code-${blockIndex}`}
                    className="my-4 rounded-xl border border-zinc-300 bg-zinc-50"
                  >
                    {/* Header */}
                    <View className="flex-row justify-between items-center px-3 py-2 border-b border-zinc-200">
                      <Text className="text-xs text-zinc-500 font-sans">
                        code
                      </Text>

                      <Text
                        onPress={() => setWrap(!wrap)}
                        className="text-xs text-blue-500 font-sans"
                      >
                        {wrap ? "Unwrap" : "Wrap"}
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
                            trimmed.startsWith("#") ||
                            trimmed.startsWith("//") ||
                            trimmed.startsWith("/*") ||
                            trimmed.startsWith("*") ||
                            trimmed.endsWith("*/");

                          return (
                            <Text
                              key={`line-${blockIndex}-${idx}`}
                              style={{
                                fontFamily: "monospace",
                                flexWrap: wrap ? "wrap" : "nowrap",
                                width: wrap ? "100%" : "auto",
                                lineHeight: 18,
                              }}
                              className="text-xs font-sans"
                            >
                              {/* Line number */}
                              <Text className="text-zinc-400 font-sans mr-2">
                                {/* {String(idx + 1).padStart(3, " ")}{" "} */}
                                - {" "}
                              </Text>

                              {/* Code */}
                              <Text
                                className={
                                  isComment
                                    ? "text-zinc-400"
                                    : "text-zinc-800"
                                }
                              >
                                {line || " "}
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