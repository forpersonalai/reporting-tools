import "dotenv/config";

import { withAccelerate } from "@prisma/extension-accelerate";
import { PrismaClient } from "./generated/prisma/client.js";

const prisma = new PrismaClient().$extends(withAccelerate());

async function main() {
  const user = await prisma.user.upsert({
    where: {
      email: "admin@reporting.com",
    },
    update: {
      name: "Admin",
      department: "Demo",
    },
    create: {
      name: "Admin",
      email: "admin@reporting.com",
      password: "password",
      department: "Demo",
      role: "USER",
    },
  });

  console.log(user);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
