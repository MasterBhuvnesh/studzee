import { Text } from "react-native"

type Props = {
  content: string
}

export const Content = ({ content }: Props) => {
  return <Text className="font-sans text-base leading-7 text-zinc-700">
                 {content}
                </Text>
}

