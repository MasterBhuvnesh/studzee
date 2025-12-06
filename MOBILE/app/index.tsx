import { Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
      }}
    >
      <Text className="text-2xl font-sans ">
        Hello from Google Sans (Variable)
      </Text>
      <Text className="text-2xl font-product">Hello from Product Sans</Text>
    </View>
  );
}
