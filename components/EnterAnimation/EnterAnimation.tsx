import { motion } from "motion/react"


export default function EnterAnimation() {
    <motion.li
        initial={{ x: -500, opacity: 0, scale: 1 }}
        animate={{ transition: { duration: 0.8 }, opacity: 1, scale: 1 }}
    />
}