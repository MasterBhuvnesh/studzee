const { prisma } = require('./src/config');
(async () => {
  const q = await prisma.quest.findFirst({ where: { type: 'mcq' } });
  console.log(JSON.stringify(q.payload, null, 1).slice(0, 900));
  await prisma.$disconnect();
})();
