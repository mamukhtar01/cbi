import bcrypt from "bcryptjs"

const password = "changeme123"
const hash = bcrypt.hashSync(password, 10)
console.log("[v0] Generated hash:", hash)

// Verify it works
const isValid = bcrypt.compareSync(password, hash)
console.log("[v0] Verification:", isValid)

// Also verify against the hash used in seed
const seedHash = "$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQCasW1KBe5HBfB3.tXrTKnKj0q5G6"
const seedValid = bcrypt.compareSync(password, seedHash)
console.log("[v0] Seed hash verification:", seedValid)
