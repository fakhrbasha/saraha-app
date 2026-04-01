import { compareSync, hashSync } from "bcrypt";

export function Hash({ plan_text, salt_round = process.env.SALT_ROUND }) {
    return hashSync(plan_text, Number(salt_round))
}
export function Compare({ plan_text, cipher_text }) {
    return compareSync(plan_text, cipher_text)
}