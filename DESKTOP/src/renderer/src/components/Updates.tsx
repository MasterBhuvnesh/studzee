import { motion } from "framer-motion";
import { Rocket } from "lucide-react";
import { AppIcon } from "./AppIcon";

function IconRotate() {
  return (
    <motion.div
      animate={{ rotate: [0,10,0] }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      style={{ fontSize: "48px", display: "inline-block" }}
    >
      <AppIcon Icon={Rocket} size={14} strokeWidth={2.5} color="#ffffff" />
    </motion.div>
  );
}

export function Updates() {
    return (
        <div className="bg-blue-500 text-white text-center flex items-center justify-center gap-2">
            <IconRotate />
            <span className="text-sm">Updates</span>
        </div>
    )
}